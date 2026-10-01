# Mochi's Legacy

Landing page (single screen) for **Mochi's Legacy**, a therapy dog nonprofit based in Boulder, Colorado. Our dog squad brings comfort and joy to senior living communities, schools, and libraries across Boulder.

**What's on the page, top to bottom:** name + one-sentence mission; the kickoff line (**October 2 · Foothills Community Park, Shelter A**, time TBA); a full-width slot for the hero lineup photo — renders `/lineup.png` as soon as that image is dropped into `public/`, and until then shows a dashed "lineup portrait is coming" placeholder; **three big buttons** — *I have a dog*, *I want to volunteer*, *I want to support* — each opening its signup form in a modal; a one-field newsletter signup; a one-line footer (in memory of Mochi; not yet a 501(c)(3) — pledges are not tax-deductible).

## Stack

- [Vite](https://vite.dev) + React + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [lucide-react](https://lucide.dev) (icons)
- [Supabase](https://supabase.com) (Postgres, `mochi_`-prefixed tables in a shared project, reached only through `mochi_*` functions — setup: [`supabase/README.md`](supabase/README.md))

## Quickstart

```sh
npm install
cp .env.example .env   # then fill in your Supabase project values
npm run dev
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL (Dashboard → Project Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

If the Supabase variables are unset, the dev server runs in **demo mode**: signup forms are acknowledged but not saved, and `/schedule` + `/checkin` run against an in-memory demo world (`src/lib/demo.ts`). A production build without them reports sign-ups as offline instead of faking success.

## Pages

| Path | Who | What |
|---|---|---|
| `/` | everyone | landing page; `/#dog`, `/#volunteer`, `/#pledge` open a form |
| `/schedule` | everyone; owners via their personal link `/schedule#k=…` | gaggle walk calendar; owners sign their dogs up, join the waitlist, opt out |
| `/checkin` (alias `/admin`) | founders via their admin link `/checkin#k=…` | walk-day check-in, roster + personal links, interest inbox, walks |
| `/roster` | unlisted | the kickoff dogs |

Demo links (dev server only): owner `/schedule#k=00000000000000000000000000000001`, admin `/checkin#k=0000000000000000000000000000000a`. Founders' how-to: [`docs/scheduling/RUNBOOK.md`](docs/scheduling/RUNBOOK.md).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run check` | Lint + unit tests + production build in one pass (what CI runs) |
| `npm run lint` | Run oxlint |
| `npm test` | Unit tests (vitest) |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run e2e` | Playwright end-to-end tests |
| `npm run og` | Render the 1200×630 social card into `public/og.png` |
| `npm run shots` | Capture e2e screenshots |
| `npm run preview` | Preview the production build locally |

## Windows build note

Vite 8 (rolldown), lightningcss, and Tailwind v4 (oxide) need platform-specific native binaries; the Windows x64 ones are declared as `optionalDependencies` in `package.json` so Linux builders skip them ([npm/cli#4828](https://github.com/npm/cli/issues/4828)). Do not remove them.

## Deployment

Cloudflare Pages → [mochislegacy.com](https://mochislegacy.com). Setup, env vars, and domain: [docs/DEPLOY.md](docs/DEPLOY.md).
