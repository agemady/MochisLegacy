-- Mochi's Legacy — interest schema (landing page signups)
--
-- Lives inside a SHARED Supabase project, so every object is prefixed
-- `mochi_` and nothing here touches tables, functions, roles or auth objects
-- that belong to other apps. Safe to re-run.
--
-- Security model: RLS on, no policies, and no table privileges for anon or
-- authenticated (Supabase's default privileges would otherwise grant them).
-- The site reaches these tables only through the four SECURITY DEFINER
-- submit functions below. Founders read the rows in Studio (Table Editor).

create table if not exists public.mochi_dog_applications (
  id          uuid primary key default gen_random_uuid(),
  owner_name  text not null,
  email       text not null,
  phone       text,
  dog_name    text not null,
  breed       text,
  age         text,
  city        text,
  notes       text,
  status      text not null default 'new'
              check (status in ('new', 'contacted', 'approved', 'archived')),
  created_at  timestamptz not null default now()
);

create table if not exists public.mochi_volunteer_applications (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  phone         text,
  skills        text[] not null default '{}',
  interests     text,
  availability  text,
  status        text not null default 'new'
                check (status in ('new', 'contacted', 'approved', 'archived')),
  created_at    timestamptz not null default now()
);

create table if not exists public.mochi_donation_pledges (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  pledge_amount  numeric(10, 2),
  frequency      text not null default 'one-time'
                 check (frequency in ('one-time', 'monthly', 'yearly')),
  visit_request  text,
  message        text,
  deductible     boolean not null default false,
  status         text not null default 'new'
                 check (status in ('new', 'contacted', 'approved', 'archived')),
  created_at     timestamptz not null default now()
);

create table if not exists public.mochi_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  created_at  timestamptz not null default now()
);

create index if not exists mochi_dog_apps_created_at_idx on public.mochi_dog_applications (created_at desc);
create index if not exists mochi_vol_apps_created_at_idx on public.mochi_volunteer_applications (created_at desc);
create index if not exists mochi_vol_apps_email_idx on public.mochi_volunteer_applications (email);
create index if not exists mochi_pledges_created_at_idx on public.mochi_donation_pledges (created_at desc);
create unique index if not exists mochi_subscribers_email_lower_idx
  on public.mochi_subscribers (lower(email));
create unique index if not exists mochi_dog_apps_email_dog_name_lower_idx
  on public.mochi_dog_applications (lower(email), lower(dog_name));

alter table public.mochi_dog_applications       enable row level security;
alter table public.mochi_volunteer_applications enable row level security;
alter table public.mochi_donation_pledges       enable row level security;
alter table public.mochi_subscribers            enable row level security;

revoke all on table
  public.mochi_dog_applications, public.mochi_volunteer_applications,
  public.mochi_donation_pledges, public.mochi_subscribers
  from anon, authenticated;

create or replace function public.mochi_assert_email(p_email text)
returns text
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email is null or length(v_email) = 0 then
    raise exception 'email is required';
  end if;
  if length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid email address';
  end if;
  return v_email;
end;
$$;

