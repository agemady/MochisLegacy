-- Mochi's Legacy — scheduling schema (gaggle walks, RSVPs, walk-day check-in)
--
-- Apply after schema.sql. Lives inside a SHARED Supabase project, so:
--   * every object is prefixed `mochi_`;
--   * nothing touches Supabase Auth (no auth.users triggers, no sign-in):
--     the other app's signup trigger would enroll every dog owner into it.
--
-- Access model: personal links. Every row in mochi_people gets a random
-- 32-hex-char access_token; the site sends it to SECURITY DEFINER functions
-- (`/schedule#k=<token>`). Tables have RLS on, no policies and no grants, so
-- the anon key can only call the functions granted at the bottom. Admins are
-- people with is_admin = true; the same link opens the walk-day tools.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.mochi_people (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (length(name) between 1 and 120),
  email         text check (length(email) <= 254),
  phone         text check (length(phone) <= 40),
  is_admin      boolean not null default false,
  access_token  text not null unique default replace(gen_random_uuid()::text, '-', ''),
  notes         text,
  created_at    timestamptz not null default now()
);

create unique index if not exists mochi_people_email_lower_idx
  on public.mochi_people (lower(email)) where email is not null;

create table if not exists public.mochi_dogs (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.mochi_people (id) on delete cascade,
  name        text not null check (length(name) between 1 and 60),
  tier        text not null default 'gaggle'
              check (tier in ('gaggle', 'candidate', 'therapy')),
  status      text not null default 'active'
              check (status in ('active', 'retired')),
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists mochi_dogs_owner_id_idx on public.mochi_dogs (owner_id);
create unique index if not exists mochi_dogs_owner_name_idx
  on public.mochi_dogs (owner_id, lower(name));

create table if not exists public.mochi_walks (
  id            uuid primary key default gen_random_uuid(),
  title         text not null default 'Gaggle walk' check (length(title) between 1 and 80),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  meeting_spot  text not null check (length(meeting_spot) between 1 and 160),
  cap           integer not null default 15,
  status        text not null default 'draft'
                check (status in ('draft', 'published', 'done')),
  notes         text check (length(notes) <= 1000),
  created_at    timestamptz not null default now(),
  constraint mochi_walks_ends_after_starts check (ends_at > starts_at),
  constraint mochi_walks_cap_range check (cap between 1 and 200)
);

create index if not exists mochi_walks_starts_at_idx on public.mochi_walks (starts_at);

-- One row per (walk, dog). Standing is derived, never stored: active rows
-- (opted_out_at is null) ordered by joined_at fill the cap first; the rest
-- are the waitlist. An opt-out therefore promotes the next dog automatically.
create table if not exists public.mochi_walk_rsvps (
  walk_id        uuid not null references public.mochi_walks (id) on delete cascade,
  dog_id         uuid not null references public.mochi_dogs (id) on delete cascade,
  waiver_signed  boolean not null default false,
  photo_consent  boolean not null default false,
  joined_at      timestamptz not null default now(),
  checked_in_at  timestamptz,
  opted_out_at   timestamptz,
  opted_out_by   text check (opted_out_by in ('owner', 'admin')),
  created_at     timestamptz not null default now(),
  primary key (walk_id, dog_id)
);

create index if not exists mochi_walk_rsvps_dog_id_idx on public.mochi_walk_rsvps (dog_id);

alter table public.mochi_people     enable row level security;
alter table public.mochi_dogs       enable row level security;
alter table public.mochi_walks      enable row level security;
alter table public.mochi_walk_rsvps enable row level security;

revoke all on table
  public.mochi_people, public.mochi_dogs, public.mochi_walks, public.mochi_walk_rsvps
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Internal helpers (not callable from the site)
-- ---------------------------------------------------------------------------

create or replace function public.mochi_person_for(p_token text)
returns public.mochi_people
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v public.mochi_people;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then
    raise exception 'This link isn''t valid. Ask a founder for a fresh one.';
  end if;
  select * into v from public.mochi_people where access_token = p_token;
  if not found then
    raise exception 'This link isn''t valid. Ask a founder for a fresh one.';
  end if;
  return v;
end;
$$;

create or replace function public.mochi_require_admin(p_token text)
returns public.mochi_people
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v public.mochi_people := public.mochi_person_for(p_token);
begin
  if not v.is_admin then
    raise exception 'This link doesn''t have walk-admin access.';
  end if;
  return v;
end;
$$;

create or replace function public.mochi_standing(p_walk_id uuid)
returns table (dog_id uuid, standing text, waitlist_position integer)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with active as (
    select r.dog_id,
           row_number() over (order by r.joined_at, r.dog_id)::integer as n
    from public.mochi_walk_rsvps r
    where r.walk_id = p_walk_id and r.opted_out_at is null
  )
  select a.dog_id,
         case when a.n <= w.cap then 'confirmed' else 'waitlisted' end,
         case when a.n <= w.cap then null else a.n - w.cap end
  from active a
  cross join public.mochi_walks w
  where w.id = p_walk_id
  union all
  select r.dog_id, 'opted_out', null
  from public.mochi_walk_rsvps r
  where r.walk_id = p_walk_id and r.opted_out_at is not null
$$;

create or replace function public.mochi_walk_json(p_walk public.mochi_walks)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', p_walk.id,
    'title', p_walk.title,
    'starts_at', p_walk.starts_at,
    'ends_at', p_walk.ends_at,
    'meeting_spot', p_walk.meeting_spot,
    'cap', p_walk.cap,
    'status', p_walk.status,
    'notes', p_walk.notes,
    'confirmed', (select count(*) from public.mochi_standing(p_walk.id) s where s.standing = 'confirmed'),
    'waitlisted', (select count(*) from public.mochi_standing(p_walk.id) s where s.standing = 'waitlisted'),
    'checked_in', (select count(*) from public.mochi_walk_rsvps r
                   where r.walk_id = p_walk.id and r.checked_in_at is not null and r.opted_out_at is null),
    'opted_out', (select count(*) from public.mochi_walk_rsvps r
                  where r.walk_id = p_walk.id and r.opted_out_at is not null)
  )
