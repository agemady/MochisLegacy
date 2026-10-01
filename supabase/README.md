# Supabase — Mochi's Legacy

Mochi's Legacy keeps its data in a **shared** Supabase project (it lives alongside another app's tables). To stay out of that app's way:

- every table and function is prefixed **`mochi_`**;
- nothing touches **Supabase Auth** — there are no sign-ins, no auth triggers, no email settings, no redirect URLs. (The other app enrolls every new auth user into itself, so Mochi's owners must never become auth users.)
- the website can't read or write any table directly. It only calls `mochi_*` database functions, which check their inputs and the caller's personal link.

## The tables

| Table | What's in it |
|---|---|
| `mochi_dog_applications` | "I have a dog" form from the landing page |
| `mochi_volunteer_applications` | "I want to volunteer" form |
| `mochi_donation_pledges` | "I want to support" form (pledges, not payments; not tax-deductible yet) |
| `mochi_subscribers` | newsletter emails |
| `mochi_people` | owners and founders, each with a private `access_token` for their personal link; `is_admin` = founder tools |
| `mochi_dogs` | roster dogs (owner, tier, active/retired) |
| `mochi_walks` | gaggle walks (time, meeting spot, cap, draft/published/done, notes owners see) |
| `mochi_walk_rsvps` | one row per dog per walk: waiver, photo consent, check-in, opt-out |

Day to day you don't need the tables: the founders' tools at `/checkin` cover walks, check-in, owners, links and interest. Studio's Table Editor is the fallback (and **⋯ → Export CSV** for spreadsheets).

## Setting it up (one time)

Open **SQL Editor → New query** in the project, and run each file in order (paste the whole file, **Run**):

1. **`supabase/schema.sql`** — the four interest tables + their submit functions.
2. **`supabase/schedule.sql`** — people, dogs, walks, RSVPs + the scheduling functions.
3. **`supabase/verify.sql`** and **`supabase/schedule-verify.sql`** — checks that strangers (and the other app's signed-in users) can't read anything, and that every rule works: waiver required, cap and waitlist, auto-promotion, one walk per dog per day, admin-only tools. Each runs inside a transaction that **rolls back**, so it leaves nothing behind. You want a string of `PASS` notices and a "complete" line; any `FAIL` stops the script — stop and ask.
4. **`supabase/schedule-seed.sql`** — your admin row and the kickoff walk (as a draft). It prints your personal admin link path.

All four setup files are safe to re-run.

## Keys — which goes where (important)

Dashboard → **Project Settings → API**:

- **Project URL + `anon` public key** → the website's `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Cloudflare Pages env vars, and `.env` locally). The anon key is public by design; for Mochi's tables it can only call the `mochi_*` functions.
- **`service_role` key** → never leaves the dashboard. Never in the site, never in a message.

## Personal links

Each person's link is `https://<site>/schedule#k=<access_token>` (founders: `/checkin#k=…`). Whoever holds a link acts as that person, so:

- send it only to that person (the Gaggle tab's **Text link** / **Email link** buttons do this);
- if a link leaks or a phone is lost, press **New link** in the Gaggle tab — the old one stops working at once.

The part after `#` never reaches a server or a log, and the site moves it out of the address bar after the first visit.
