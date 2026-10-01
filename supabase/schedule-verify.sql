-- Mochi's Legacy — schedule-verify.sql
-- Run in the Supabase SQL editor (as postgres) AFTER schema.sql and schedule.sql.
-- It proves, as the `anon` and `authenticated` roles the site and other apps use:
--   1. no direct table access to any mochi_ table, and no access to internal helpers;
--   2. public walk list shows published walks only;
--   3. owner links: waiver required, cap + waitlist, auto-promotion on opt-out,
--      one walk per dog per day, retired dogs and other owners' dogs refused,
--      admin functions refused;
--   4. admin links: roster, check-in/undo/opt-out/restore/waiver/add, people,
--      add owner (dedupe by email), new link, interest, approve, save walk;
--   5. a bad token is refused everywhere.
-- Everything runs in ONE transaction that ends in ROLLBACK, so the probe rows
-- (fixed ids and tokens, written in this file) never persist, even when a
-- check fails part-way. Any failure aborts with "FAIL: ...".

-- ---------------------------------------------------------------------------
-- 0. probe rows (as postgres, inside the transaction)
-- ---------------------------------------------------------------------------
begin;

insert into public.mochi_people (id, name, email, is_admin, access_token, notes) values
  ('a0000000-0000-4000-8000-000000000001', 'Verify Admin',  'mochi-verify-admin@example.com', true,  'a0000000000000000000000000000001', 'mochi-verify'),
  ('a0000000-0000-4000-8000-000000000002', 'Verify Owner',  'mochi-verify-owner@example.com', false, 'a0000000000000000000000000000002', 'mochi-verify'),
  ('a0000000-0000-4000-8000-000000000003', 'Verify Other',  'mochi-verify-other@example.com', false, 'a0000000000000000000000000000003', 'mochi-verify');

insert into public.mochi_dogs (id, owner_id, name, status) values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'Verify Pup A', 'active'),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'Verify Pup B', 'active'),
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'Verify Retired', 'retired'),
  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', 'Verify Other Pup', 'active'),
  ('d0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Verify Admin Pup', 'active');

-- Published walk (cap 2), a same-day second walk, and a draft.
insert into public.mochi_walks (id, title, starts_at, ends_at, meeting_spot, cap, status) values
  ('e0000000-0000-4000-8000-000000000001', 'Verify walk', date_trunc('day', now()) + interval '30 days 16 hours',
   date_trunc('day', now()) + interval '30 days 17 hours', 'mochi-verify spot', 2, 'published'),
  ('e0000000-0000-4000-8000-000000000002', 'Verify same day', date_trunc('day', now()) + interval '30 days 20 hours',
   date_trunc('day', now()) + interval '30 days 21 hours', 'mochi-verify spot 2', 10, 'published'),
  ('e0000000-0000-4000-8000-000000000003', 'Verify draft', date_trunc('day', now()) + interval '40 days 16 hours',
   date_trunc('day', now()) + interval '40 days 17 hours', 'mochi-verify draft', 10, 'draft');

insert into public.mochi_dog_applications (owner_name, email, dog_name, notes)
values ('Verify Applicant', 'mochi-verify-applicant@example.com', 'Verify Applicant Pup', 'mochi-verify');

-- ---------------------------------------------------------------------------
-- 1. table + helper lockdown, for both API roles
-- ---------------------------------------------------------------------------
do $$
declare
  r text;
  t text;
  f text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    foreach t in array array[
      'mochi_people', 'mochi_dogs', 'mochi_walks', 'mochi_walk_rsvps',
      'mochi_dog_applications', 'mochi_volunteer_applications', 'mochi_donation_pledges', 'mochi_subscribers'
    ] loop
      if has_table_privilege(r, 'public.' || t, 'select')
         or has_table_privilege(r, 'public.' || t, 'insert')
         or has_table_privilege(r, 'public.' || t, 'update')
         or has_table_privilege(r, 'public.' || t, 'delete') then
        raise exception 'FAIL: % has direct privileges on %', r, t;
      end if;
    end loop;
    foreach f in array array[
      'public.mochi_person_for(text)', 'public.mochi_require_admin(text)', 'public.mochi_standing(uuid)',
      'public.mochi_walk_json(public.mochi_walks)', 'public.mochi_person_json(public.mochi_people, boolean)',
      'public.mochi_assert_email(text)'
    ] loop
      if has_function_privilege(r, f, 'execute') then
        raise exception 'FAIL: % can execute internal helper %', r, f;
      end if;
    end loop;
  end loop;
  raise notice 'PASS: anon/authenticated have no table privileges and no internal helpers';
