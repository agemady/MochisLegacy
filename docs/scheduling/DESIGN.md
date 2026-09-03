# Mochi's Legacy — Scheduling & Roster Ops Design (Track A MVP)

**Status:** Proposed Architecture & Implementation Specification  
**Branch:** `scheduling`  
**Author:** DESIGNER scheduling (Pane w2:p8 coordination)  
**Target Systems:** Supabase (Postgres + Auth + Storage), Vite + React mobile-first web app  

---

## 1. Goals and Non-goals

### Goals
- **Run the first Gaggle walks:** Deliver a lightweight, mobile-first scheduling and day-of check-in tool for Track A community walks (starting with October 2 at Foothills Community Park, Shelter A).
- **Enforce dog welfare hard constraints:** Enforce non-negotiable caps (maximum 1 visit/working hour per day, maximum 2–3 events per week per dog) and guarantee frictionless, guilt-free opt-out at any time.
- **Mobile-first RSVP & check-in:** Enable dog owners to RSVP from their phones in two taps, and enable the two founders to check in dogs and handlers at park shelters with real-time waiver and photo-consent indicators.
- **Roster progression foundation:** Bridge Stage 1 landing intake (`dog_applications`) into vetted roster tiers (`gaggle`, `candidate`, `therapy`) without breaking changes or duplicate data entry.
- **Forward-compatible Track B architecture:** Design the schema so certified facility visits (`Team`, `Facility`, `Visit`) slot in naturally without refactoring the Track A foundation.

### Non-goals
- **No Track B execution now:** Facility partnerships, facility coordinator portals, and registry certification verifications (ATD, Pet Partners, TDI) are deferred.
- **No native mobile app:** No App Store or Google Play packaging; mobile web browser PWA/responsive web is the sole deployment target.
- **No public self-serve registration:** Unvetted public users cannot create accounts or show up unvetted; dogs must be approved from `dog_applications` before RSVPing.
- **No payments or ticketing:** Gaggle walks are free community-building events. No ticketing, fees, or paid donation requirements during scheduling.
- **No in-app messaging or social feeds:** Direct communication remains SMS/email. No community chat, forum walls, or friend lists.
- **No hospital, hospice, or clinical facility features:** Explicitly excluded by organization charter. Senior living, memory care, schools, and libraries represent the clinical ceiling for Track B.

---

## 2. Actors

1. **Founder / Organizer (2 technical founders):**
   - Manage the dog roster (graduating applicants from `dog_applications` to `gaggle` tier).
   - Create and publish Track A Events (setting date, time, meeting shelter, and dog attendance caps).
   - Run mobile check-in at the park, verifying waivers and photo consent.
   - Record early exits or stress signs to protect dog welfare.

2. **Dog Owner:**
   - Owner of an approved dog on the roster (`gaggle`, `candidate`, or `therapy` tier).
   - Accesses mobile scheduling via magic link / passwordless auth.
   - Views upcoming Gaggle walks, checks spot availability, and RSVPs their dog(s).
   - Reviews and signs annual digital liability waiver and photo consent.
   - Can opt out or cancel an RSVP instantly with zero penalty.

3. **Handler:**
   - The human physically attached 1:1 to the Dog during an Event.
   - Frequently the Dog Owner, but modeled distinctly so a designated family member or approved volunteer can work the dog at an event.

4. **Volunteer / Greeter (Secondary):**
   - Community volunteer assisting founders at the park table.
   - Accesses mobile check-in sheet to greet arrivals, confirm waivers, and mark attendance.

---

## 3. Domain Model (CONTEXT.md Language)

```
[dog_applications] (Stage 1 Landing Intake)
        │
        │ (Founder vetting & graduation)
        ▼
    ┌────────┐ 1      * ┌────────┐
    │ Person │──────────│  Dog   │ (Roster: gaggle | candidate | therapy)
    └───┬────┘ (Owner)  └───┬────┘
        │                   │
        │                   │
        │ *               * │
   ┌────┴───────────┐  ┌────┴───────────┐
   │   Attendance   │  │    EventDog    │ (Dog participation, welfare check,
   │ (Person at Evt)│  │ (Dog at Event) │  check-in, opt-out status)
   └────────┬───────┘  └────┬───────────┘
            │               │
            │ *           * │
         ┌──┴───────────────┴──┐
         │        Event        │ (Track A Gaggle Walk)
         └─────────────────────┘
```

