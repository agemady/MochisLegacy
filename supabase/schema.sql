-- Mochi's Legacy — Stage 1 landing schema
-- Four purpose-built tables. Anon has EXECUTE on the four RPCs only.
-- Zero table grants to anon. RLS on. Ops model is Stage 2 (other repo).

create extension if not exists "pgcrypto";

create table if not exists public.dog_applications (
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
              check (status in ('new','contacted','approved','archived')),
  created_at  timestamptz not null default now()
);

create table if not exists public.volunteer_applications (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  phone         text,
  skills        text[] not null default '{}',
  interests     text,
  availability  text,
  status        text not null default 'new'
                check (status in ('new','contacted','approved','archived')),
  created_at    timestamptz not null default now()
);

create table if not exists public.donation_pledges (
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
                 check (status in ('new','contacted','approved','archived')),
  created_at     timestamptz not null default now()
);

create table if not exists public.subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  created_at  timestamptz not null default now()
);

alter table public.dog_applications
  add column if not exists status text not null default 'new'
  check (status in ('new','contacted','approved','archived'));
alter table public.volunteer_applications
  add column if not exists status text not null default 'new'
  check (status in ('new','contacted','approved','archived'));
alter table public.donation_pledges
  add column if not exists status text not null default 'new'
  check (status in ('new','contacted','approved','archived'));

create index if not exists dog_apps_created_at_idx on public.dog_applications (created_at desc);
create index if not exists dog_apps_email_idx on public.dog_applications (email);
create index if not exists vol_apps_created_at_idx on public.volunteer_applications (created_at desc);
create index if not exists vol_apps_email_idx on public.volunteer_applications (email);
create index if not exists pledges_created_at_idx on public.donation_pledges (created_at desc);

alter table public.subscribers drop constraint if exists subscribers_email_key;
drop index if exists public.subscribers_email_key;
create unique index if not exists subscribers_email_lower_idx
  on public.subscribers (lower(email));
create unique index if not exists dog_apps_email_dog_name_lower_idx
  on public.dog_applications (lower(email), lower(dog_name));

alter table public.dog_applications       enable row level security;
alter table public.volunteer_applications enable row level security;
alter table public.donation_pledges       enable row level security;
alter table public.subscribers            enable row level security;

drop policy if exists "dog_applications_authenticated_all" on public.dog_applications;
drop policy if exists "volunteer_applications_authenticated_all" on public.volunteer_applications;
drop policy if exists "donation_pledges_authenticated_all" on public.donation_pledges;
drop policy if exists "subscribers_authenticated_all" on public.subscribers;

create policy "dog_applications_authenticated_all"
  on public.dog_applications for all to authenticated using (true) with check (true);
create policy "volunteer_applications_authenticated_all"
  on public.volunteer_applications for all to authenticated using (true) with check (true);
create policy "donation_pledges_authenticated_all"
  on public.donation_pledges for all to authenticated using (true) with check (true);
create policy "subscribers_authenticated_all"
  on public.subscribers for all to authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
revoke all on table public.dog_applications from anon;
revoke all on table public.volunteer_applications from anon;
revoke all on table public.donation_pledges from anon;
revoke all on table public.subscribers from anon;

create or replace function public._assert_email(p_email text)
returns text
language plpgsql
immutable
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

drop function if exists public.public_submit_dog_signup;

create or replace function public.public_submit_dog_signup(
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
set search_path = public
as $$
declare
  v_id uuid;
  v_email text := public._assert_email(p_email);
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

  insert into public.dog_applications (
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
    set email = excluded.email
  returning id into v_id;

  return v_id;
end;
$$;

drop function if exists public.public_submit_volunteer;

create or replace function public.public_submit_volunteer(
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
set search_path = public
as $$
declare
  v_id uuid;
  v_email text := public._assert_email(p_email);
begin
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'name is required';
  end if;
  if length(p_name) > 120 or length(coalesce(p_phone, '')) > 40
     or length(coalesce(p_interests, '')) > 1000
     or length(coalesce(p_availability, '')) > 500 then
    raise exception 'a field is too long';
  end if;

  insert into public.volunteer_applications (
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

drop function if exists public.public_submit_pledge;

create or replace function public.public_submit_pledge(
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
set search_path = public
as $$
declare
  v_id uuid;
  v_email text := public._assert_email(p_email);
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

  insert into public.donation_pledges (
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

drop function if exists public.public_subscribe;

create or replace function public.public_subscribe(
  p_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_email text := public._assert_email(p_email);
begin
  insert into public.subscribers (email)
  values (v_email)
  on conflict ((lower(email))) do update set email = excluded.email
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public._assert_email(text) from public, anon;
grant execute on function public._assert_email(text) to authenticated;

revoke execute on function public.public_submit_dog_signup(text, text, text, text, text, text, text, text) from public;
revoke execute on function public.public_submit_volunteer(text, text, text, text[], text, text) from public;
revoke execute on function public.public_submit_pledge(text, text, numeric, text, text, text) from public;
revoke execute on function public.public_subscribe(text) from public;

grant execute on function public.public_submit_dog_signup(text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.public_submit_volunteer(text, text, text, text[], text, text) to anon, authenticated;
grant execute on function public.public_submit_pledge(text, text, numeric, text, text, text) to anon, authenticated;
grant execute on function public.public_subscribe(text) to anon, authenticated;
