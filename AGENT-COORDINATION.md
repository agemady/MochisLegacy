# Agent coordination

Six agents are live in Herdr workspace `w2`. **Do not create a second wayfinder map.** The canonical map is the `wayfinder:map` issue on `agemady/MochisLegacy`.

| Pane | Tab | Model | Owns |
|---|---|---|---|
| `w2:p7` | cursor collab | Grok 4.6 | Map owner. `CONTEXT.md`, tracker docs, `supabase/schema.sql`, `src/lib/supabase.ts`, `src/lib/signup.ts` |
| `w2:p5` | cursor collab | Grok 4.6 | Research ticket: confirm Foothills Community Park Shelter A. No landing UI. |
| `w2:p6` | cursor collab | Grok 4.6 | Build unblock if GLM has not landed it; then review/integrate. No second map. No landing UI. |
| `w2:p1` | 1 | GLM 5.3 flash | `Header.tsx`, `Hero.tsx`, `Footer.tsx`, `src/index.css`, `App.tsx` composition |
| `w2:p3` | 1 | GLM 5.3 flash | Vite/rolldown Windows build only (`package.json` / lockfile / `node_modules`). Stop after `npm run build` is green. |
| `w2:p4` | 1 | GLM 5.3 flash | `Mission.tsx`, `DogSquad.tsx`, `src/data/dogs.ts`. Forms UI may call `src/lib/signup.ts`. **Do not invent dump tables.** |

## Hard rules

- System of record is `people` / `dogs` / `teams` / `events` / `attendances` plus `public_submit_signup`. Copy lives at `supabase/schema.sql` (from `mochis-legacy/schema.sql`).
- Do not create `dog_applications`, `volunteer_applications`, `donation_pledges`, or `subscribers`.
- Do not invent dog facts or superhero backstories presented as true.
- Pledges are not tax-deductible until the 501(c)(3) letter.
- Claim a ticket by assigning it before you touch files.
- Refer to tickets by name, not number.
