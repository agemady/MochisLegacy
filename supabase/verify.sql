-- Mochi's Legacy — verify.sql (landing interest forms)
-- Run this in the Supabase SQL editor (as postgres) AFTER schema.sql.
-- What it proves:
--   1. anon CANNOT select from any of the four interest tables.
--   2. anon CAN call the four submit functions (probe rows are inserted).
-- It runs in ONE transaction that ends in ROLLBACK, so probe rows never persist.
-- If a step fails, the script aborts with an error — read the message.

begin;
set local role anon;

do $$
declare
  t text;
begin
  foreach t in array array[
    'mochi_dog_applications', 'mochi_volunteer_applications', 'mochi_donation_pledges', 'mochi_subscribers'
  ] loop
    begin
      execute format('select 1 from public.%I limit 1', t);
      raise exception 'FAIL: anon selected from % — table grants leaked!', t;
    exception
      when insufficient_privilege then
        raise notice 'PASS: anon select on % denied', t;
    end;
  end loop;
end $$;

do $$
declare
  v_id uuid;
begin
  v_id := public.mochi_submit_dog_signup(
    p_owner_name => 'Mochi Verify Probe',
    p_email      => 'mochi-verify-probe@example.com',
    p_dog_name   => 'Probe Pup',
    p_notes      => 'MOCHI-VERIFY-PROBE dog application'
  );
  raise notice 'PASS: mochi_submit_dog_signup as anon -> %', v_id;

  v_id := public.mochi_submit_volunteer(
    p_name      => 'Mochi Verify Probe',
    p_email     => 'mochi-verify-probe@example.com',
    p_skills    => '{walks}',
    p_interests => 'MOCHI-VERIFY-PROBE volunteer application'
  );
  raise notice 'PASS: mochi_submit_volunteer as anon -> %', v_id;

  v_id := public.mochi_submit_pledge(
    p_name      => 'Mochi Verify Probe',
    p_email     => 'mochi-verify-probe@example.com',
    p_frequency => 'one-time',
    p_message   => 'MOCHI-VERIFY-PROBE donation pledge'
  );
  raise notice 'PASS: mochi_submit_pledge as anon -> %', v_id;

  v_id := public.mochi_subscribe(p_email => 'mochi-verify-probe@example.com');
  raise notice 'PASS: mochi_subscribe as anon -> %', v_id;

  begin
    perform public.mochi_submit_dog_signup('Probe', 'not-an-email', null, 'Pup');
    raise exception 'FAIL: invalid email accepted';
  exception when others then
    if sqlerrm <> 'invalid email address' then raise; end if;
    raise notice 'PASS: invalid email refused';
  end;
end $$;

reset role;
do $$
begin
  raise notice 'verify.sql complete: anon locked out of tables, all four submit functions working; rolling back the probe rows';
end $$;
rollback;
