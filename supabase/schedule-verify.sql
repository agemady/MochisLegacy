-- Mochi's Legacy — schedule-verify.sql
-- Run in the Supabase SQL editor (as postgres) AFTER schedule.sql.
-- What it proves:
--   1. anon CANNOT select people / dogs / walks / walk_rsvps.
--   2. a signed-in non-admin sees only their own people/dogs/rsvps
--      and published walks; they can insert/update only their own rsvps.
--   3. is_admin can select every probe row, including a draft walk.
-- Probe rows are tagged ML-SCHEDULE-VERIFY and deleted at the end.

create extension if not exists "pgcrypto";

-- leftover probes from a previous failed run
delete from public.walk_rsvps
  where walk_id in (select id from public.walks where meeting_spot like 'ML-SCHEDULE-VERIFY%');
delete from public.walks where meeting_spot like 'ML-SCHEDULE-VERIFY%';
delete from public.dogs where name like 'ML-SCHEDULE-VERIFY%';
delete from public.people where email like 'ml-schedule-verify-%@example.com';
delete from auth.users where email like 'ml-schedule-verify-%@example.com';

do $$
declare
  v_owner_auth uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001';
  v_other_auth uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002';
  v_admin_auth uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003';
  v_instance uuid := coalesce(
    (select instance_id from auth.users limit 1),
    '00000000-0000-0000-0000-000000000000'
  );
  v_owner uuid;
  v_other uuid;
  v_admin uuid;
  v_owner_dog uuid;
  v_other_dog uuid;
  v_pub uuid;
  v_draft uuid;
  n int;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values
    (v_instance, v_owner_auth, 'authenticated', 'authenticated',
     'ml-schedule-verify-owner@example.com', crypt('verify', gen_salt('bf')),
     now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_instance, v_other_auth, 'authenticated', 'authenticated',
     'ml-schedule-verify-other@example.com', crypt('verify', gen_salt('bf')),
     now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_instance, v_admin_auth, 'authenticated', 'authenticated',
     'ml-schedule-verify-admin@example.com', crypt('verify', gen_salt('bf')),
     now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.people (auth_user_id, name, email, is_admin)
  values (v_owner_auth, 'ML Verify Owner', 'ml-schedule-verify-owner@example.com', false)
  returning id into v_owner;

  insert into public.people (auth_user_id, name, email, is_admin)
  values (v_other_auth, 'ML Verify Other', 'ml-schedule-verify-other@example.com', false)
  returning id into v_other;

  insert into public.people (auth_user_id, name, email, is_admin)
  values (v_admin_auth, 'ML Verify Admin', 'ml-schedule-verify-admin@example.com', true)
  returning id into v_admin;

  insert into public.dogs (owner_id, name, tier, status)
  values (v_owner, 'ML-SCHEDULE-VERIFY Owner Dog', 'gaggle', 'active')
  returning id into v_owner_dog;

  insert into public.dogs (owner_id, name, tier, status)
  values (v_other, 'ML-SCHEDULE-VERIFY Other Dog', 'gaggle', 'active')
  returning id into v_other_dog;

  insert into public.walks (starts_at, ends_at, meeting_spot, cap, status)
  values (now() + interval '7 days', now() + interval '7 days 1 hour',
          'ML-SCHEDULE-VERIFY published', 15, 'published')
  returning id into v_pub;

  insert into public.walks (starts_at, ends_at, meeting_spot, cap, status)
  values (now() + interval '14 days', now() + interval '14 days 1 hour',
          'ML-SCHEDULE-VERIFY draft', 15, 'draft')
  returning id into v_draft;

  insert into public.walk_rsvps (walk_id, dog_id, waiver_signed, photo_consent)
  values (v_pub, v_other_dog, true, false);

  -- persist ids for the role-switched blocks (session-scoped, not on-commit-drop)
  create temporary table if not exists ml_sv (
    owner_auth uuid, other_auth uuid, admin_auth uuid,
    owner_id uuid, other_id uuid, admin_id uuid,
    owner_dog uuid, other_dog uuid, pub uuid, draft uuid
  );
  delete from ml_sv;
  insert into ml_sv values (
    v_owner_auth, v_other_auth, v_admin_auth,
    v_owner, v_other, v_admin,
    v_owner_dog, v_other_dog, v_pub, v_draft
  );
end $$;

-- ============================================================
-- 1. anon cannot read any scheduling table
-- ============================================================
set role anon;

do $$
begin
  begin
    perform * from public.people;
    raise exception 'FAIL: anon selected from people';
  exception
    when insufficient_privilege then
      raise notice 'PASS: anon select on people denied';
  end;
end $$;

do $$
begin
  begin
    perform * from public.dogs;
    raise exception 'FAIL: anon selected from dogs';
  exception
    when insufficient_privilege then
      raise notice 'PASS: anon select on dogs denied';
  end;
end $$;

do $$
begin
  begin
    perform * from public.walks;
    raise exception 'FAIL: anon selected from walks';
  exception
    when insufficient_privilege then
      raise notice 'PASS: anon select on walks denied';
  end;
end $$;

do $$
begin
  begin
    perform * from public.walk_rsvps;
    raise exception 'FAIL: anon selected from walk_rsvps';
  exception
    when insufficient_privilege then
      raise notice 'PASS: anon select on walk_rsvps denied';
  end;
end $$;

-- ============================================================
-- 2. signed-in owner: own rows + published walks; own rsvps only
-- ============================================================
reset role;

select set_config('request.jwt.claim.sub', owner_auth::text, false),
       set_config(
         'request.jwt.claims',
         json_build_object('sub', owner_auth, 'role', 'authenticated')::text,
         false
       )
  from ml_sv;

set role authenticated;

do $$
declare
  v ml_sv%rowtype;
  n int;
begin
  select * into v from ml_sv;

  select count(*) into n from public.people
    where email like 'ml-schedule-verify-%@example.com';
  if n <> 1 then
    raise exception 'FAIL: owner saw % probe people (want 1)', n;
  end if;
  if not exists (select 1 from public.people where id = v.owner_id) then
    raise exception 'FAIL: owner cannot see their people row';
  end if;
  raise notice 'PASS: owner selects only their people row';

  select count(*) into n from public.dogs where name like 'ML-SCHEDULE-VERIFY%';
  if n <> 1 then
    raise exception 'FAIL: owner saw % probe dogs (want 1)', n;
  end if;
  if not exists (select 1 from public.dogs where id = v.owner_dog) then
    raise exception 'FAIL: owner cannot see their dog';
  end if;
  raise notice 'PASS: owner selects only their dog';

  select count(*) into n from public.walks where meeting_spot like 'ML-SCHEDULE-VERIFY%';
  if n <> 1 then
    raise exception 'FAIL: owner saw % probe walks (want published only)', n;
  end if;
  if exists (select 1 from public.walks where id = v.draft) then
    raise exception 'FAIL: owner saw a draft walk';
  end if;
  raise notice 'PASS: owner selects published walks only';

  select count(*) into n from public.walk_rsvps
    where walk_id in (v.pub, v.draft);
  if n <> 0 then
    raise exception 'FAIL: owner saw % rsvps that are not theirs', n;
  end if;
  raise notice 'PASS: owner does not see someone else''s rsvp';
end $$;

do $$
declare
  v ml_sv%rowtype;
  n int;
begin
  select * into v from ml_sv;

  insert into public.walk_rsvps (walk_id, dog_id, waiver_signed, photo_consent)
  values (v.pub, v.owner_dog, true, false);
  raise notice 'PASS: owner inserted own rsvp on a published walk';

  update public.walk_rsvps
    set photo_consent = true
    where walk_id = v.pub and dog_id = v.owner_dog;
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'FAIL: owner update of own rsvp touched % rows', n;
  end if;
  raise notice 'PASS: owner updated own rsvp';

  begin
    insert into public.walk_rsvps (walk_id, dog_id, waiver_signed, photo_consent)
    values (v.pub, v.other_dog, true, false);
    raise exception 'FAIL: owner inserted an rsvp for someone else''s dog';
  exception
    when insufficient_privilege then
      raise notice 'PASS: owner cannot rsvp someone else''s dog';
  end;

  begin
    insert into public.walk_rsvps (walk_id, dog_id, waiver_signed, photo_consent)
    values (v.draft, v.owner_dog, true, false);
    raise exception 'FAIL: owner inserted an rsvp on a draft walk';
  exception
    when insufficient_privilege then
      raise notice 'PASS: owner cannot rsvp a draft walk';
  end;

  update public.walk_rsvps
    set photo_consent = true
    where walk_id = v.pub and dog_id = v.other_dog;
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'FAIL: owner updated someone else''s rsvp (% rows)', n;
  end if;
  raise notice 'PASS: owner cannot update someone else''s rsvp';
end $$;

-- ============================================================
-- 3. is_admin sees every probe row
-- ============================================================
reset role;

select set_config('request.jwt.claim.sub', admin_auth::text, false),
       set_config(
         'request.jwt.claims',
         json_build_object('sub', admin_auth, 'role', 'authenticated')::text,
         false
       )
  from ml_sv;

set role authenticated;

do $$
declare
  v ml_sv%rowtype;
  n int;
begin
  select * into v from ml_sv;

  select count(*) into n from public.people
    where email like 'ml-schedule-verify-%@example.com';
  if n <> 3 then
    raise exception 'FAIL: admin saw % probe people (want 3)', n;
  end if;
  raise notice 'PASS: admin selects all probe people';

  select count(*) into n from public.dogs where name like 'ML-SCHEDULE-VERIFY%';
  if n <> 2 then
    raise exception 'FAIL: admin saw % probe dogs (want 2)', n;
  end if;
  raise notice 'PASS: admin selects all probe dogs';

  select count(*) into n from public.walks where meeting_spot like 'ML-SCHEDULE-VERIFY%';
  if n <> 2 then
    raise exception 'FAIL: admin saw % probe walks (want published + draft)', n;
  end if;
  raise notice 'PASS: admin selects published and draft walks';

  select count(*) into n from public.walk_rsvps
    where walk_id in (v.pub, v.draft);
  if n < 2 then
    raise exception 'FAIL: admin saw % probe rsvps (want owner + other)', n;
  end if;
  raise notice 'PASS: admin selects all probe rsvps';
end $$;

-- ============================================================
-- 4. cleanup
-- ============================================================
reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claims', '', false);

delete from public.walk_rsvps
  where walk_id in (select id from public.walks where meeting_spot like 'ML-SCHEDULE-VERIFY%');
delete from public.walks where meeting_spot like 'ML-SCHEDULE-VERIFY%';
delete from public.dogs where name like 'ML-SCHEDULE-VERIFY%';
delete from public.people where email like 'ml-schedule-verify-%@example.com';
delete from auth.users where email like 'ml-schedule-verify-%@example.com';

do $$
begin
  raise notice 'schedule-verify.sql complete: anon locked down, owner scoped, admin all, probes deleted';
end $$;