### Core Entities & Key Fields

- **`Person`**: Any human on record (owner, handler, volunteer, founder).
  - *Key fields:* `id` (uuid), `code` (`P-###`), `full_name`, `email` (unique natural key), `phone`, `roles` (`text[]`: `owner`, `handler`, `volunteer`, `admin`), `waiver_signed_at` (timestamptz), `photo_consent` (boolean), `created_at`.
- **`Dog`**: The unit of health, safety, and care on the roster. Identified by code because call names collide (e.g. two Junis).
  - *Key fields:* `id` (uuid), `code` (`D-###`), `call_name` (e.g. "Benny"), `owner_id` (FK `Person`), `roster_tier` (`gaggle` | `candidate` | `therapy`), `status` (`active` | `paused` | `retired`), `bite_history` (boolean, hard disqualifier if true), `intake_notes`, `application_id` (FK `dog_applications`, nullable provenance link).
- **`Event`**: A Track A public gathering (e.g. Gaggle of Goldens walk).
  - *Key fields:* `id` (uuid), `code` (`E-YYYYMMDD-###`), `title`, `starts_at` (timestamptz), `duration_minutes` (default 60), `meeting_spot` (e.g. "Foothills Community Park, Shelter A"), `capacity_dogs` (integer, e.g. 15), `status` (`draft` | `published` | `completed` | `cancelled`), `notes`.
- **`Attendance`**: A Person present at an Event (captures human liability, check-in, and photo permissions).
  - *Key fields:* `id` (uuid), `event_id` (FK `Event`), `person_id` (FK `Person`), `status` (`registered` | `attended` | `cancelled` | `no_show`), `waiver_signed` (boolean), `photo_consent` (boolean), `checked_in_at` (timestamptz).
- **`EventDog`**: A Dog worked at an Event, paired with its Handler. Unit of canine participation and welfare limits.
  - *Key fields:* `id` (uuid), `event_id` (FK `Event`), `dog_id` (FK `Dog`), `handler_id` (FK `Person`), `status` (`registered` | `checked_in` | `opted_out` | `withdrawn`), `opted_out_at` (timestamptz), `opt_out_reason` (text, e.g. "heat", "overstimulated", "owner preference"), `checked_in_at` (timestamptz).

### Intake (`dog_applications`) vs. Roster Tiers

The public landing page collects raw, untrusted submissions into `dog_applications`. These records are **not** live roster dogs.
1. **Intake Queue:** A submission in `dog_applications` holds owner contact info, dog name, age, breed, and unverified rabies status.
2. **Graduation:** A founder reviews the application, contacts the owner, verifies non-aggression and basic vaccination, and runs an RPC (`promote_dog_application`) that creates:
   - A `Person` row (with role `owner`).
   - A `Dog` row linked to `owner_id` with `application_id` pointing back to intake for audit trail.
3. **Roster Tiers:**
   - **`gaggle` (Track A Entry):** Vetted for public group walks. Friendly, vaccinated, manageable on leash. Eligible for Gaggle walks.
   - **`candidate` (Track B Prep):** Dogs and handlers preparing for registry evaluation. Eligible for Gaggle walks, pack mentoring, and mock evaluations.
   - **`therapy` (Track B Ready):** Evaluated and certified Teams eligible for scheduled visits to senior living, schools, and libraries.

---

## 4. MVP User Stories (Track A Gaggle Walks)