end $$;

set local role anon;

do $$
begin
  begin
    perform * from public.mochi_people;
    raise exception 'FAIL: anon selected mochi_people';
  exception when insufficient_privilege then
    raise notice 'PASS: anon select on mochi_people denied';
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 2. public walk list
-- ---------------------------------------------------------------------------
do $$
declare
  v jsonb := public.mochi_upcoming_walks();
begin
  if not v @> '[{"id": "e0000000-0000-4000-8000-000000000001"}]' then
    raise exception 'FAIL: published walk missing from mochi_upcoming_walks';
  end if;
  if v @> '[{"id": "e0000000-0000-4000-8000-000000000003"}]' then
    raise exception 'FAIL: draft walk visible to the public';
  end if;
  if v::text like '%Verify Owner%' or v::text like '%mochi-verify-owner%' then
    raise exception 'FAIL: public walk list leaks people';
  end if;
  raise notice 'PASS: public walk list shows published walks only, no PII';
end $$;

-- ---------------------------------------------------------------------------
-- 3. owner link
-- ---------------------------------------------------------------------------
do $$
declare
  owner text := 'a0000000000000000000000000000002';
  other text := 'a0000000000000000000000000000003';
  w1 uuid := 'e0000000-0000-4000-8000-000000000001';
  w2 uuid := 'e0000000-0000-4000-8000-000000000002';
  pup_a uuid := 'd0000000-0000-4000-8000-000000000001';
  pup_b uuid := 'd0000000-0000-4000-8000-000000000002';
  retired uuid := 'd0000000-0000-4000-8000-000000000003';
  other_pup uuid := 'd0000000-0000-4000-8000-000000000004';
  v jsonb;
  ok boolean;
