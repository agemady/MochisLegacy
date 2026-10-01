# Runbook for the founders

Short, plain instructions for the things you'll actually do. For deploying the site itself, see [DEPLOY.md](DEPLOY.md) — this page doesn't repeat it.

## Add the squad lineup portrait

1. Save your photo as `public/lineup.png`.
2. Shape: wide landscape, roughly 16:7 (twice as wide as it is tall, a little taller than that). Something like **1600 × 700 px or larger** works well. It stretches edge-to-edge across the page.
3. That's it — refresh the site and the dashed "coming" box is replaced by the photo.

## Add roster photos

Each dog's photo lives at `public/roster/<id>.jpg`. The ids are:

```
benny  honey  bear  juni-1  juni-2  louie  moss  buddy  jaz  mini-mochi  luna
```

(There are two dogs named Juni, so there are two files: `juni-1.jpg` and `juni-2.jpg`.)

- Photos show as 4:3 landscape cards; anything around **800 × 600 px** or larger is fine.
- Missing a photo? That card just shows a dashed "photo coming" slot. The site works either way.

## Change a dog's tier

Open `src/data/roster.ts`. Each dog has a `tier`:

- `"gaggle"` — walking with the Gaggle of Goldens
- `"candidate"` — therapy candidate
- `"therapy"` — certified therapy dog

Change the word, save, and redeploy — the badge on the card updates by itself.

## Connect the forms to Supabase

The two `VITE_SUPABASE_*` secrets go into Cloudflare Pages (both Production and Preview), then redeploy. Step-by-step: [DEPLOY.md](DEPLOY.md) → **Environment variables**.

## Read and export signups

Signups show up in the founders' tools: open your admin link (`/checkin#k=…`) → **Interest** tab. They also land in the `mochi_dog_applications`, `mochi_volunteer_applications`, `mochi_donation_pledges` and `mochi_subscribers` tables in the Supabase dashboard (Table Editor); export any of them via the ⋯ menu → **Export CSV**. Details: [supabase/README.md](../supabase/README.md).

## Run gaggle walks

Walk sign-ups, personal links and walk-day check-in: [scheduling/RUNBOOK.md](scheduling/RUNBOOK.md).

## Demo mode (when the secrets are missing)

Without the two secrets, form submissions are **not saved anywhere** — a production deploy without them collects no signups. If you're ever unsure whether a submission was saved, check the tables in the Supabase dashboard — the table is the truth.