1. **Publish Walk (Founder):** As a founder, I can create and publish an Event with date, start time, 60-minute duration, meeting shelter, and a hard dog capacity (default 12–15), so owners know when and where the pack meets.
2. **Mobile RSVP (Owner):** As an approved dog owner, I can view upcoming published walks on my phone and RSVP my vetted dog(s) with two taps, receiving instant confirmation and meeting directions.
3. **Enforce Dog Welfare Limits (System):** As the system, I reject an RSVP with a friendly explanation if a dog has already worked 1 event that calendar day or reached 3 events that rolling week, preserving dog wellness automatically.
4. **Capacity Cap & Spot Counter (Owner):** As an owner, I see real-time remaining spots (e.g. "4 dog spots left of 15") and cannot RSVP once full, preventing uncontrolled pack size and canine stress.
5. **Waiver & Photo-Consent Gate (Owner):** As an owner RSVPing, if my annual liability waiver or photo consent is missing, I am prompted to complete it inline before my RSVP is confirmed.
6. **Day-of Park Check-in (Founder):** As a founder at Shelter A, I can open the mobile check-in roster, see arrived dog/handler pairs with green waiver badges, and tap "Check In" as each dog arrives.
7. **Frictionless Opt-Out (Owner & Founder):** As an owner or founder, I can tap "Opt Out" at any time before or during the walk if the dog is tired, stressed, or uncomfortable, with zero penalty and immediate capacity release.

---

## 5. Data Model: SQL Delta on Stage 1 Schema

The following SQL delta applies directly on top of `supabase/schema.sql`. It preserves all four Stage 1 tables (`dog_applications`, `volunteer_applications`, `donation_pledges`, `subscribers`) and layers on the operational scheduling entities.

