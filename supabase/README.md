# Supabase — Mochi's Legacy

Our little database for the landing page. Four tables (`dog_applications`, `volunteer_applications`, `donation_pledges`, `subscribers`) collect the three signups plus the newsletter. Nobody can read them directly from the site — forms go through four submit functions that check their inputs and keep spam junk out.

## Setting it up (one time, ~10 minutes)

1. **Create the project.** Go to [supabase.com](https://supabase.com), sign in, and create a **new dedicated project** (don't reuse a project from another site). Name it something like `mochis-legacy`. Pick a region near you and save the database password somewhere safe.
2. **Create the tables.** In the project dashboard, open **SQL Editor** → **New query**, paste in the entire contents of `supabase/schema.sql`, and hit **Run**. It's idempotent — if it ever needs to be run again, it just updates what's there instead of erroring on existing tables.
3. **Verify it.** Open a **new** SQL Editor query, paste in `supabase/verify.sql`, and **Run**. It checks that strangers can't peek at the tables and that all four forms actually work, then cleans up its own test rows. You should see a string of `PASS` notices and a "complete" message at the end. If anything says `FAIL`, stop and ask before touching anything.

## Where things live

- **Tables:** Dashboard → **Table Editor**. The four tables are `dog_applications`, `volunteer_applications`, `donation_pledges`, `subscribers`. Every signup and newsletter email lands here automatically.
- **Submissions:** new rows appear at the top (newest first, `created_at` column).

## Reading the data (exporting CSV)

1. Open **Table Editor** and click the table you want.
2. Click the **⋯** (three dots) menu at the top of the table.
3. Choose **Export CSV** — a spreadsheet-ready file downloads.

## Keys — which goes where (important)

Dashboard → **Project Settings** → **API** shows two keys plus the project URL:

- **`anon` (public) key + Project URL** → these go in the website's `.env` file as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. This key is designed to be public — it only allows people to *submit* forms, never read the tables.
- **`service_role` key** → **never leaves the dashboard.** It's the master key that can read and delete everything. Don't put it in the website, don't email it, don't paste it anywhere except the Supabase dashboard itself.