$$;

create or replace function public.mochi_person_json(p_person public.mochi_people, p_with_token boolean)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', p_person.id,
    'name', p_person.name,
    'email', p_person.email,
    'phone', p_person.phone,
    'is_admin', p_person.is_admin,
    'access_token', case when p_with_token then p_person.access_token end,
    'dogs', coalesce((
      select jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'tier', d.tier, 'status', d.status)
                       order by lower(d.name))
      from public.mochi_dogs d where d.owner_id = p_person.id
    ), '[]'::jsonb)
  )
$$;

-- ---------------------------------------------------------------------------
-- Public: anyone with the site
-- ---------------------------------------------------------------------------

-- Upcoming published walks with capacity counts (no names, no PII).
create or replace function public.mochi_upcoming_walks()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(public.mochi_walk_json(w) order by w.starts_at), '[]'::jsonb)
  from (
    select * from public.mochi_walks
    where status = 'published' and ends_at > now()
    order by starts_at
    limit 12
  ) w
$$;

-- ---------------------------------------------------------------------------
-- Owner: personal link
-- ---------------------------------------------------------------------------

-- Who the link belongs to, their active dogs, and their standing on every
-- upcoming published walk.
create or replace function public.mochi_me(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v public.mochi_people := public.mochi_person_for(p_token);
begin
  return jsonb_build_object(
    'person', jsonb_build_object('id', v.id, 'name', v.name, 'is_admin', v.is_admin),
    'dogs', coalesce((
      select jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'tier', d.tier) order by lower(d.name))
      from public.mochi_dogs d
      where d.owner_id = v.id and d.status = 'active'
    ), '[]'::jsonb),
    'rsvps', coalesce((
      select jsonb_agg(jsonb_build_object(
        'walk_id', r.walk_id,
        'dog_id', r.dog_id,
        'waiver_signed', r.waiver_signed,
        'photo_consent', r.photo_consent,
        'checked_in_at', r.checked_in_at,
        'standing', s.standing,
        'waitlist_position', s.waitlist_position
      ))
      from public.mochi_walk_rsvps r
      join public.mochi_dogs d on d.id = r.dog_id and d.owner_id = v.id
      join public.mochi_walks w on w.id = r.walk_id and w.status = 'published' and w.ends_at > now()
      cross join lateral (
        select s.standing, s.waitlist_position
        from public.mochi_standing(r.walk_id) s where s.dog_id = r.dog_id
      ) s
      where r.opted_out_at is null
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.mochi_rsvp(
  p_token          text,
  p_walk_id        uuid,
  p_dog_id         uuid,
  p_waiver_signed  boolean,
  p_photo_consent  boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_person public.mochi_people := public.mochi_person_for(p_token);
  v_dog    public.mochi_dogs;
  v_walk   public.mochi_walks;
  v_out    jsonb;
begin
  select * into v_dog from public.mochi_dogs where id = p_dog_id and owner_id = v_person.id;
  if not found then
    raise exception 'That dog isn''t on your account.';
  end if;
  if v_dog.status <> 'active' then
    raise exception '% isn''t active on the roster right now.', v_dog.name;
  end if;

  -- Lock the walk so concurrent sign-ups are placed one at a time.
  select * into v_walk from public.mochi_walks where id = p_walk_id for update;
  if not found or v_walk.status <> 'published' then
    raise exception 'That walk isn''t open for sign-ups.';
  end if;
  if v_walk.starts_at <= now() then
    raise exception 'Sign-ups for this walk are closed.';
  end if;
  if not coalesce(p_waiver_signed, false) then
    raise exception 'Please agree to the walk waiver to sign up.';
  end if;

  -- Already in (confirmed or waitlisted): return the current standing.
  if not exists (
    select 1 from public.mochi_walk_rsvps
    where walk_id = p_walk_id and dog_id = p_dog_id and opted_out_at is null
  ) then
    -- Welfare: one walk per dog per (Mountain Time) day.
    if exists (
      select 1
      from public.mochi_walk_rsvps r
      join public.mochi_walks w on w.id = r.walk_id
      where r.dog_id = p_dog_id
        and r.walk_id <> p_walk_id
        and r.opted_out_at is null
        and w.status = 'published'
        and (w.starts_at at time zone 'America/Denver')::date
            = (v_walk.starts_at at time zone 'America/Denver')::date
    ) then
      raise exception 'One walk a day: % is already on another walk that day.', v_dog.name;
    end if;

    insert into public.mochi_walk_rsvps (walk_id, dog_id, waiver_signed, photo_consent, joined_at)
    values (p_walk_id, p_dog_id, true, coalesce(p_photo_consent, false), now())
    on conflict (walk_id, dog_id) do update
      set waiver_signed = true,
          photo_consent = excluded.photo_consent,
          joined_at     = now(),
          checked_in_at = null,
          opted_out_at  = null,
          opted_out_by  = null;
  end if;

  select jsonb_build_object('standing', s.standing, 'waitlist_position', s.waitlist_position)
    into v_out
  from public.mochi_standing(p_walk_id) s where s.dog_id = p_dog_id;
  return v_out;
end;
$$;

create or replace function public.mochi_opt_out(p_token text, p_walk_id uuid, p_dog_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_person public.mochi_people := public.mochi_person_for(p_token);
begin
  if not exists (select 1 from public.mochi_dogs where id = p_dog_id and owner_id = v_person.id) then
    raise exception 'That dog isn''t on your account.';
  end if;
  update public.mochi_walk_rsvps r
     set opted_out_at = now(), opted_out_by = 'owner'
   where r.walk_id = p_walk_id and r.dog_id = p_dog_id and r.opted_out_at is null
     and exists (select 1 from public.mochi_walks w where w.id = r.walk_id and w.ends_at > now());
  if not found then
    raise exception 'That dog isn''t signed up for this walk.';
  end if;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin: personal link of a person with is_admin = true
-- ---------------------------------------------------------------------------

-- Walks for the admin tools: everything not finished long ago, any status.
create or replace function public.mochi_admin_walks(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.mochi_require_admin(p_token);
  return coalesce((
    select jsonb_agg(public.mochi_walk_json(w) order by w.starts_at)
    from public.mochi_walks w
    where w.ends_at > now() - interval '14 days' or w.status = 'draft'
  ), '[]'::jsonb);
end;
$$;

create or replace function public.mochi_admin_save_walk(
  p_token        text,
  p_id           uuid,
  p_title        text,
  p_starts_at    timestamptz,
  p_ends_at      timestamptz,
  p_meeting_spot text,
  p_cap          integer,
  p_status       text,
  p_notes        text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_walk public.mochi_walks;
begin
  perform public.mochi_require_admin(p_token);
  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then
    raise exception 'The walk needs a start time and an end time after it.';
  end if;
  if coalesce(trim(p_meeting_spot), '') = '' then
    raise exception 'Add a meeting spot.';
  end if;
  if p_cap is null or p_cap not between 1 and 200 then
    raise exception 'Capacity must be between 1 and 200 dogs.';
  end if;
  if p_status not in ('draft', 'published', 'done') then
    raise exception 'Status must be draft, published, or done.';
  end if;

  if p_id is null then
    insert into public.mochi_walks (title, starts_at, ends_at, meeting_spot, cap, status, notes)
    values (coalesce(nullif(trim(p_title), ''), 'Gaggle walk'), p_starts_at, p_ends_at,
            trim(p_meeting_spot), p_cap, p_status, nullif(trim(coalesce(p_notes, '')), ''))
    returning * into v_walk;
  else
    update public.mochi_walks
       set title = coalesce(nullif(trim(p_title), ''), 'Gaggle walk'),
           starts_at = p_starts_at,
           ends_at = p_ends_at,
           meeting_spot = trim(p_meeting_spot),
           cap = p_cap,
           status = p_status,
           notes = nullif(trim(coalesce(p_notes, '')), '')
     where id = p_id
    returning * into v_walk;
    if not found then
      raise exception 'That walk no longer exists.';
    end if;
  end if;
  return public.mochi_walk_json(v_walk);
end;
$$;

-- Walk-day roster: every RSVP with dog, owner contact, waiver and standing.
create or replace function public.mochi_admin_roster(p_token text, p_walk_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_walk public.mochi_walks;
begin
  perform public.mochi_require_admin(p_token);
  select * into v_walk from public.mochi_walks where id = p_walk_id;
  if not found then
    raise exception 'That walk no longer exists.';
  end if;
  return jsonb_build_object(
    'walk', public.mochi_walk_json(v_walk),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'dog_id', d.id,
        'dog_name', d.name,
        'owner_name', p.name,
        'owner_phone', p.phone,
        'waiver_signed', r.waiver_signed,
        'photo_consent', r.photo_consent,
        'joined_at', r.joined_at,
        'checked_in_at', r.checked_in_at,
        'opted_out_at', r.opted_out_at,
        'opted_out_by', r.opted_out_by,
        'standing', s.standing,
        'waitlist_position', s.waitlist_position
      ) order by lower(d.name), p.name)
      from public.mochi_walk_rsvps r
      join public.mochi_dogs d on d.id = r.dog_id
      join public.mochi_people p on p.id = d.owner_id
      join public.mochi_standing(p_walk_id) s on s.dog_id = r.dog_id
      where r.walk_id = p_walk_id
    ), '[]'::jsonb)
  );
end;
$$;

-- Walk-day actions on one dog:
--   check_in / undo_check_in / opt_out / restore (undo an opt-out, keeps the
--   original place in line) / waiver (paper waiver signed at the park) /
--   add (put a roster dog on the walk; waiver stays unsigned until 'waiver').
create or replace function public.mochi_admin_mark(
  p_token   text,
  p_walk_id uuid,
  p_dog_id  uuid,
  p_action  text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.mochi_require_admin(p_token);
  if not exists (select 1 from public.mochi_walks where id = p_walk_id) then
    raise exception 'That walk no longer exists.';
  end if;

  if p_action = 'add' then
    if not exists (select 1 from public.mochi_dogs where id = p_dog_id and status = 'active') then
      raise exception 'Only active roster dogs can join a walk.';
    end if;
    insert into public.mochi_walk_rsvps (walk_id, dog_id, waiver_signed, joined_at)
    values (p_walk_id, p_dog_id, false, now())
    on conflict (walk_id, dog_id) do update
      set opted_out_at = null, opted_out_by = null
      where mochi_walk_rsvps.opted_out_at is not null;
    return true;
  end if;

  update public.mochi_walk_rsvps r set
    checked_in_at = case p_action
                      when 'check_in' then coalesce(r.checked_in_at, now())
                      when 'undo_check_in' then null
                      else r.checked_in_at end,
    opted_out_at  = case p_action
                      when 'opt_out' then coalesce(r.opted_out_at, now())
                      when 'restore' then null
                      else r.opted_out_at end,
    opted_out_by  = case p_action
                      when 'opt_out' then coalesce(r.opted_out_by, 'admin')
                      when 'restore' then null
                      else r.opted_out_by end,
    waiver_signed = case when p_action = 'waiver' then true else r.waiver_signed end
  where r.walk_id = p_walk_id and r.dog_id = p_dog_id
    and p_action in ('check_in', 'undo_check_in', 'opt_out', 'restore', 'waiver');
  if not found then
    if p_action not in ('check_in', 'undo_check_in', 'opt_out', 'restore', 'waiver') then
      raise exception 'Unknown action.';
    end if;
    raise exception 'That dog isn''t signed up for this walk.';
  end if;
  return true;
end;
$$;

-- Everyone on the roster, with dogs and personal-link tokens.
create or replace function public.mochi_admin_people(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.mochi_require_admin(p_token);
  return coalesce((
    select jsonb_agg(public.mochi_person_json(p, true) order by lower(p.name))
    from public.mochi_people p
  ), '[]'::jsonb);
end;
$$;

-- Add an owner (found by email when one is given) and optionally their dog.
create or replace function public.mochi_admin_add_owner(
  p_token    text,
  p_name     text,
  p_email    text default null,
  p_phone    text default null,
  p_dog_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_person public.mochi_people;
  v_email  text := lower(nullif(trim(coalesce(p_email, '')), ''));
begin
  perform public.mochi_require_admin(p_token);
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Add the owner''s name.';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'That email doesn''t look right.';
  end if;

  if v_email is not null then
    select * into v_person from public.mochi_people where lower(email) = v_email;
  end if;
  if v_person.id is null then
    insert into public.mochi_people (name, email, phone)
    values (trim(p_name), v_email, nullif(trim(coalesce(p_phone, '')), ''))
    returning * into v_person;
  end if;

  if coalesce(trim(p_dog_name), '') <> '' then
    insert into public.mochi_dogs (owner_id, name)
    values (v_person.id, trim(p_dog_name))
    on conflict (owner_id, lower(name)) do nothing;
  end if;
  return public.mochi_person_json(v_person, true);
end;
$$;

create or replace function public.mochi_admin_add_dog(p_token text, p_owner_id uuid, p_dog_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_person public.mochi_people;
begin
  perform public.mochi_require_admin(p_token);
  select * into v_person from public.mochi_people where id = p_owner_id;
  if not found then
    raise exception 'That owner no longer exists.';
  end if;
  if coalesce(trim(p_dog_name), '') = '' then
    raise exception 'Add the dog''s name.';
  end if;
  insert into public.mochi_dogs (owner_id, name)
  values (v_person.id, trim(p_dog_name))
  on conflict (owner_id, lower(name)) do update set status = 'active';
  return public.mochi_person_json(v_person, true);
end;
$$;

-- Replace a person's link (the old one stops working immediately).
create or replace function public.mochi_admin_new_link(p_token text, p_person_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_person public.mochi_people;
begin
  perform public.mochi_require_admin(p_token);
  update public.mochi_people
     set access_token = replace(gen_random_uuid()::text, '-', '')
   where id = p_person_id
  returning * into v_person;
  if not found then
    raise exception 'That person no longer exists.';
  end if;
  return public.mochi_person_json(v_person, true);
end;
$$;

-- Open interest from the landing page (new + contacted).
create or replace function public.mochi_admin_interest(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.mochi_require_admin(p_token);
  return jsonb_build_object(
    'dogs', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.created_at desc)
      from public.mochi_dog_applications a where a.status in ('new', 'contacted')
    ), '[]'::jsonb),
    'volunteers', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.created_at desc)
      from public.mochi_volunteer_applications a where a.status in ('new', 'contacted')
    ), '[]'::jsonb),
    'pledges', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.created_at desc)
      from public.mochi_donation_pledges a where a.status in ('new', 'contacted')
    ), '[]'::jsonb),
    'subscribers', (select count(*) from public.mochi_subscribers)
  );