```sql
-- ============================================================================
-- Mochi's Legacy — Scheduling & Operations Delta (Stage 2)
-- Builds on Stage 1 landing schema. Run in Supabase SQL editor.
-- ============================================================================

-- 1. PEOPLE (System humans: owners, handlers, volunteers, admins)
create table if not exists public.people (
  id                      uuid primary key default gen_random_uuid(),
  code                    text unique,                         -- "P-014"
  auth_user_id            uuid references auth.users(id) on delete set null,
  full_name               text not null,
  email                   text not null unique,                -- dedupe key
  phone                   text,
  roles                   text[] not null default '{"attendee"}', -- owner, handler, volunteer, admin
  waiver_signed_at        timestamptz,
  photo_consent           boolean not null default false,
  photo_consent_updated_at timestamptz,
  notes                   text,
  created_at              timestamptz not null default now()
);

-- 2. DOGS (Unit of health, safety, care)
create table if not exists public.dogs (
  id                uuid primary key default gen_random_uuid(),
  code              text unique,                               -- "D-001"
  call_name         text not null,                             -- "Benny"
  owner_id          uuid not null references public.people(id) on delete cascade,
  roster_tier       text not null default 'gaggle'
                    check (roster_tier in ('gaggle', 'candidate', 'therapy')),
  status            text not null default 'active'
                    check (status in ('active', 'paused', 'retired')),
  breed             text,
  dob_approx        date,
  rabies_expiry     date,
  bite_history      boolean not null default false,            -- Disqualifier if true
  application_id    uuid references public.dog_applications(id) on delete set null,
  notes             text,
  created_at        timestamptz not null default now()
);

-- 3. EVENTS (Track A Public Gatherings / Gaggle Walks)
create table if not exists public.events (
  id                uuid primary key default gen_random_uuid(),
  code              text unique,                               -- "E-20261002-001"
  title             text not null default 'Gaggle of Goldens Walk',
  starts_at         timestamptz not null,
  duration_minutes  int not null default 60
                    check (duration_minutes between 15 and 180),
  meeting_spot      text not null,                             -- "Foothills Community Park, Shelter A"
  capacity_dogs     int not null default 15
                    check (capacity_dogs between 1 and 50),
  status            text not null default 'draft'
                    check (status in ('draft', 'published', 'completed', 'cancelled')),
  description       text,
  notes             text,
  created_at        timestamptz not null default now()
);

-- 4. ATTENDANCES (Person attending Event)
create table if not exists public.attendances (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  person_id     uuid not null references public.people(id) on delete cascade,
  status        text not null default 'registered'
                check (status in ('registered', 'attended', 'cancelled', 'no_show')),
  waiver_signed boolean not null default false,
  photo_consent boolean not null default false,
  checked_in_at timestamptz,
  created_at    timestamptz not null default now(),
  unique (event_id, person_id)
);

-- 5. EVENT_DOGS (Dog participation, handler assignment, welfare tracking)
create table if not exists public.event_dogs (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  dog_id          uuid not null references public.dogs(id) on delete cascade,
  handler_id      uuid not null references public.people(id) on delete cascade,
  status          text not null default 'registered'
                  check (status in ('registered', 'checked_in', 'opted_out', 'withdrawn')),
  checked_in_at   timestamptz,
  opted_out_at    timestamptz,
  opt_out_reason  text,                                       -- "heat", "tired", "stressed", "owner_choice"
  created_at      timestamptz not null default now(),
  unique (event_id, dog_id)
);

-- Indexes for performance
create index if not exists idx_dogs_owner on public.dogs(owner_id);
create index if not exists idx_events_starts_at on public.events(starts_at);
create index if not exists idx_event_dogs_event on public.event_dogs(event_id);
create index if not exists idx_event_dogs_dog on public.event_dogs(dog_id);
create index if not exists idx_attendances_event on public.attendances(event_id);

-- ---------------------------------------------------------------------------
-- WELFARE GUARDRAIL CONSTRAINT (Max 1 event/day, Max 3 events/7-day rolling window)
-- ---------------------------------------------------------------------------
create or replace function public.check_dog_welfare_limits()
returns trigger
language plpgsql
as $$
declare
  v_event_start timestamptz;
  v_day_count int;
  v_week_count int;
begin
  -- Retrieve start timestamp of target event
  select starts_at into v_event_start from public.events where id = new.event_id;
  if v_event_start is null then
    raise exception 'Target event not found.';
  end if;

  -- 1. Daily limit check: Dog cannot work >1 event on the same calendar day
  select count(*) into v_day_count
  from public.event_dogs ed
  join public.events e on ed.event_id = e.id
  where ed.dog_id = new.dog_id
    and ed.status in ('registered', 'checked_in')
    and ed.id is distinct from new.id
    and date_trunc('day', e.starts_at at time zone 'America/Denver') = 
        date_trunc('day', v_event_start at time zone 'America/Denver');

  if v_day_count >= 1 then
    raise exception 'Welfare violation: Dog already scheduled for an event on this day (Max 1 event/day).';
  end if;

  -- 2. Weekly limit check: Dog cannot exceed 3 events in a 7-day window
  select count(*) into v_week_count
  from public.event_dogs ed
  join public.events e on ed.event_id = e.id
  where ed.dog_id = new.dog_id
    and ed.status in ('registered', 'checked_in')
    and ed.id is distinct from new.id
    and e.starts_at between (v_event_start - interval '6 days') and (v_event_start + interval '6 days');

  if v_week_count >= 3 then
    raise exception 'Welfare violation: Dog exceeds 3 events in a 7-day period.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_dog_welfare on public.event_dogs;
create trigger trg_check_dog_welfare
before insert or update on public.event_dogs
for each row execute function public.check_dog_welfare_limits();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.people enable row level security;
alter table public.dogs enable row level security;
alter table public.events enable row level security;
alter table public.attendances enable row level security;
alter table public.event_dogs enable row level security;

-- Founders / Authenticated Admins have full access
create policy "admin_full_access_people" on public.people for all to authenticated
  using (exists (select 1 from public.people p where p.auth_user_id = auth.uid() and 'admin' = any(p.roles)));

create policy "admin_full_access_dogs" on public.dogs for all to authenticated
  using (exists (select 1 from public.people p where p.auth_user_id = auth.uid() and 'admin' = any(p.roles)));

create policy "admin_full_access_events" on public.events for all to authenticated
  using (exists (select 1 from public.people p where p.auth_user_id = auth.uid() and 'admin' = any(p.roles)));

create policy "admin_full_access_attendances" on public.attendances for all to authenticated
  using (exists (select 1 from public.people p where p.auth_user_id = auth.uid() and 'admin' = any(p.roles)));

create policy "admin_full_access_event_dogs" on public.event_dogs for all to authenticated
  using (exists (select 1 from public.people p where p.auth_user_id = auth.uid() and 'admin' = any(p.roles)));

-- Public / Owner Read on Published Events
create policy "public_read_published_events" on public.events for select to anon, authenticated
  using (status = 'published');

-- Owners can view their own Person record and Dogs
create policy "owner_read_self" on public.people for select to authenticated
  using (auth_user_id = auth.uid());

create policy "owner_read_own_dogs" on public.dogs for select to authenticated
  using (owner_id in (select id from public.people where auth_user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- ATOMIC RSVP RPC (Handles Capacity, Attendee, Dog, Waiver, Welfare in 1 call)
-- ---------------------------------------------------------------------------
create or replace function public.rsvp_walk(
  p_event_id      uuid,
  p_dog_id        uuid,
  p_sign_waiver   boolean default false,
  p_photo_consent boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person_id uuid;
  v_current_dogs int;
  v_capacity int;
  v_event_status text;
  v_dog_owner uuid;
begin
  -- Resolve calling person via auth.uid()
  select id into v_person_id from public.people where auth_user_id = auth.uid();
  if v_person_id is null then
    raise exception 'Authenticated user is not registered on the roster.';
  end if;

  -- Validate event state and capacity
  select status, capacity_dogs into v_event_status, v_capacity
  from public.events where id = p_event_id;

  if v_event_status != 'published' then
    raise exception 'This walk is not currently open for RSVPs.';
  end if;

  select count(*) into v_current_dogs
  from public.event_dogs
  where event_id = p_event_id and status in ('registered', 'checked_in');

  if v_current_dogs >= v_capacity then
    raise exception 'This walk has reached its safe dog capacity (% dogs).', v_capacity;
  end if;

  -- Verify dog ownership
  select owner_id into v_dog_owner from public.dogs where id = p_dog_id;
  if v_dog_owner != v_person_id then
    raise exception 'You can only RSVP dogs registered under your profile.';
  end if;

  -- Update waiver & consent on Person if accepted
  if p_sign_waiver then
    update public.people
    set waiver_signed_at = coalesce(waiver_signed_at, now()),
        photo_consent = p_photo_consent,
        photo_consent_updated_at = now()
    where id = v_person_id;
  end if;

  -- Record Attendance for the human
  insert into public.attendances (event_id, person_id, status, waiver_signed, photo_consent)
  values (p_event_id, v_person_id, 'registered', p_sign_waiver, p_photo_consent)
  on conflict (event_id, person_id) do update set
    status = 'registered',
    waiver_signed = attendances.waiver_signed or excluded.waiver_signed,
    photo_consent = excluded.photo_consent;

  -- Record EventDog (Triggers welfare limit checks automatically)
  insert into public.event_dogs (event_id, dog_id, handler_id, status)
  values (p_event_id, p_dog_id, v_person_id, 'registered')
  on conflict (event_id, dog_id) do update set
    status = 'registered',
    opted_out_at = null,
    opt_out_reason = null;

  return jsonb_build_object('success', true, 'message', 'RSVP confirmed. See you at the park!');
end;
$$;

-- ---------------------------------------------------------------------------
-- INTAKE PROMOTION RPC: Graduate dog_applications to live roster
-- ---------------------------------------------------------------------------
create or replace function public.promote_dog_application(p_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app record;
  v_person_id uuid;
  v_dog_id uuid;
  v_person_code text;
  v_dog_code text;
begin
  select * into v_app from public.dog_applications where id = p_application_id;
  if v_app is null then
    raise exception 'Application not found.';
  end if;

  -- Generate human-readable codes
  v_person_code := 'P-' || lpad((coalesce((select count(*) from public.people), 0) + 1)::text, 3, '0');
  v_dog_code    := 'D-' || lpad((coalesce((select count(*) from public.dogs), 0) + 1)::text, 3, '0');

  -- Create or reuse Person
  insert into public.people (code, full_name, email, phone, roles)
  values (v_person_code, v_app.owner_name, v_app.email, v_app.phone, array['owner', 'handler'])
  on conflict (email) do update set
    roles = (select coalesce(array_agg(distinct r), '{}') from unnest(public.people.roles || array['owner', 'handler']) as t(r))
  returning id into v_person_id;

  -- Create Dog at tier 'gaggle'
  insert into public.dogs (code, call_name, owner_id, roster_tier, status, breed, application_id, intake_notes)
  values (
    v_dog_code,
    v_app.dog_name,
    v_person_id,
    'gaggle',
    'active',
    v_app.breed,
    p_application_id,
    concat_ws('; ', 'Age: ' || v_app.age, 'City: ' || v_app.city, 'Notes: ' || v_app.notes)
  )
  returning id into v_dog_id;

  return jsonb_build_object('person_id', v_person_id, 'dog_id', v_dog_id, 'dog_code', v_dog_code);
end;
$$;

grant execute on function public.rsvp_walk(uuid, uuid, boolean, boolean) to authenticated;
grant execute on function public.promote_dog_application(uuid) to authenticated;
```