begin
  v := public.mochi_me(owner);
  if v -> 'person' ->> 'name' <> 'Verify Owner' or jsonb_array_length(v -> 'dogs') <> 2 then
    raise exception 'FAIL: mochi_me returned %', v;
  end if;
  raise notice 'PASS: owner link resolves to their active dogs';

  begin
    perform public.mochi_rsvp(owner, w1, pup_a, false, false);
    raise exception 'FAIL: rsvp without waiver accepted';
  exception when others then
    if sqlerrm not like '%waiver%' then raise; end if;
  end;
  raise notice 'PASS: waiver required';

  v := public.mochi_rsvp(owner, w1, pup_a, true, true);
  if v ->> 'standing' <> 'confirmed' then raise exception 'FAIL: first rsvp not confirmed: %', v; end if;
  v := public.mochi_rsvp(owner, w1, pup_a, true, true);
  if v ->> 'standing' <> 'confirmed' then raise exception 'FAIL: repeat rsvp not idempotent: %', v; end if;
  raise notice 'PASS: rsvp confirmed and idempotent';

  begin
    perform public.mochi_rsvp(owner, w2, pup_a, true, false);
    raise exception 'FAIL: second walk the same day accepted';
  exception when others then
    if sqlerrm not like 'One walk a day%' then raise; end if;
  end;
  raise notice 'PASS: one walk per dog per day';

  begin
    perform public.mochi_rsvp(owner, w1, retired, true, false);
    raise exception 'FAIL: retired dog rsvp accepted';
  exception when others then
    if sqlerrm not like '%isn''t active%' then raise; end if;
  end;
  begin
    perform public.mochi_rsvp(owner, w1, other_pup, true, false);
    raise exception 'FAIL: rsvp for someone else''s dog accepted';
  exception when others then
    if sqlerrm not like '%isn''t on your account%' then raise; end if;
  end;
  begin
    perform public.mochi_opt_out(owner, w1, other_pup);
    raise exception 'FAIL: opt-out of someone else''s dog accepted';
  exception when others then
    if sqlerrm not like '%isn''t on your account%' then raise; end if;
  end;
  begin
    perform public.mochi_rsvp(owner, 'e0000000-0000-4000-8000-000000000003', pup_b, true, false);
    raise exception 'FAIL: rsvp on a draft walk accepted';
  exception when others then
    if sqlerrm not like '%isn''t open%' then raise; end if;
  end;
  raise notice 'PASS: retired, foreign and draft-walk rsvps refused';

  -- Fill the cap (2): pup B confirmed, other owner's pup waitlisted #1.
  v := public.mochi_rsvp(owner, w1, pup_b, true, false);
  if v ->> 'standing' <> 'confirmed' then raise exception 'FAIL: pup B not confirmed: %', v; end if;
  v := public.mochi_rsvp(other, w1, other_pup, true, false);
  if v ->> 'standing' <> 'waitlisted' or (v ->> 'waitlist_position')::int <> 1 then
    raise exception 'FAIL: over-cap rsvp not waitlisted #1: %', v;
  end if;
  raise notice 'PASS: cap enforced, overflow waitlisted';

  ok := public.mochi_opt_out(owner, w1, pup_a);
  v := public.mochi_me(other);
  if not (v -> 'rsvps') @> jsonb_build_array(jsonb_build_object('dog_id', other_pup, 'standing', 'confirmed')) then
    raise exception 'FAIL: waitlist not promoted after opt-out: %', v;
  end if;
  raise notice 'PASS: opt-out promotes the waitlist';

  begin
    perform public.mochi_admin_roster(owner, w1);
    raise exception 'FAIL: owner link reached the admin roster';
  exception when others then
    if sqlerrm not like '%walk-admin access%' then raise; end if;
  end;
  begin
    perform public.mochi_admin_people(owner);
    raise exception 'FAIL: owner link reached admin people';
  exception when others then
    if sqlerrm not like '%walk-admin access%' then raise; end if;
  end;
  raise notice 'PASS: owner links refused by admin functions';

  begin
    perform public.mochi_me('ffffffffffffffffffffffffffffffff');
    raise exception 'FAIL: unknown token accepted';
  exception when others then
    if sqlerrm not like 'This link isn''t valid%' then raise; end if;
  end;
  begin
    perform public.mochi_admin_walks('not-a-token');
    raise exception 'FAIL: malformed token accepted';
  exception when others then
    if sqlerrm not like 'This link isn''t valid%' then raise; end if;
  end;
  raise notice 'PASS: bad tokens refused';
end $$;

-- ---------------------------------------------------------------------------
-- 4. admin link
-- ---------------------------------------------------------------------------
do $$
declare
  adm text := 'a0000000000000000000000000000001';
  w1 uuid := 'e0000000-0000-4000-8000-000000000001';
  pup_b uuid := 'd0000000-0000-4000-8000-000000000002';
  admin_pup uuid := 'd0000000-0000-4000-8000-000000000005';
  v jsonb;
  app_id uuid;
  w jsonb;
