-- ============================================================================
-- Mochi's Legacy — Supabase schema (v1)
--
-- System of record for dogs, people, teams, visits, facilities, events.
-- Source of truth: data-model.md (§1 entities, §2 identifiers).
--
-- Conventions:
--   * id           uuid PK, gen_random_uuid() — technical key (Supabase auth/RLS)
--   * code         human-readable stable reference where the plan calls for one
--                  (D-###, P-###, F-###, T-###, E-###, V-YYYYMMDD-###).
--                  Optional unique column; assign at intake.
--   * created_at   timestamptz default now() — Supabase convention.
--   * "enum" fields are text + CHECK (easier to alter than Postgres ENUMs).
--
-- Status: v1 — modeling choices resolved (DEC-0111): one `people` table with
-- role tags; itemized `vaccinations`; `incidents` and `donations` included
-- from day one.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PEOPLE — any human: owner, handler, volunteer, facility contact, donor,
-- attendee, board. One table with role tags (a donor who becomes a handler
-- stays one row).
-- ---------------------------------------------------------------------------
create table if not exists people (
  id                     uuid primary key default gen_random_uuid(),
  code                   text unique,                -- "P-014"
  full_name              text not null,
  email                  text unique,                -- dedupe key
  phone                  text,
  roles                  text[] not null default '{}', -- owner, handler, volunteer, facility_contact, donor, attendee, board
  verification_status    text not null default 'unverified'
    check (verification_status in ('unverified','verified')),
  background_check_status text not null default 'none'
    check (background_check_status in ('none','pending','cleared')),
  background_check_date  date,
  city                   text,
  notes                  text,
  created_at             timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- DOGS — the unit of health/safety. Owned by a Person.
-- ---------------------------------------------------------------------------
create table if not exists dogs (
  id                uuid primary key default gen_random_uuid(),
  code              text unique,                     -- "D-001"
  call_name         text not null,                   -- "Benny"
  registered_name   text,
  breed             text,
  sex               text check (sex in ('male','female')),
  dob               date,
  spayed_neutered   boolean,
  microchip         text,
  owner_id          uuid references people(id) on delete set null,
  photo_url         text,                            -- Supabase Storage path
  bite_history      boolean not null default false,  -- ATD disqualifier
  bite_history_note text,
  temperament_notes text,
  intake_notes      text,                            -- self-reported claims from public signup (age, rabies); verify at roster intake
  status            text not null default 'active'
    check (status in ('active','retired','passed')),
  joined_date       date,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TEAMS — one Dog + one Handler; the certified unit for visits.
-- ---------------------------------------------------------------------------
create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  code        text unique,                           -- "T-003"
  dog_id      uuid not null references dogs(id) on delete cascade,
  handler_id  uuid not null references people(id) on delete cascade,
  label       text,                                  -- "Benny + Kelsey"
  status      text not null default 'forming'
    check (status in ('forming','active','paused','retired')),
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  unique (dog_id, handler_id)
);

-- ---------------------------------------------------------------------------
-- CERTIFICATIONS — a registry credential held by a Team.
-- ---------------------------------------------------------------------------
create table if not exists certifications (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid not null references teams(id) on delete cascade,
  registry       text not null
    check (registry in ('ATD','Pet Partners','TDI','CGC')),
  status         text not null default 'in_progress'
    check (status in ('in_progress','certified','expired','revoked')),
  evaluated_date date,
  expiry_date    date,
  cert_id        text,                               -- external registry id
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- HEALTH RECORDS — annual wellness snapshot per Dog.
-- ---------------------------------------------------------------------------
create table if not exists health_records (
  id                 uuid primary key default gen_random_uuid(),
  dog_id             uuid not null references dogs(id) on delete cascade,
  record_date        date not null,                  -- annual exam date
  wellness_exam_date date,
  vet_clinic         text,
  vet_letter_on_file boolean not null default false,
  notes              text,
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- VACCINATIONS — itemized shot/test per Dog (rabies is 3-yr, bordetella annual;
-- facilities ask for different ones, so track each).
-- ---------------------------------------------------------------------------
create table if not exists vaccinations (
  id          uuid primary key default gen_random_uuid(),
  dog_id      uuid not null references dogs(id) on delete cascade,
  type        text not null
    check (type in ('rabies','DA2P-PV','bordetella','heartworm_test','fecal','lepto','flea_tick')),
  date_given  date not null,
  expiry_date date,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- FACILITIES — Track B sites we visit (nursing home = clinical ceiling).
-- ---------------------------------------------------------------------------
create table if not exists facilities (
  id                 uuid primary key default gen_random_uuid(),
  code               text unique,                    -- "F-002"
  name               text not null,
  type               text not null
    check (type in ('senior_living','school','library','university','other')),
  address            text,
  city               text,
  primary_contact_id uuid references people(id) on delete set null,
  requirements       text,                           -- the per-facility sheet
  pipeline_status    text not null default 'prospect'
    check (pipeline_status in ('target','prospect','active','paused','closed')),
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- PARTNERSHIPS — standing agreement with a Facility.
-- ---------------------------------------------------------------------------
create table if not exists partnerships (
  id                 uuid primary key default gen_random_uuid(),
  facility_id        uuid not null references facilities(id) on delete cascade,
  status             text not null default 'agreement_drafted'
    check (status in ('agreement_drafted','signed','active','paused','ended')),
  coordinator_ours   uuid references people(id) on delete set null,
  coordinator_theirs uuid references people(id) on delete set null,
  cadence            text,                           -- "2nd Tuesday monthly"
  signed_date        date,
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- VISITS — the impact log (one Team engagement at a Facility). THE grant data.
-- ---------------------------------------------------------------------------
create table if not exists visits (
  id              uuid primary key default gen_random_uuid(),
  code            text unique,                       -- "V-20260828-007"
  team_id         uuid not null references teams(id) on delete cascade,
  facility_id     uuid not null references facilities(id) on delete cascade,
  started_at      timestamptz not null,
  duration_min    int,
  people_reached  int,                               -- approximate
  dog_stress_flag boolean not null default false,
  early_exit      boolean not null default false,
  notes           text,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- EVENTS — Track A public gatherings.
-- ---------------------------------------------------------------------------
create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  code       text unique,                            -- "E-20260828-001"
  name       text not null,
  starts_at  timestamptz,
  venue      text,                                   -- "Kiln coworking" (free text for now)
  type       text check (type in ('meetup','tabling','other')),
  status     text not null default 'planned'
    check (status in ('planned','held','cancelled')),
  notes      text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ATTENDANCES — a Person at an Event (signup, waiver, photo consent).
-- ---------------------------------------------------------------------------
create table if not exists attendances (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id) on delete cascade,
  person_id     uuid references people(id) on delete cascade,  -- null until matched
  email         text,                                -- captured at sign-in (feeds the list)
  waiver_signed boolean not null default false,
  photo_consent boolean not null default false,
  source        text,                                -- qr, flyer, social, walkup
  signed_in_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- EVENT_DOGS — which dogs worked an Event, and by whom (many-to-many).
-- ---------------------------------------------------------------------------
create table if not exists event_dogs (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  dog_id     uuid not null references dogs(id) on delete cascade,
  handler_id uuid references people(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (event_id, dog_id)
);

-- ---------------------------------------------------------------------------
-- DONATIONS — deferred until 501(c)(3), but modeled now to avoid re-migration.
-- ---------------------------------------------------------------------------
create table if not exists donations (
  id         uuid primary key default gen_random_uuid(),
  person_id  uuid references people(id) on delete set null,
  amount     numeric(10,2) not null,
  donated_at date not null,
  source     text,                                   -- campaign, event, walkup
  deductible boolean not null default false,         -- false until determination letter
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- INCIDENTS — safety/behavior events. Kept empty, hopefully; the habit matters.
-- ---------------------------------------------------------------------------
create table if not exists incidents (
  id          uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null,
  dog_id      uuid references dogs(id) on delete set null,
  team_id     uuid references teams(id) on delete set null,
  event_id    uuid references events(id) on delete set null,
  visit_id    uuid references visits(id) on delete set null,
  description text not null,
  severity    text not null default 'minor'
    check (severity in ('minor','moderate','severe')),
  resolution  text,
  reporter_id uuid references people(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- Row-Level Security
-- Two technical users (founder + one collaborator) do all entry via the table
-- editor / SQL as authenticated users. Public signup (QR) needs a separate,
-- restricted anon INSERT path — sketched at the bottom.
-- ============================================================================

alter table people         enable row level security;
alter table dogs           enable row level security;
alter table teams          enable row level security;
alter table certifications enable row level security;
alter table health_records enable row level security;
alter table vaccinations   enable row level security;
alter table facilities     enable row level security;
alter table partnerships   enable row level security;
alter table visits         enable row level security;
alter table events         enable row level security;
alter table attendances    enable row level security;
alter table event_dogs     enable row level security;
alter table donations      enable row level security;
alter table incidents      enable row level security;

-- Authenticated collaborators: full access. Anon: denied by default.
do $$
declare t text;
begin
  foreach t in array array[
    'people','dogs','teams','certifications','health_records','vaccinations',
    'facilities','partnerships','visits','events','attendances','event_dogs',
    'donations','incidents'
  ]
  loop
    execute format(
      'create policy "%s_authenticated_all" on %I for all to authenticated using (true) with check (true);',
      t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- PRIVILEGES
-- PostgREST (the API layer) connects as `anon` / `authenticated`. Table
-- privileges are separate from RLS: grant the two technical collaborators
-- (authenticated) full table access, but give `anon` NOTHING on tables —
-- anonymous visitors reach the DB only through the signup function below.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- PUBLIC SIGNUP — the QR → contact + optional dog intake loop.
--
-- The landing page is anonymous and must NOT be able to read or write the
-- whole DB. This SECURITY DEFINER function is the only thing `anon` can
-- execute. Atomically: upserts the person (dedupe on email), records an
-- attendance (idempotent per event+email), and optionally registers their dog
-- (idempotent per owner+call_name). Self-reported dog claims (age, rabies)
-- land in dogs.intake_notes for later verification — never in verified
-- columns like vaccinations. `set search_path = public` blocks search_path
-- hijacking (SECURITY DEFINER best practice). `anon` gets EXECUTE only —
-- never table access.
-- ---------------------------------------------------------------------------
drop function if exists public_submit_signup(text, text, text, boolean, boolean);

create or replace function public_submit_signup(
  p_email           text,
  p_event_code      text,
  p_source          text    default 'qr',
  p_waiver          boolean default false,
  p_photo_consent   boolean default false,
  p_full_name       text    default null,
  p_phone           text    default null,
  p_dog_name        text    default null,
  p_dog_breed       text    default null,
  p_dog_age_years   int     default null,
  p_dog_spayed      boolean default null,
  p_dog_rabies      text    default null,   -- 'yes' | 'no' | 'not_sure'
  p_dog_temperament text    default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id  uuid;
  v_person_id uuid;
  v_id        uuid;
  v_email     text := lower(trim(p_email));
  v_has_dog   boolean := p_dog_name is not null and length(trim(p_dog_name)) > 0;
  v_roles     text[];
  v_intake    text;
begin
  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'email is required';
  end if;
  -- Defense in depth; mirrors the landing page's check so they never diverge.
  if p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid email address';
  end if;
  if p_event_code is null or length(trim(p_event_code)) = 0 then
    raise exception 'event_code is required';
  end if;
  -- Open endpoint hygiene: bound every free-text field.
  if length(p_email) > 254 or length(coalesce(p_full_name,'')) > 120
     or length(coalesce(p_phone,'')) > 40 or length(coalesce(p_dog_name,'')) > 60
     or length(coalesce(p_dog_breed,'')) > 80
     or length(coalesce(p_dog_temperament,'')) > 1000 then
    raise exception 'a field is too long';
  end if;
  if p_dog_age_years is not null and p_dog_age_years not between 0 and 30 then
    raise exception 'dog age must be between 0 and 30';
  end if;
  if p_dog_rabies is not null and p_dog_rabies not in ('yes','no','not_sure') then
    raise exception 'rabies status must be yes, no, or not_sure';
  end if;
  if v_has_dog and (p_full_name is null or length(trim(p_full_name)) = 0) then
    raise exception 'name is required to register a dog';
  end if;

  select id into v_event_id from events where code = p_event_code;
  if v_event_id is null then
    raise exception 'no event with code %', p_event_code;
  end if;

  -- Person: create-or-merge on email. Never blank out existing values.
  if p_full_name is not null and length(trim(p_full_name)) > 0 then
    v_roles := array['attendee'] || case when v_has_dog then array['owner'] else '{}' end;
    insert into people (full_name, email, phone, roles)
    values (trim(p_full_name), v_email, nullif(trim(coalesce(p_phone,'')), ''), v_roles)
    on conflict (email) do update set
      full_name = coalesce(nullif(trim(excluded.full_name), ''), people.full_name),
      phone     = coalesce(excluded.phone, people.phone),
      roles     = (select coalesce(array_agg(distinct r), '{}')
                   from unnest(people.roles || excluded.roles) as t(r))
    returning id into v_person_id;
  end if;

  insert into attendances (event_id, person_id, email, source, waiver_signed, photo_consent, signed_in_at)
  values (v_event_id, v_person_id, v_email, p_source, p_waiver, p_photo_consent, now())
  on conflict (event_id, email) where email is not null
  do update set
    person_id     = coalesce(excluded.person_id, attendances.person_id),
    waiver_signed = attendances.waiver_signed or excluded.waiver_signed,
    photo_consent = attendances.photo_consent or excluded.photo_consent,
    signed_in_at  = excluded.signed_in_at
  returning id into v_id;

  -- Dog: create-or-merge on (owner, call_name). dob is approximated from the
  -- self-reported age; the approximation is flagged in intake_notes.
  if v_has_dog then
    v_intake := concat_ws('; ',
      'self-reported at signup ' || to_char(now(), 'YYYY-MM-DD'),
      case when p_dog_age_years is not null
           then 'age ~' || p_dog_age_years || ' (dob approximate)' end,
      case when p_dog_rabies is not null
           then 'rabies up to date: ' || replace(p_dog_rabies, '_', ' ') end);

    insert into dogs (call_name, breed, dob, spayed_neutered, owner_id,
                      temperament_notes, intake_notes)
    values (
      trim(p_dog_name),
      nullif(trim(coalesce(p_dog_breed,'')), ''),
      case when p_dog_age_years is not null
           then (current_date - make_interval(years => p_dog_age_years))::date end,
      p_dog_spayed,
      v_person_id,
      nullif(trim(coalesce(p_dog_temperament,'')), ''),
      v_intake)
    on conflict (owner_id, lower(call_name)) where owner_id is not null
    do update set
      breed             = coalesce(excluded.breed, dogs.breed),
      dob               = coalesce(dogs.dob, excluded.dob),
      spayed_neutered   = coalesce(excluded.spayed_neutered, dogs.spayed_neutered),
      temperament_notes = coalesce(excluded.temperament_notes, dogs.temperament_notes),
      intake_notes      = excluded.intake_notes;
  end if;

  return v_id;
end;
$$;

revoke execute on function public_submit_signup(text, text, text, boolean, boolean, text, text, text, text, int, boolean, text, text) from public;
grant  execute on function public_submit_signup(text, text, text, boolean, boolean, text, text, text, text, int, boolean, text, text) to anon, authenticated;

-- ============================================================================
-- Indexes on foreign keys + common lookups
-- ============================================================================
create index if not exists idx_dogs_owner        on dogs(owner_id);
create index if not exists idx_teams_dog         on teams(dog_id);
create index if not exists idx_teams_handler     on teams(handler_id);
create index if not exists idx_certs_team        on certifications(team_id);
create index if not exists idx_health_dog        on health_records(dog_id);
create index if not exists idx_vacc_dog_expiry   on vaccinations(dog_id, expiry_date);
create index if not exists idx_facilities_type   on facilities(type);
create index if not exists idx_partnerships_fac  on partnerships(facility_id);
create index if not exists idx_visits_team       on visits(team_id);
create index if not exists idx_visits_facility   on visits(facility_id);
create index if not exists idx_visits_started    on visits(started_at);
create index if not exists idx_attendances_event on attendances(event_id);
-- Idempotent signups: one attendance per (event, email); re-submits merge rather
-- than duplicate. Partial so walkup rows (null email) are unaffected.
create unique index if not exists uq_attendances_event_email
  on attendances(event_id, email)
  where email is not null;
create index if not exists idx_event_dogs_event  on event_dogs(event_id);
create index if not exists idx_donations_person  on donations(person_id);
-- Idempotent public dog intake: one dog per (owner, call name); re-submits
-- merge. Partial so staff-entered dogs without owners are unaffected.
create unique index if not exists uq_dogs_owner_callname
  on dogs(owner_id, lower(call_name))
  where owner_id is not null;