---

## 6. Screens (Mobile-First, Max 5)

All screens are designed for 390px mobile viewports (iOS Safari / Android Chrome).

### Screen 1: Upcoming Walks (Public / Owner Home)
- **Top Bar:** Mochi’s Legacy badge, current user profile circle or "Log In" button.
- **Hero Card:** Next scheduled walk highlight (e.g. "Kickoff Gaggle Walk · Oct 2 · Foothills Community Park, Shelter A").
- **Live Capacity Pill:** Visual pill badge: "7 of 15 Dog Spots Available" (turns red/amber when ≤ 2 spots remain).
- **Date & Time Details:** 60-minute duration indicator ("10:00 AM – 11:00 AM MDT"), park shelter note, and weather reminder.
- **Action CTA:** Primary amber button: "RSVP My Dog" (opens Screen 2) or "View Details" if already RSVP'd.
- **Pack Welfare Note:** Small footer callout: "Gaggle walks are paced for dog wellness. Dogs can take breaks or leave anytime."

### Screen 2: RSVP & Dog Selection (Owner Bottom Sheet)
- **Modal Header:** "RSVP for [Walk Title]" with close 'X'.
- **Dog Selector:** Radio/checkbox list of approved dogs belonging to the logged-in owner. Each dog card shows call name, breed, and status.
  - *Welfare Guard:* If a dog has reached 3 events that week or 1 that day, the checkbox is disabled with an informative tag: *"Mochi Welfare Limit: Benny has walked 3 times this week. Needs rest!"*
