# Mochi's Legacy — Scheduling & Roster Ops Design (Track A MVP)

**Ruling 11 Specification** — Minimal operational design for Track A Gaggle walks (October 2 Kickoff at Foothills Community Park, Shelter A).

---

## 1. Goals and Non-Goals

### Goals
- **Run the first Gaggle walk:** Mobile RSVP and park check-in for October 2 at Foothills Park Shelter A (~15 dogs).
- **Dog welfare guardrails:** Max 1 walk/day per dog, hard capacity limit with automatic waitlist, and guilt-free 1-tap opt-out.
- **Minimal ops footprint:** Two technical founders administer walks directly in Supabase Studio; zero bespoke admin CRUD forms.

### Non-Goals
- No Track B facility visits, registry certifications (ATD/TDI), or facility partnerships now.
- No admin walk creation/editing forms (events seeded via Supabase Studio).
- No promotion RPCs, granular veterinary columns (`bite_history`, `rabies_expiry`), or separate handler entities.
- No park-side walk-in intake flow (unvetted dogs spectate only; dog welfare is non-negotiable).

---

## 2. Actors

1. **Founder / Admin (2 technical founders):**
   - Seed and configure walks in Supabase Studio.
   - Run mobile check-in at `/checkin` (gated by `is_admin = true`), verify waivers, and log opt-outs/stress.
2. **Dog Owner:**
   - Authenticated via Supabase Magic Link.
   - Views upcoming walks at `/schedule`, RSVPs their vetted dog, signs waiver per RSVP, and can opt out anytime.

---

## 3. Data Model (Pointer to `supabase/schedule.sql`)

The SQL delta is maintained in `supabase/schedule.sql`. It extends the Stage 1 landing schema with **four tables only**:

1. **`people`**: System humans (owners, founders).
   - `id` (uuid PK), `auth_user_id` (uuid FK `auth.users`), `name` (text), `email` (text unique), `phone` (text), `is_admin` (boolean default false), `created_at` (timestamptz).
2. **`dogs`**: Canine unit of care.
   - `id` (uuid PK), `owner_id` (uuid FK `people`), `call_name` (text), `roster_tier` (text check `roster_tier in ('gaggle', 'candidate', 'therapy')` default `'gaggle'`), `status` (text check `status in ('active', 'paused', 'retired')` default `'active'`), `created_at` (timestamptz).
3. **`walks`**: Track A community events (seeded in Studio).
   - `id` (uuid PK), `title` (text), `starts_at` (timestamptz), `duration_min` (int default 60), `meeting_spot` (text), `capacity_dogs` (int default 15), `status` (text check `status in ('draft', 'published', 'completed', 'cancelled')` default `'published'`), `created_at` (timestamptz).
4. **`walk_rsvps`**: Unified RSVP, waiver, attendance, and welfare record.
   - `id` (uuid PK), `walk_id` (uuid FK `walks`), `dog_id` (uuid FK `dogs`), `owner_id` (uuid FK `people`), `status` (text check `status in ('confirmed', 'waitlisted', 'checked_in', 'opted_out', 'cancelled')`), `waitlist_position` (int), `waiver_signed` (boolean not null), `photo_consent` (boolean default false), `checked_in_at` (timestamptz), `opted_out_at` (timestamptz), `opt_out_reason` (text), `created_at` (timestamptz).

**Key Constraints & Welfare:**
- `UNIQUE (walk_id, dog_id)`: Prevents duplicate bookings for the same walk.
- Daily limit: Max 1 walk/day per dog enforced at RSVP time.
- Roster promotion: Founders manually insert approved applicants from `dog_applications` into `people` and `dogs` in Supabase Table Editor.

---

## 4. Screens (Mobile-First, 2 Screens)

### Screen 1: `/schedule` (Owner Walk & RSVP Hub)
- **Upcoming Walk Card:** Displays Oct 2 walk details (time, 60m duration, Foothills Shelter A pin) and live capacity pill ("X of 15 spots open").
- **RSVP Modal:** Owner selects their approved dog, completes the required liability waiver checkbox (required per RSVP), toggles photo consent, and confirms.
  - *Waitlist Default:* If 15 spots are filled, RSVP is saved as `status = 'waitlisted'` with position.
- **RSVP'd State:** If already registered, shows confirmation banner, meeting directions, what to bring, and a prominent 1-tap red button: **"Opt Out / Cancel Spot"** (instantly releases spot and promotes waitlist #1).

### Screen 2: `/checkin` (Founder Mobile Ops Roster)
- **Access:** Gated to authenticated users with `people.is_admin = true`.
- **Header:** Live walk metrics: **"11 / 15 Checked In · 1 Opted Out"**.
- **Roster List:** Alphabetical by dog call name showing owner name, phone link, and green "Waiver Signed" badge.
- **One-Tap Actions:** Big green **[Check In]** button and red **[Opt Out]** button (prompts for quick note: heat, tired, stressed).

---

## 5. Auth

- **Supabase Magic Link (Passwordless Email OTP) for all users** (owners and founders).
- **Admin Access:** Controlled via `people.is_admin = true`. Founders log in via magic link to their admin emails.
- **Rationale:** Zero password fatigue in the park; email is already captured at landing intake; zero OAuth app setup/verification fees or mobile browser popup redirect bugs.

---

## 6. Open Questions for the Founder

1. **Intake to Roster Transition for Oct 2:** The landing displays 11 kickoff dogs (Benny, Honey, Bear, etc.). Are these 11 pre-seeded directly into `dogs`, or must their owners submit through the web form to capture contact details and signatures?
2. **Pack Capacity & Waitlist:** Confirm that 15 dogs is the hard ceiling for Foothills Shelter A, and that waitlist overflow should automatically activate when full (default: waitlist on).
3. **Waiver Legal Cadence:** Confirm whether Colorado nonprofit legal guidance permits an annual waiver or strictly requires an affirmative liability waiver on every individual walk RSVP (default: waiver per RSVP).
