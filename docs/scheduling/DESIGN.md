# Mochi's Legacy — Scheduling & Roster Ops Design (Track A MVP)

**Ruling 11 Specification** — Minimal operational design for Track A Gaggle walks (October 2 Kickoff at Foothills Community Park, Shelter A).

---

## 1. Goals and Non-Goals

### Goals
- **Run the first Gaggle walk:** Mobile RSVP and park check-in for October 2 at Foothills Park Shelter A (~15 dogs).
- **Dog welfare guardrails:** Max 1 walk/day per dog, hard capacity limit with automatic waitlist, and guilt-free 1-tap opt-out.
- **Minimal ops footprint:** Founders run everything from one phone-friendly tools page (`/checkin`); nobody hand-edits tables in the shared Supabase project (ruling 20).

### Non-Goals
- No Track B facility visits, registry certifications (ATD/TDI), or facility partnerships now.
- No granular veterinary columns (`bite_history`, `rabies_expiry`) or separate handler entities yet.
- No park-side walk-in intake flow (unvetted dogs spectate only; dog welfare is non-negotiable).

---

## 2. Actors

1. **Founder / Admin (2 technical founders):**
   - Create and publish walks, add owners and dogs, send personal links, triage landing-page interest (`/checkin`).
   - Run mobile check-in at `/checkin` (admin link: a person with `is_admin = true`), verify waivers, and log opt-outs.
2. **Dog Owner:**
   - Opens their personal link (no account, no password).
   - Views upcoming walks at `/schedule`, RSVPs their vetted dog, signs waiver per RSVP, and can opt out anytime.

---

## 3. Data Model (pointer to `supabase/schedule.sql`)

The tables live in a **shared** Supabase project (ruling 20), so every object is prefixed `mochi_` and Supabase Auth is not used. Four tables:

1. **`mochi_people`** — owners and founders: `name`, optional `email` (unique, case-insensitive) and `phone`, `is_admin`, and a private 32-hex `access_token` that powers their personal link.
2. **`mochi_dogs`** — `owner_id`, `name` (unique per owner), `tier` (`gaggle`/`candidate`/`therapy`), `status` (`active`/`retired`).
3. **`mochi_walks`** — `title`, `starts_at`, `ends_at`, `meeting_spot`, `cap`, `status` (`draft`/`published`/`done`), `notes` shown to owners.
4. **`mochi_walk_rsvps`** — one row per (walk, dog): `waiver_signed`, `photo_consent`, `joined_at` (queue order), `checked_in_at`, `opted_out_at`, `opted_out_by`.

**Standing is derived, never stored:** active RSVPs ordered by `joined_at` fill the cap; the rest are the waitlist. An opt-out therefore promotes the next dog automatically, and re-joining goes to the back of the line.

**Rules enforced in the database functions:** waiver per RSVP; cap + waitlist; one walk per dog per Mountain-Time day; only active dogs; sign-ups close at the start time; owners touch only their own dogs; admin functions need an admin link.

**Access:** RLS on, no policies, no table grants to `anon`/`authenticated`. The site calls SECURITY DEFINER functions only (`mochi_upcoming_walks`, `mochi_me`, `mochi_rsvp`, `mochi_opt_out`, and `mochi_admin_*`). `supabase/schedule-verify.sql` proves each rule.

---

## 4. Screens (mobile-first)

### `/schedule` (owners; public calendar without a link)
- Without a link: upcoming published walks (spots pill, Maps link, notes) and a "New here? Come walk with us." card that opens the landing page's dog form (`/#dog`) — the gaggle interest path.
- With a personal link: "Hi, <name>", every upcoming walk with one row per dog — walking / waitlist #n / not signed up — inline sign-up (required waiver, optional photo consent) and a guilt-free two-tap opt-out.

### `/checkin` (founders' tools, alias `/admin`)
- **Walk day:** walk picker, counters, roster (not-here first), Check in / Undo, Opt out / Restore, paper waiver, add a roster dog.
- **Gaggle:** add owners and dogs; copy, text or email each person's link; issue a new link.
- **Interest:** landing-page dog/volunteer/pledge forms; "Add to gaggle" approves a dog application into the roster and shows the link to send.
- **Walks:** create, edit and publish walks (Mountain Time).

---

## 5. Access: personal links, not sign-ins

- Every person has a private link: `/schedule#k=<token>` (founders: `/checkin#k=<token>`). The token sits in the URL fragment (never sent to servers or logs) and moves to local storage after the first visit.
- **Why not magic links:** the shared project's other app enrolls every new Supabase Auth user into itself (an `auth.users` trigger), and magic links also needed custom SMTP before owners could receive them. Links need neither, and founders can text them from the Gaggle tab.
- A leaked link is replaced from the Gaggle tab ("New link"); the old one stops working immediately.

---

## 6. Open Questions for the Founder

1. **Intake to Roster Transition for Oct 2:** The landing displays 11 kickoff dogs (Benny, Honey, Bear, etc.). Are these 11 pre-seeded directly into `dogs`, or must their owners submit through the web form to capture contact details and signatures?
2. **Pack Capacity & Waitlist:** Confirm that 15 dogs is the hard ceiling for Foothills Shelter A, and that waitlist overflow should automatically activate when full (default: waitlist on).
3. **Waiver Legal Cadence:** Confirm whether Colorado nonprofit legal guidance permits an annual waiver or strictly requires an affirmative liability waiver on every individual walk RSVP (default: waiver per RSVP).