- **Handler Confirmation:** Pre-filled with owner name, with an option to specify an alternate approved handler.
- **Waiver & Consent Section (if uncompleted):** Inline checkbox: *"I sign the Mochi's Legacy 2026 Participant Waiver"* (links to modal text) and toggle: *"I grant photo consent for community recap posts"*.
- **Submit CTA:** Full-width amber button: "Confirm RSVP". Triggers atomic `rsvp_walk` RPC.

### Screen 3: Walk Pass & Opt-Out Hub (Owner Day-of View)
- **Confirmation Badge:** Big green checkmark: *"You & Benny are on the roster!"*
- **Meeting Spot Card:** Exact shelter directions, map link pin, parking tips ("Park in Foothills Shelter A North Lot").
- **What to Bring List:** 6-foot non-retractable leash, water bowl, high-value treats, poop bags.
- **Unconditional Opt-Out Button:** Prominent stone/red outlined button: **"Need to cancel or opt out? Tap here."**
  - Tapping opens a zero-guilt 1-tap confirmation: *"No problem! Benny's well-being comes first. Tap to release your spot."* Releases spot back to the walk immediately.

### Screen 4: Day-of Park Check-In (Founder Mobile Ops)
- **Sticky Header:** Event title + real-time counter: **"11 / 15 Checked In · 1 Opted Out"**.
- **Search & Filter:** Instant search input ("Search by dog or handler name...").
- **Roster Cards (Alphabetical by Dog Call Name):**
  - **Dog Name (Bold):** e.g., "Benny" (Tier: *gaggle*).
  - **Handler Name & Phone Link:** "Kelsey M. · (303) 555-0192".
  - **Status Indicators:** Green badge "Waiver Signed" / Yellow badge "Waiver Missing" / Camera icon for Photo Consent.
  - **One-Tap Actions:** Big green button: "Check In". Secondary option: "Dog Stressed / Opt Out".
- **Floating Action:** "Add Walk-in Pair" (launches quick on-site check).