end;
$$;

create or replace function public.mochi_admin_set_interest_status(
  p_token  text,
  p_kind   text,
  p_id     uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.mochi_require_admin(p_token);
  if p_status not in ('new', 'contacted', 'approved', 'archived') then
    raise exception 'Unknown status.';
  end if;
  if p_kind = 'dog' then
    update public.mochi_dog_applications set status = p_status where id = p_id;
  elsif p_kind = 'volunteer' then
    update public.mochi_volunteer_applications set status = p_status where id = p_id;
  elsif p_kind = 'pledge' then
    update public.mochi_donation_pledges set status = p_status where id = p_id;
  else
    raise exception 'Unknown kind.';
  end if;
  if not found then
    raise exception 'That entry no longer exists.';
  end if;
  return true;
end;
$$;

-- Approve a dog application: owner (matched by email) + dog join the roster.
create or replace function public.mochi_admin_approve_dog(p_token text, p_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_app public.mochi_dog_applications;
  v_out jsonb;
begin
  perform public.mochi_require_admin(p_token);
  select * into v_app from public.mochi_dog_applications where id = p_application_id;
  if not found then
    raise exception 'That entry no longer exists.';
  end if;
  v_out := public.mochi_admin_add_owner(p_token, v_app.owner_name, v_app.email, v_app.phone, v_app.dog_name);
  update public.mochi_dog_applications set status = 'approved' where id = v_app.id;
  return v_out;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges. Supabase grants EXECUTE on new public functions to anon and
-- authenticated by default: revoke everything, then grant the endpoints.
-- ---------------------------------------------------------------------------

revoke execute on function public.mochi_person_for(text) from public, anon, authenticated;
revoke execute on function public.mochi_require_admin(text) from public, anon, authenticated;
revoke execute on function public.mochi_standing(uuid) from public, anon, authenticated;
revoke execute on function public.mochi_walk_json(public.mochi_walks) from public, anon, authenticated;
revoke execute on function public.mochi_person_json(public.mochi_people, boolean) from public, anon, authenticated;

revoke execute on function public.mochi_upcoming_walks() from public;
revoke execute on function public.mochi_me(text) from public;
revoke execute on function public.mochi_rsvp(text, uuid, uuid, boolean, boolean) from public;
revoke execute on function public.mochi_opt_out(text, uuid, uuid) from public;
revoke execute on function public.mochi_admin_walks(text) from public;
revoke execute on function public.mochi_admin_save_walk(text, uuid, text, timestamptz, timestamptz, text, integer, text, text) from public;
revoke execute on function public.mochi_admin_roster(text, uuid) from public;
revoke execute on function public.mochi_admin_mark(text, uuid, uuid, text) from public;
revoke execute on function public.mochi_admin_people(text) from public;
revoke execute on function public.mochi_admin_add_owner(text, text, text, text, text) from public;
revoke execute on function public.mochi_admin_add_dog(text, uuid, text) from public;
revoke execute on function public.mochi_admin_new_link(text, uuid) from public;
revoke execute on function public.mochi_admin_interest(text) from public;
revoke execute on function public.mochi_admin_set_interest_status(text, text, uuid, text) from public;
revoke execute on function public.mochi_admin_approve_dog(text, uuid) from public;

grant execute on function public.mochi_upcoming_walks() to anon, authenticated;
grant execute on function public.mochi_me(text) to anon, authenticated;
grant execute on function public.mochi_rsvp(text, uuid, uuid, boolean, boolean) to anon, authenticated;
grant execute on function public.mochi_opt_out(text, uuid, uuid) to anon, authenticated;
grant execute on function public.mochi_admin_walks(text) to anon, authenticated;
grant execute on function public.mochi_admin_save_walk(text, uuid, text, timestamptz, timestamptz, text, integer, text, text) to anon, authenticated;
grant execute on function public.mochi_admin_roster(text, uuid) to anon, authenticated;
grant execute on function public.mochi_admin_mark(text, uuid, uuid, text) to anon, authenticated;
grant execute on function public.mochi_admin_people(text) to anon, authenticated;
grant execute on function public.mochi_admin_add_owner(text, text, text, text, text) to anon, authenticated;
grant execute on function public.mochi_admin_add_dog(text, uuid, text) to anon, authenticated;
grant execute on function public.mochi_admin_new_link(text, uuid) to anon, authenticated;
grant execute on function public.mochi_admin_interest(text) to anon, authenticated;
grant execute on function public.mochi_admin_set_interest_status(text, text, uuid, text) to anon, authenticated;
grant execute on function public.mochi_admin_approve_dog(text, uuid) to anon, authenticated;
