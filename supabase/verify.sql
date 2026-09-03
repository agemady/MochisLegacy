-- Mochi's Legacy — verify.sql
-- Run this in the Supabase SQL editor (as postgres) AFTER schema.sql.
-- What it proves:
--   1. anon CANNOT select from any of the four tables (permission denied).
--   2. anon CAN call the four submit RPCs (probe rows are inserted).
-- It cleans up after itself: the probe rows are deleted at the end.
-- If a step fails, the script aborts with an error — read the message.

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. anon must be denied direct table access
-- ============================================================
set role anon;

do $$
begin
  begin
    perform * from public.dog_applications;
    raise exception 'FAIL: anon selected from dog_applications — anon grants leaked!';
  exception
    when insufficient_privilege then
      raise notice 'PASS: anon select on dog_applications denied';
  end;
end $$;

do $$
begin
  begin
    perform * from public.volunteer_applications;
    raise exception 'FAIL: anon selected from volunteer_applications — anon grants leaked!';
  exception
    when insufficient_privilege then
      raise notice 'PASS: anon select on volunteer_applications denied';
  end;
end $$;

do $$
begin
  begin
    perform * from public.donation_pledges;
    raise exception 'FAIL: anon selected from donation_pledges — anon grants leaked!';
  exception
    when insufficient_privilege then
      raise notice 'PASS: anon select on donation_pledges denied';
  end;
end $$;

do $$
begin
  begin
    perform * from public.subscribers;
    raise exception 'FAIL: anon selected from subscribers — anon grants leaked!';
  exception
    when insufficient_privilege then
      raise notice 'PASS: anon select on subscribers denied';
  end;
end $$;

-- ============================================================
-- 2. anon must be able to call the four RPCs (probe rows)
--    All probe rows carry the marker "ML-VERIFY-PROBE" or the
--    probe email so they can be found and deleted below.
-- ============================================================

do $$
declare v_id uuid;
begin
  v_id := public.public_submit_dog_signup(
    p_owner_name => 'ML Verify Probe',
    p_email      => 'ml-verify-probe@example.com',
    p_dog_name   => 'Probe Pup',
    p_notes      => 'ML-VERIFY-PROBE dog application'
  );
  raise notice 'PASS: public_submit_dog_signup as anon -> %', v_id;
end $$;

do $$
declare v_id uuid;
begin
  v_id := public.public_submit_volunteer(
    p_name      => 'ML Verify Probe',
    p_email     => 'ml-verify-probe@example.com',
    p_skills    => '{walks}',
    p_interests => 'ML-VERIFY-PROBE volunteer application'
  );
  raise notice 'PASS: public_submit_volunteer as anon -> %', v_id;
end $$;

do $$
declare v_id uuid;
begin
  v_id := public.public_submit_pledge(
    p_name      => 'ML Verify Probe',
    p_email     => 'ml-verify-probe@example.com',
    p_frequency => 'one-time',
    p_message   => 'ML-VERIFY-PROBE donation pledge'
  );
  raise notice 'PASS: public_submit_pledge as anon -> %', v_id;
end $$;

do $$
declare v_id uuid;
begin
  v_id := public.public_subscribe(
    p_email => 'ml-verify-probe@example.com'
  );
  raise notice 'PASS: public_subscribe as anon -> %', v_id;
end $$;

-- ============================================================
-- 3. back to postgres and delete the probe rows
-- ============================================================
reset role;

delete from public.dog_applications
  where email = 'ml-verify-probe@example.com' and notes like 'ML-VERIFY-PROBE%';
delete from public.volunteer_applications
  where email = 'ml-verify-probe@example.com' and interests like 'ML-VERIFY-PROBE%';
delete from public.donation_pledges
  where email = 'ml-verify-probe@example.com' and message like 'ML-VERIFY-PROBE%';
delete from public.subscribers
  where email = 'ml-verify-probe@example.com';

raise notice 'verify.sql complete: anon access locked down, all four RPCs working, probe rows deleted';