### Screen 5: Walk Creator & Roster Manager (Founder Admin)
- **Simple Form Stack:**
  - Walk Title (default: "Gaggle of Goldens Community Walk").
  - Date & Start Time picker.
  - Duration picker (default: 60 minutes).
  - Meeting Spot (text input with quick-select pills: "Foothills Park Shelter A", "Valmont Park", "North Boulder Park").
  - Dog Capacity Limit (number stepper: 12 to 18, default 15).
  - Notes for Owners (e.g. "Bring extra water, trail has low shade").
  - Publish Status Toggle (`Draft` vs `Published`).
- **Save / Publish CTA:** "Save & Publish Walk".

---

## 7. Auth: Recommendation & Rationale

### Recommendation
**Supabase Magic Link (Passwordless Email OTP) for Dog Owners + Standard Supabase Email/Password for the Two Founders.**

### Why this is the simplest and best option:
1. **Zero mobile password friction:** Dog owners operate exclusively on smartphones. Forcing them to create, store, and remember passwords for a twice-monthly community walk leads to lost access and park-side frustration.
2. **Natural intake alignment:** Owners already provided their email in `dog_applications`. When a founder approves their application, a welcome email sends a Supabase Magic Link. Tapping it authenticates them instantly on their phone browser with zero password setup.
3. **Founder stability:** The two technical founders use standard Supabase Email/Password (or project dashboard access) with persistent sessions, protected by `'admin'` role checks in `public.people`.
4. **Why NOT Social OAuth (Apple/Google) for MVP:** Third-party OAuth introduces Apple Developer team enrollment fees ($99/yr), Google Cloud OAuth consent verification delays, redirect URI mismatches across staging/custom domains, and fragile in-app browser popups (e.g. opening a link from Instagram/SMS into iOS WebKit).
5. **Why NOT SMS/Phone OTP for MVP:** Twilio/SMS authentication requires A2P 10DLC campaign registration, recurring phone number rental, and per-message costs. Email magic links cost $0 on Supabase's free/included tier.

---

## 8. App Architecture: Route (`/schedule`) vs. Separate App Dir

### Trade-off Evaluation

| Dimension | Option A: Same Vite App (`/schedule` route) | Option B: Separate App (`apps/schedule` or separate repo) |
|---|---|---|
| **Build & Deploy** | Single Cloudflare Pages build (`npm run build`). Single git branch and pipeline. | Two separate builds, two Cloudflare projects or monorepo toolchain (Turborepo/pnpm). |
| **Shared Assets** | Shared Tailwind v4 tokens (amber/stone palette), shared `lucide-react` icons, shared `lib/supabase.ts`. | Code duplication or shared internal npm package overhead. |
| **Domain & Routing** | Clean URL: `mochislegacy.com/schedule`. Handled via React Router with SPA fallback. | Subdomain (`schedule.mochislegacy.com`) requiring extra DNS, SSL, and CORS configuration. |
| **Context Switching** | 2 technical founders maintain one unified codebase. | Overhead of synchronizing dependencies, types, and schema clients across two repos. |
| **Bundle Impact** | Landing page bundle could grow if unmanaged. | Clean bundle isolation. |

### Recommendation
**Same Vite app on a `/schedule` route, code-split with `React.lazy()`.**

**Rationale:**  
With two technical founders, developer velocity and operational simplicity dominate. A monorepo or separate repo introduces double CI/CD maintenance, CORS headers, and cross-repo schema synchronization for zero tangible user benefit. By using dynamic imports (`const ScheduleApp = React.lazy(() => import('./schedule/ScheduleApp'))`), the public landing page stays featherweight (~214 kB), while the scheduling tools load on demand only when navigating to `/schedule`.

---

## 9. Facility Visits (Track B): Forward-Fitting & Deliberate Deferrals

Track B involves certified dog-and-handler Teams visiting senior living communities, schools, and libraries. While out of scope for the MVP Gaggle walks, the schema is designed so Track B slots in without modifying Track A tables.

```
       [Person] (Handler)
          │
          │ 1
       ┌──┴───────────┐ *
       │     Team     │─────── [Certification] (ATD, Pet Partners, TDI)
       └──┬───────────┘
          │ *
          │ 1
        [Dog] (Tier: 'therapy')
          │
          │ *
       ┌──┴───────────┐ *
       │    Visit     │─────── [Facility] (Senior Living, School, Library)
       └──────────────┘           ▲
                                  │ 1
                             [Partnership] (Cadence, agreements)
```

