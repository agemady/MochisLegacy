-- Founder-run launch seed. Apply AFTER schedule.sql in the Supabase SQL editor (as postgres).
-- BEFORE running: replace every @example.com email below with the real person's email.
-- Magic-link sign-in links auth.users to people.auth_user_id by that same email
-- (trigger on_auth_user_created / handle_auth_user_link).
-- Safe to re-run: people upsert on email; dogs and the October 2 walk insert only if missing.

insert into public.people (name, email, is_admin)
values
  ('Founder 1', 'founder1@example.com', true),
  ('Founder 2', 'founder2@example.com', true),
  ('Owner of Benny', 'owner-benny@example.com', false),
  ('Owner of Honey', 'owner-honey@example.com', false),
  ('Owner of Bear', 'owner-bear@example.com', false),
  ('Owner of Juni', 'owner-juni-1@example.com', false),
  ('Owner of Juni', 'owner-juni-2@example.com', false),
  ('Owner of Louie', 'owner-louie@example.com', false),
  ('Owner of Moss', 'owner-moss@example.com', false),
  ('Owner of Buddy', 'owner-buddy@example.com', false),
  ('Owner of Jaz', 'owner-jaz@example.com', false),
  ('Owner of Mini Mochi', 'owner-mini-mochi@example.com', false),
  ('Owner of Luna', 'owner-luna@example.com', false)
on conflict (email) do update
  set name = excluded.name,
      is_admin = excluded.is_admin;

insert into public.dogs (owner_id, name, tier, status)
select p.id, v.name, 'gaggle', 'active'
from (
  values
    ('owner-benny@example.com', 'Benny'),
    ('owner-honey@example.com', 'Honey'),
    ('owner-bear@example.com', 'Bear'),
    ('owner-juni-1@example.com', 'Juni'),
    ('owner-juni-2@example.com', 'Juni'),
    ('owner-louie@example.com', 'Louie'),
    ('owner-moss@example.com', 'Moss'),
    ('owner-buddy@example.com', 'Buddy'),
    ('owner-jaz@example.com', 'Jaz'),
    ('owner-mini-mochi@example.com', 'Mini Mochi'),
    ('owner-luna@example.com', 'Luna')
) as v(email, name)
join public.people p on p.email = v.email
where not exists (
  select 1 from public.dogs d
  where d.owner_id = p.id and d.name = v.name
);

insert into public.walks (starts_at, ends_at, meeting_spot, cap, status)
select
  timestamptz '2026-10-02 09:00:00 America/Denver',
  timestamptz '2026-10-02 10:00:00 America/Denver',
  'Foothills Community Park, Shelter A',
  15,
  'published'
where not exists (
  select 1 from public.walks w
  where w.meeting_spot = 'Foothills Community Park, Shelter A'
    and w.starts_at = timestamptz '2026-10-02 09:00:00 America/Denver'
);