create or replace function public.mochi_submit_dog_signup(
  p_owner_name text,
  p_email      text,
  p_phone      text default null,
  p_dog_name   text default null,
  p_breed      text default null,
  p_age        text default null,
  p_city       text default null,
  p_notes      text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_email text := public.mochi_assert_email(p_email);
begin
  if p_owner_name is null or length(trim(p_owner_name)) = 0 then
    raise exception 'owner name is required';
  end if;
  if p_dog_name is null or length(trim(p_dog_name)) = 0 then
    raise exception 'dog name is required';
  end if;
  if length(p_owner_name) > 120 or length(coalesce(p_phone, '')) > 40
     or length(p_dog_name) > 60 or length(coalesce(p_breed, '')) > 80
     or length(coalesce(p_age, '')) > 40 or length(coalesce(p_city, '')) > 80
     or length(coalesce(p_notes, '')) > 2000 then
    raise exception 'a field is too long';
  end if;

  insert into public.mochi_dog_applications (
    owner_name, email, phone, dog_name, breed, age, city, notes
  ) values (
    trim(p_owner_name),
    v_email,
    nullif(trim(coalesce(p_phone, '')), ''),
    trim(p_dog_name),
    nullif(trim(coalesce(p_breed, '')), ''),
    nullif(trim(coalesce(p_age, '')), ''),
    nullif(trim(coalesce(p_city, '')), ''),
    nullif(trim(coalesce(p_notes, '')), '')
  )
  on conflict ((lower(email)), (lower(dog_name))) do update
    set owner_name = excluded.owner_name,
        phone      = coalesce(excluded.phone, mochi_dog_applications.phone),
        notes      = coalesce(excluded.notes, mochi_dog_applications.notes)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.mochi_submit_volunteer(
  p_name         text,
  p_email        text,
  p_phone        text default null,
  p_skills       text[] default '{}',
  p_interests    text default null,
  p_availability text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_email text := public.mochi_assert_email(p_email);
begin
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'name is required';
  end if;
  if length(p_name) > 120 or length(coalesce(p_phone, '')) > 40
     or length(coalesce(p_interests, '')) > 1000
     or length(coalesce(p_availability, '')) > 500
     or coalesce(array_length(p_skills, 1), 0) > 20 then
    raise exception 'a field is too long';
  end if;

  insert into public.mochi_volunteer_applications (
    name, email, phone, skills, interests, availability
  ) values (
    trim(p_name),
    v_email,
    nullif(trim(coalesce(p_phone, '')), ''),
    coalesce(p_skills, '{}'),
    nullif(trim(coalesce(p_interests, '')), ''),
    nullif(trim(coalesce(p_availability, '')), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.mochi_submit_pledge(
  p_name          text,
  p_email         text,
  p_pledge_amount numeric default null,
  p_frequency     text default 'one-time',
  p_visit_request text default null,
  p_message       text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_email text := public.mochi_assert_email(p_email);
  v_freq text := coalesce(nullif(trim(p_frequency), ''), 'one-time');
begin
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'name is required';
  end if;
  if v_freq not in ('one-time', 'monthly', 'yearly') then
    raise exception 'frequency must be one-time, monthly, or yearly';
  end if;
  if p_pledge_amount is not null and p_pledge_amount < 0 then
    raise exception 'pledge amount cannot be negative';
  end if;
  if length(p_name) > 120 or length(coalesce(p_visit_request, '')) > 500
     or length(coalesce(p_message, '')) > 2000 then
    raise exception 'a field is too long';
  end if;

  insert into public.mochi_donation_pledges (
    name, email, pledge_amount, frequency, visit_request, message, deductible
  ) values (
    trim(p_name),
    v_email,
    p_pledge_amount,
    v_freq,
    nullif(trim(coalesce(p_visit_request, '')), ''),
    nullif(trim(coalesce(p_message, '')), ''),
    false
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.mochi_subscribe(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_email text := public.mochi_assert_email(p_email);
begin
  insert into public.mochi_subscribers (email)
  values (v_email)
  on conflict ((lower(email))) do update set email = excluded.email
  returning id into v_id;

  return v_id;
end;
$$;

-- Supabase grants EXECUTE on new public functions to anon and authenticated by
-- default, so revoke from them explicitly, then grant back only the four
-- submit endpoints.
revoke execute on function public.mochi_assert_email(text) from public, anon, authenticated;
revoke execute on function public.mochi_submit_dog_signup(text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.mochi_submit_volunteer(text, text, text, text[], text, text) from public, anon, authenticated;
revoke execute on function public.mochi_submit_pledge(text, text, numeric, text, text, text) from public, anon, authenticated;
revoke execute on function public.mochi_subscribe(text) from public, anon, authenticated;

grant execute on function public.mochi_submit_dog_signup(text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.mochi_submit_volunteer(text, text, text, text[], text, text) to anon, authenticated;
grant execute on function public.mochi_submit_pledge(text, text, numeric, text, text, text) to anon, authenticated;
grant execute on function public.mochi_subscribe(text) to anon, authenticated;