### How the Model Accommodates Track B Later
1. **`Dog.roster_tier`:** Dogs graduate from `gaggle` → `candidate` → `therapy`. Only dogs at tier `therapy` can be attached to a `Team`.
2. **`Team` junction:** When Track B launches, a `teams` table (`dog_id`, `handler_id`, `status`) represents the unit of certification.
3. **`Facility` and `Partnership`:** Track B facilities (senior living, libraries) attach via `partnerships`.
4. **`Visit`:** Represents one Team engagement at a Facility. Tracks grant impact metrics (`people_reached`, `duration_min`).
5. **Unified Welfare Guardrail:** The trigger function `check_dog_welfare_limits()` can simply query both `event_dogs` (Track A) and `visits` (Track B), ensuring the 1 visit-hour/day and 3 engagements/week rule applies across both tracks seamlessly.

### Deliberately Deferred (What NOT to build now)
- **`teams` table:** Not needed for Track A where owners walk their own dogs.
- **`facilities` & `partnerships` tables:** Deferred until initial facility agreements are signed.
- **`certifications` table:** Registry logging (ATD, Pet Partners, CGC) is deferred; Gaggle walks require vetting, not formal registry credentialing.
- **`vaccinations` itemized tracking:** The landing intake's rabies self-report is sufficient for MVP; an itemized shot table (`rabies`, `bordetella`, `DA2P-PV`) is deferred until senior living facility sheets require verification.
- **`incidents` table:** Kept in reserve; day-of notes on `event_dogs` suffice for initial walks.

---

## 10. Open Questions for the Founder (Max 6)

1. **Pack Size Capacity:** For Foothills Community Park Shelter A, is **15 dogs** the right hard cap for the kickoff walk, or would 10–12 dogs provide a safer margin for the first public gathering?
2. **Waiver Cadence:** Can the participant liability waiver be signed **once per year** (stored on `Person.waiver_signed_at`), or does our legal guidance require a waiver acknowledgment on every individual RSVP?
3. **Non-Owner Handlers on Track A:** For the kickoff walks, will we allow family members/friends to handle an owner's dog if the owner isn't present, or must the registered owner be the sole handler for MVP?
4. **Day-of Walk-up Dogs:** If an unvetted Golden Retriever owner shows up at Shelter A on October 2, do founders want a fast on-site mobile intake bypass, or is policy strictly "spectate today, apply online for the next walk"?
5. **Visual Photo Opt-Out:** Since photo consent is tracked per attendee, how should we visually identify dogs/owners who opted out of photography during the walk (e.g. red bandana or special leash ribbon)?
6. **Breed Inclusivity for Gaggle:** Is Gaggle of Goldens strictly Golden Retrievers and Golden mixes, or are other vetted friendly breeds permitted if referred by founders?

---

## 11. What Not to Build

To keep the system robust, lean, and easily maintainable by two technical founders, the following features are explicitly barred from the scheduling MVP:

- **No Public User Self-Registration:** Never allow unvetted internet visitors to create accounts or register dogs directly. All dogs must originate from `dog_applications` and be manually approved by a founder.
- **No Native Apps or App Store Distribution:** No React Native, Flutter, Swift, or Kotlin. The web app on mobile browsers satisfies all operational needs with zero app review cycles.
- **No Complex RBAC Matrix:** No multi-tenant permissions or granular role matrices. Two roles exist: `admin` (the two founders) and `attendee`/`owner`.
- **No Custom Chat or Push Notification Infrastructure:** No WebSockets, Firebase Cloud Messaging, or Twilio SMS engines. Browser links, email confirmations, and direct phone calls handle all coordination.
- **No Live GPS Dog Tracking:** No real-time map tracking of dogs during the walk. Group walks are visual, physical gatherings led by humans in a park.
- **No Paid Reservation or Deposit Engine:** Track A community walks are free. No Stripe integration, paid RSVP hold fees, or ticketing tiers.
