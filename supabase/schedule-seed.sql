-- Mochi's Legacy — first-run seed. Run once in the Supabase SQL editor (as
-- postgres) AFTER schema.sql and schedule.sql. Safe to re-run.
--
-- 1. Change 'Founder' to your name (and add a second founder row if you like).
-- 2. Run it. The last query prints each admin's personal admin link path:
--    put your site in front, e.g. https://mochislegacy.com/checkin#k=<token>.
-- 3. Open that link on your phone. Everything else (owners, dogs, walk times,
--    publishing) happens in the app: Walks, Gaggle and Interest tabs.

insert into public.mochi_people (name, is_admin)
select 'Founder', true
where not exists (select 1 from public.mochi_people where is_admin);

-- The kickoff walk, as a DRAFT: the time is a placeholder until the founders
-- confirm it. Set the real time in the Walks tab, then press Publish.
insert into public.mochi_walks (title, starts_at, ends_at, meeting_spot, cap, status, notes)
select
  'Kickoff gaggle walk',
  timestamptz '2026-10-02 09:00:00 America/Denver',
  timestamptz '2026-10-02 10:00:00 America/Denver',
  'Foothills Community Park, Shelter A',
  15,
  'draft',
  'Bring a leash, water, and poop bags.'
where not exists (
  select 1 from public.mochi_walks
  where meeting_spot = 'Foothills Community Park, Shelter A'
    and (starts_at at time zone 'America/Denver')::date = date '2026-10-02'
);

select name, '/checkin#k=' || access_token as admin_link_path
from public.mochi_people
where is_admin
order by created_at;
