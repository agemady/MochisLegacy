-- Mochi's Legacy — scheduling schema (branch scheduling)
-- Apply after schema.sql. Do not edit schema.sql from this file.
-- Four tables, RLS on, zero anon grants. Founders seed people/dogs/walks in Studio.

create extension if not exists "pgcrypto";

create table if not exists public.people (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users (id),
  name          text not null,
  email         text not null,
  phone         text,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists public.dogs (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.people (id),
  name        text not null,
  tier        text not null default 'gaggle'
              check (tier in ('gaggle', 'candidate', 'therapy')),
  status      text not null default 'active'
              check (status in ('active', 'retired')),
  created_at  timestamptz not null default now()
);

create table if not exists public.walks (
  id            uuid primary key default gen_random_uuid(),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  meeting_spot  text not null,
  cap           integer not null,
  status        text not null default 'published'
                check (status in ('draft', 'published', 'done')),
  created_at    timestamptz not null default now()
);

create table if not exists public.walk_rsvps (
  walk_id         uuid not null references public.walks (id) on delete cascade,
  dog_id          uuid not null references public.dogs (id) on delete cascade,
  waiver_signed   boolean not null default false,
  photo_consent   boolean not null default false,
  checked_in_at   timestamptz,
  opted_out_at    timestamptz,
  created_at      timestamptz not null default now(),
  primary key (walk_id, dog_id)
);

create index if not exists dogs_owner_id_idx on public.dogs (owner_id);
create index if not exists walks_starts_at_idx on public.walks (starts_at);
create index if not exists walk_rsvps_dog_id_idx on public.walk_rsvps (dog_id);

create or replace function public.current_person_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.people where auth_user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.people where auth_user_id = auth.uid()),
    false
  )
$$;

revoke execute on function public.current_person_id() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.current_person_id() to authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.people     enable row level security;
alter table public.dogs       enable row level security;
alter table public.walks      enable row level security;
alter table public.walk_rsvps enable row level security;

drop policy if exists people_select_own on public.people;
drop policy if exists people_update_own on public.people;
drop policy if exists people_admin_all on public.people;
drop policy if exists dogs_select_own on public.dogs;
drop policy if exists dogs_update_own on public.dogs;
drop policy if exists dogs_admin_all on public.dogs;
drop policy if exists walks_select_published on public.walks;
drop policy if exists walks_admin_all on public.walks;
drop policy if exists rsvps_select_own on public.walk_rsvps;
drop policy if exists rsvps_insert_own_published on public.walk_rsvps;
drop policy if exists rsvps_update_own_published on public.walk_rsvps;
drop policy if exists rsvps_admin_all on public.walk_rsvps;

create policy people_select_own
  on public.people for select to authenticated
  using (id = public.current_person_id() or public.is_admin());

create policy people_update_own
  on public.people for update to authenticated
  using (id = public.current_person_id())
  with check (id = public.current_person_id() and is_admin = false);

create policy people_admin_all
  on public.people for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy dogs_select_own
  on public.dogs for select to authenticated
  using (owner_id = public.current_person_id() or public.is_admin());

create policy dogs_update_own
  on public.dogs for update to authenticated
  using (owner_id = public.current_person_id())
  with check (owner_id = public.current_person_id());

create policy dogs_admin_all
  on public.dogs for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy walks_select_published
  on public.walks for select to authenticated
  using (status = 'published' or public.is_admin());

create policy walks_admin_all
  on public.walks for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy rsvps_select_own
  on public.walk_rsvps for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.dogs d
      where d.id = dog_id and d.owner_id = public.current_person_id()
    )
  );

create policy rsvps_insert_own_published
  on public.walk_rsvps for insert to authenticated
  with check (
    exists (
      select 1 from public.dogs d
      where d.id = dog_id and d.owner_id = public.current_person_id()
    )
    and exists (
      select 1 from public.walks w
      where w.id = walk_id and w.status = 'published'
    )
  );

create policy rsvps_update_own_published
  on public.walk_rsvps for update to authenticated
  using (
    exists (
      select 1 from public.dogs d
      where d.id = dog_id and d.owner_id = public.current_person_id()
    )
  )
  with check (
    exists (
      select 1 from public.dogs d
      where d.id = dog_id and d.owner_id = public.current_person_id()
    )
    and exists (
      select 1 from public.walks w
      where w.id = walk_id and w.status = 'published'
    )
  );

create policy rsvps_admin_all
  on public.walk_rsvps for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.people, public.dogs, public.walks, public.walk_rsvps to authenticated;
revoke all on table public.people from anon;
revoke all on table public.dogs from anon;
revoke all on table public.walks from anon;
revoke all on table public.walk_rsvps from anon;

-- Seed (Studio as postgres; time TBA — 9:00–10:00 AM MDT is a placeholder)
-- insert into public.people (name, email, phone, is_admin)
-- values ('Example Handler', 'handler@example.com', null, false);
-- insert into public.dogs (owner_id, name, tier, status)
-- values ('<people.id>', 'Example Dog', 'gaggle', 'active');
-- insert into public.walks (starts_at, ends_at, meeting_spot, cap, status)
-- values (
--   '2026-10-02 09:00:00-06',
--   '2026-10-02 10:00:00-06',
--   'Foothills Community Park, Shelter A',
--   15,
--   'published'
-- );
