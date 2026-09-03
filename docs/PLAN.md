# Plan board

Living plan, partitioned into small slices. One slice = one owner = disjoint paths. Read `AGENT-COORDINATION.md` for rulings and hard rules; this file says who does what next.

**Pull rule.** When your slice lands, take the top **Ready** slice in your lane, append one line to `.scratch/claims.md` (`<pane> claims <id> <UTC time>`), and start. The overseer reconciles the board; if two panes claim the same id, the earlier line wins and the other takes the next one. Never edit this file yourself.

**Message board.** `D:/projects/MochisLegacy/.scratch/board.md` (absolute path, shared by both worktrees, append-only). Post interface contracts, heads-ups on shared types, done notices with hashes, and lane-to-lane questions (`@p7 ...`). Read its tail when you start a slice and before you commit. Only the overseer assigns work; disagreements get one post tagged `@p8`.

**Lanes.** `landing` = main branch, `D:/projects/MochisLegacy`. `sched` = branch `scheduling`, worktree `D:/projects/MochisLegacy-scheduling`. Reviewers do not claim slices.

## In progress

| Id | Lane | Pane | Slice |
|---|---|---|---|
| L-copy | landing | p9 | Ruling 9 copy + feel-good visuals (Hero, LineupPlaceholder, index.css) |
| L-forms | landing | p4 | Success state, maxLength, submit verbs, pledge small print, newsletter copy |
| L-lib | landing | p7 | PROD offline message, error sanitizing, schema drop/status/indexes |
| L-build | landing | p3 | Bindings to optionalDependencies, delete VITE_EVENT_CODE, Fraunces link |
| L-roster | landing | p1 | Roster layout + back link, hash deep links |
| L-e2e | landing | pF | landing.spec.ts, screenshots.spec.ts, `npm run shots` |

## Ready (claim in order)

| Id | Lane | Paths (yours alone) | Slice | Size |
|---|---|---|---|---|
| S-time | sched | `src/lib/time.ts`, `src/lib/time.test.ts` | Mountain-time helpers: `formatWalkWindow(startISO, endISO)` → "Thu Oct 2 · 9:00–10:00 AM", `isUpcoming`, `startOfWeekMonday`; pure, tested | S |
| S-rsvp | sched | `src/lib/rsvp.ts`, `src/lib/rsvp.test.ts` | Capacity + waitlist as pure functions: `placeRsvp(walk{cap}, rsvps[], dogId)` → confirmed / waitlisted with position; `promoteFromWaitlist`; cancellation re-promotes; tested | S |
| S-tiers | sched | `src/lib/tiers.ts`, `src/lib/tiers.test.ts` | Roster tier progression rules as pure functions with a rules object: gaggle → candidate needs ≥ N walks attended, age ≥ 12 months, no bite history; candidate → therapy needs a registry certification on file; returns `{ eligible, missing[] }`; tested | S |
| S-checkin | sched | `src/lib/checkin.ts`, `src/lib/checkin.test.ts` | Day-of state machine, pure: rsvp'd → checked_in → checked_out / no_show / opted_out; check-out accrues an `Engagement` for `welfare.ts`; illegal transitions return errors; tested | S |
| L-og | landing | `scripts/og.html`, `e2e/og.spec.ts`, `public/og.png` | Social card 1200×630 rendered from a tiny HTML page by Playwright into `public/og.png`; `npm run og`; p3 then adds `og:image` | S |
| L-favicon | landing | `public/favicon.svg` | Replace the Vite default with a simple amber paw on cream; keep it a single SVG | XS |
| L-jsonld | landing | `index.html` (p3 lane; claim only if p3 is idle) | JSON-LD `Organization` + `Event` (October 2, Foothills Community Park Shelter A) in the head | XS |
| L-lazy | landing | `src/lib/supabase.ts`, `src/lib/signup.ts` (p7 lane) | Lazy-load `@supabase/supabase-js` on first submit via dynamic import so the landing bundle drops ~100 kB; tests stay green | S |

## Blocked (waiting on a decision)

| Id | Lane | Waiting on | Slice |
|---|---|---|---|
| S-schema | sched | overseer ruling on `.scratch/review-scheduling-design.md` | SQL delta for walks, rsvps, check-ins, roster tiers |
| S-shell | sched | same ruling (same app vs separate) | `/schedule` route shell, auth gate, SignIn wiring |
| S-walks | sched | S-schema | Founder "publish a walk" screen |
| S-rsvp-ui | sched | S-schema, S-rsvp | Owner RSVP bottom sheet |
| S-checkin-ui | sched | S-schema, S-checkin | Founder day-of check-in screen |
| L-supabase | landing | founder creates the Supabase project | Apply `schema.sql`, run `verify.sql`, set env in Cloudflare |
| L-deploy | landing | founder's Cloudflare account | First Pages deploy of `mochislegacy.com` |
| L-email | landing | founder decision | Confirmation email on signup (edge function + provider) |

## Done

L-scaffold, L-chrome, L-modal, L-delete-sections, L-roster-page, L-ci, L-runbook, L-vitest, L-unit-tests, L-supabase-docs, L-playwright-dep, S-welfare, S-auth, S-design-draft.
