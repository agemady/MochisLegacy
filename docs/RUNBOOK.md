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

The signup forms need two secrets set in **Cloudflare Pages → your project → Settings → Environment variables** (add them to *both* Production and Preview):

| Name | Where to find it |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API → anon public key |

After adding or changing them, **redeploy** — the site only picks them up at build time, not on the fly.

## Read and export signups

Submissions land in the Supabase dashboard → **Table Editor**:

- `dog_applications` — "I have a dog" signups
- `volunteer_applications` — "I want to volunteer" signups
- `donation_pledges` — "I want to support" pledges
- `subscribers` — newsletter emails

To export: open the table, click the **⋯ (kebab) menu** at the top of the table, choose **Export to CSV**, and the file downloads.

## Demo mode (when the secrets are missing)

If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` aren't set, the forms still "work" — but they save **nothing, anywhere**, and the confirmation says "Demo mode."

That's handy for testing the site, but it means: **if you deploy without the two secrets, real signups are not collected.** If you're ever unsure whether a submission was saved, check the tables above — the table is the truth.