begin
  v := public.mochi_admin_roster(adm, w1);
  if jsonb_array_length(v -> 'rows') <> 3 or (v -> 'walk' ->> 'confirmed')::int <> 2 then
    raise exception 'FAIL: admin roster unexpected: %', v;
  end if;
  raise notice 'PASS: admin roster lists every rsvp with standing';

  perform public.mochi_admin_mark(adm, w1, pup_b, 'check_in');
  if (public.mochi_admin_roster(adm, w1) -> 'walk' ->> 'checked_in')::int <> 1 then
    raise exception 'FAIL: check_in not counted';
  end if;
  perform public.mochi_admin_mark(adm, w1, pup_b, 'undo_check_in');
  perform public.mochi_admin_mark(adm, w1, admin_pup, 'add');
  perform public.mochi_admin_mark(adm, w1, admin_pup, 'waiver');
  perform public.mochi_admin_mark(adm, w1, admin_pup, 'opt_out');
  perform public.mochi_admin_mark(adm, w1, admin_pup, 'restore');
  v := public.mochi_admin_roster(adm, w1);
  if not (v -> 'rows') @> jsonb_build_array(jsonb_build_object(
       'dog_id', admin_pup, 'standing', 'waitlisted', 'waiver_signed', true)) then
    raise exception 'FAIL: add/waiver/opt_out/restore sequence: %', v;
  end if;
  if (v -> 'walk' ->> 'checked_in')::int <> 0 then
    raise exception 'FAIL: undo_check_in did not clear';
  end if;
  begin
    perform public.mochi_admin_mark(adm, w1, pup_b, 'explode');
    raise exception 'FAIL: unknown action accepted';
  exception when others then
    if sqlerrm <> 'Unknown action.' then raise; end if;
  end;
  raise notice 'PASS: walk-day actions';

  v := public.mochi_admin_add_owner(adm, 'Verify New Owner', 'MOCHI-VERIFY-NEW@example.com', '303-555-0199', 'Verify New Pup');
  if v ->> 'access_token' !~ '^[0-9a-f]{32}$' then raise exception 'FAIL: new owner has no link: %', v; end if;
  w := public.mochi_admin_add_owner(adm, 'Same Person', 'mochi-verify-new@example.com', null, 'Second Pup');
  if w ->> 'id' <> v ->> 'id' or jsonb_array_length(w -> 'dogs') <> 2 then
    raise exception 'FAIL: add_owner did not dedupe by email: %', w;
  end if;
  w := public.mochi_admin_new_link(adm, (v ->> 'id')::uuid);
  if w ->> 'access_token' = v ->> 'access_token' then raise exception 'FAIL: new_link kept the token'; end if;
  raise notice 'PASS: add owner (dedupe by email) and new link';

  v := public.mochi_admin_interest(adm);
  select (a ->> 'id')::uuid into app_id
  from jsonb_array_elements(v -> 'dogs') a where a ->> 'email' = 'mochi-verify-applicant@example.com';
  if app_id is null then raise exception 'FAIL: dog application missing from interest'; end if;
  v := public.mochi_admin_approve_dog(adm, app_id);
  if not (v -> 'dogs') @> '[{"name": "Verify Applicant Pup"}]' then
    raise exception 'FAIL: approve did not add the dog: %', v;
  end if;
  if public.mochi_admin_interest(adm)::text like '%mochi-verify-applicant%' then
    raise exception 'FAIL: approved application still open';
  end if;
  raise notice 'PASS: interest listed and approved into the roster';

  w := public.mochi_admin_save_walk(adm, 'e0000000-0000-4000-8000-000000000003', 'Verify draft', now() + interval '40 days',
         now() + interval '40 days 1 hour', 'mochi-verify draft', 10, 'published', null);
  if w ->> 'status' <> 'published' then raise exception 'FAIL: save_walk did not publish'; end if;
  begin
    perform public.mochi_admin_save_walk(adm, null, 'Bad', now() + interval '2 days', now() + interval '1 day',
            'mochi-verify bad', 10, 'draft', null);
    raise exception 'FAIL: walk ending before it starts accepted';
  exception when others then
    if sqlerrm not like 'The walk needs%' then raise; end if;
  end;
  raise notice 'PASS: save walk (publish, validation)';
end $$;

-- authenticated (any other app's signed-in user) gets nothing extra.
reset role;
set local role authenticated;
do $$
begin
  begin
    perform * from public.mochi_walk_rsvps;
    raise exception 'FAIL: authenticated selected mochi_walk_rsvps';
  exception when insufficient_privilege then
    raise notice 'PASS: authenticated select on mochi_walk_rsvps denied';
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 5. done: undo every probe row
-- ---------------------------------------------------------------------------
reset role;
do $$
begin
  raise notice 'schedule-verify.sql complete: all probes passed; rolling back the probe rows';
end $$;
rollback;
