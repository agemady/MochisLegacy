# Runbook: scheduling (walks, RSVPs, check-in)

Short, plain instructions for the scheduling feature. For everything else (site basics, roster photos, deploying the site), see the [main runbook](../RUNBOOK.md) and [DEPLOY.md](../DEPLOY.md) — this page doesn't repeat them.

## One-time setup in Supabase

Open the Supabase SQL editor (as postgres) and run these in order:

1. **`supabase/schedule.sql`** — creates the tables (`people`, `dogs`, `walks`, `walk_rsvps`), row-level security, and the magic-link linking trigger.
2. **`supabase/schedule-verify.sql`** — runs a battery of checks (who can see what, email linking, capacity limits) and cleans up after itself. It should finish without errors.
3. **`supabase/schedule-seed.sql`** — adds the founders, the kickoff dogs, and the October 2 walk. **Before running it, replace every `@example.com` email with the real person's email.** Emails are how owners get linked to their accounts (see below), so placeholders won't work.

## How owners get connected to their dogs

When an owner signs in with a magic link, the system matches their login email to a row in `people` by that same email. If the email in `people` matches, they instantly see their dogs and can RSVP at `/schedule`. If nothing matches, they see no dogs — check the email spelling in the `people` table.

## Make someone an admin

1. Open the Supabase Studio → Table Editor → `people`.
2. Find the person's row and set `is_admin` to `true`.
3. That's it. They can now open `/checkin` on walk day. (The two founders are seeded as admins already.)

## Add a dog for an owner

Owners are vetted outside the app, so founders add the dog manually:

1. Supabase Studio → Table Editor → `dogs`.
2. Insert a row: pick the owner under `owner_id`, add the dog's call `name`, set `tier` (`gaggle`, `candidate`, or `therapy`), and `status` = `active`.

The dog appears on the owner's `/schedule` page and in the public roster right away.

## Walk day (`/checkin`)

Open **`/checkin` on a phone** (any admin's login works). For each walk you get:

- **Counters at the top** — how many dogs are checked in, how many opted out, against the walk cap (e.g. 11/15 checked in, 1 opted out).
- **Alphabetical roster** — each dog shows the owner's name, a tappable phone link, and whether the waiver was signed at RSVP time.
- **Two buttons per dog** — green **Check In** when they arrive; red **Opt Out** if the owner cancels or the dog seems off. Opting out frees a spot for the waitlist automatically.

**If someone's dog is not on the list:** the dog hasn't been vetted or added yet. Be kind and honest — they're welcome to come spectate today, and they can apply online at the landing page. Do not add dogs at the park.

## After the walk

Nothing to do. The check-ins and opt-outs are already saved; the rows stay as your record of who came. No cleanup, no exporting.
