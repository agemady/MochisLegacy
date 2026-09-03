# Mochi's Legacy

Public site for **Mochi's Legacy**, a therapy dog nonprofit based in Boulder, Colorado. Our dog squad brings comfort and joy to senior living communities, schools, and libraries across Boulder.

> **Note:** Pledges are not yet tax-deductible — our federal 501(c)(3) application is in flight.

## Stack

- [Vite](https://vite.dev) + React + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [lucide-react](https://lucide.dev) (icons)
- [Supabase](https://supabase.com) (Postgres + auth; schema in [`supabase/schema.sql`](supabase/schema.sql))

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
| `VITE_EVENT_CODE` | Code for the current public event flow |

If the Supabase variables are unset, signup forms run in **demo mode**: submissions are validated and acknowledged but not persisted (see `src/lib/supabase.ts` and `src/lib/signup.ts`).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview the production build locally |

## Windows build note

Vite 8 (rolldown), lightningcss, and Tailwind v4 (oxide) load platform-specific native binaries. npm can silently skip these optional transitive dependencies ([npm/cli#4828](https://github.com/npm/cli/issues/4828)), so the Windows x64 binaries are pinned as `devDependencies` — do not remove them.

## Deployment

Target: **Cloudflare Pages** connected to `main` — build command `npm run build`, output directory `dist`. Production domain: [mochislegacy.com](https://mochislegacy.com).
