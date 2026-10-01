# Plan board

## Session 2 — 2026-10-01 (gaggle walks ready to run)

**State.** Branch `claude/cool-bardeen-7afihw` (off `scheduling`). Ruling 20: the data lives in the founder's existing Supabase project as `mochi_*` tables and functions — **applied and verified live** (every probe in `verify.sql` and `schedule-verify.sql` passed on the project). No Supabase Auth: owners and founders use personal links.

**Shipped on the branch.**
- Fixed the session-1 bugs: owner opt-out/update failed with "infinite recursion detected in policy" (RLS policies replaced by checked functions); `schedule-verify.sql` could not run (temp-table grant) and now rolls back; `/checkin` was a placeholder; `/schedule` counted only the viewer's own RSVPs and showed waitlisted owners "You're walking!".
- `/schedule`: public calendar + gaggle interest card; personal-link owner view (multi-walk, multi-dog, waitlist, opt-out, promotion notice).
- `/checkin` (alias `/admin`): Walk day, Gaggle (owners, dogs, copy/text/email links, new link), Interest (approve dog applications into the roster), Walks (create/edit/publish).
- Landing: judge's top five + ruling-19 moments (sky, ticket with countdown and walk sign-ups link, two Juni chips, modal success headlines, footer).
- Data layer `src/lib/{rpc,schedule,admin,demo,key}.ts`; the dev server runs an in-memory demo world (`demo.ts`) with the same rules. Dead magic-link code removed.

**Before the first walk (founder).** Deploy (Cloudflare Pages + the two env vars), open the admin link, set the kickoff time and Publish, add owners/dogs and text their links. Still open: waiver text, founder's note, lineup portrait.

## Stopping point — 2026-09-03 ~08:00Z (session 1 close)

**State.** `main` and `scheduling` pushed to `agemady/MochisLegacy`. Both trees green (`npm run check` on main; lint + 45 tests + build on scheduling). Live previews stay up on http://127.0.0.1:5173 (main) and http://127.0.0.1:5174 (scheduling). Judge close-out score for the landing: **7/10** (`.scratch/review-visual-landing-1.md`, "Round 2 close-out"). Nothing is deployed and no Supabase project exists yet.

**WIP commits to finish first next session** (each was green but mid-slice): `0f86097` chrome rulings 16+19 (p9), `20abb1e` modal ruling 16 (p4), `4367c54` social card (p5), `5c21e3f` `/schedule` ruling 18 (pD), `ae50c8f` schema lazy link (pG). Not started: index.html `data-sky` script (ruling 19, p3), so `?sky=day` is a no-op today.

**Read first next session.** Rulings 16–19 in `AGENT-COORDINATION.md`; the judge's top five (dot grid too loud, placeholder slot too tall, ticket orphan on 390, chips wrap at 1280, glow still a smear); `.scratch/research/SYNTHESIS.md` (ten ranked moves from the research program, plus the moodboard section); `.scratch/brainstorm-schedule-1.md` items not yet landed; the six founder questions relayed at close (walk time, waiver text, QR target and roster emails, SMTP and nudges, founder's note sentence, "promise not a payment").

**Blocked on the founder.** Supabase project + schema apply, Cloudflare Pages deploy, custom SMTP, waiver text, founder's note, the Photoshop lineup portrait.


Living plan, partitioned into small slices. One slice = one owner = disjoint paths. Read `AGENT-COORDINATION.md` for rulings and hard rules; this file says who does what next.

**Pull rule.** When your slice lands, take the top **Ready** slice in your lane, append one line to `.scratch/claims.md` (`<pane> claims <id> <UTC time>`), and start. The overseer reconciles the board; if two panes claim the same id, the earlier line wins and the other takes the next one. Never edit this file yourself.

**Message board.** `D:/projects/MochisLegacy/.scratch/board.md` (absolute path, shared by both worktrees, append-only). Post interface contracts, heads-ups on shared types, done notices with hashes, and lane-to-lane questions (`@p7 ...`). Read its tail when you start a slice and before you commit. Only the overseer assigns work; disagreements get one post tagged `@p8`.

**Live previews (Herdr tab "live", never stop these).** Landing on main: http://127.0.0.1:5173 · Scheduling branch: http://127.0.0.1:5174 · Both are Vite dev servers with hot reload, so saved edits show immediately. Nothing is pushed to GitHub yet by founder decision.

**Lanes.** `landing` = main branch, `D:/projects/MochisLegacy`. `sched` = branch `scheduling`, worktree `D:/projects/MochisLegacy-scheduling`. Reviewers do not claim slices.

## In progress (rulings 13–15 round, 08:55Z)

| Id | Lane | Pane | Slice |
|---|---|---|---|
| L-dirA-chrome | landing | p9 | Direction A hero, invitation card, chips, buttons, footer, page wash (2a545d9 landed; iterating from the judge's review) |
| L-dirA-modal | landing | p4 | Direction A dialog styling |
| L-og-dirA | landing | p5 | Social card restyled to Direction A, regenerate `public/og.png` |
| L-e2e | landing | pF | landing.spec.ts + screenshots spec (still not committed; on watch) |
| S-data-14 | sched | pH | Done be54ef6; standing by |
| S-schema-14 | sched | pG | Done f09f53f; standing by |
| S-shell | sched | p1 | Done 6abf622; now owns `PageTop.tsx` (edit pA's stub in place), signed-out `/schedule` |
| S-rsvp-ui-15 | sched | pD | Done 6356bd8; iterating from brainstorm-sched |
| S-checkin-ui-15 | sched | pE | `/checkin` to the brief |
| S-signin-copy | sched | p6 | `SignIn.tsx` to the auth-card brief |
| S-roster-restyle | sched | pA | Done bf74613 |
| S-e2e | sched | pB | `e2e/schedule.spec.ts` |
| R-judge-landing | review | pM (Fable) | scored screenshot review of Direction A → `.scratch/review-visual-landing-1.md` |
| R-brainstorm-landing | review | pN (Fable) | signature moments + final copy → `.scratch/brainstorm-landing-1.md` |
| R-brainstorm-sched | review | pP (Fable) | owner/founder journeys + refinements → `.scratch/brainstorm-schedule-1.md` |

Idle and available: p3, p7 (landing), pG, pH, pA (scheduling). Next slices come from the judge and brainstorm docs.

## Older in-progress table (superseded)

| Id | Lane | Pane | Slice |
|---|---|---|---|
| L-modal-cut | landing | p4 | Ruling 12: native `<dialog>`, hoisted submit state, uncontrolled amount; release `Newsletter.tsx` to p9 |
| L-chrome-cut | landing | p9 | Ruling 12: inline LineupPlaceholder + Newsletter, buttons from array, delete `Header.tsx`, CSS + comment cleanup; then L-og |
| L-app-cut | landing | p1 | Remove `<Header />` from App, Roster keeps its own back link; modal hash matching exact only; then S-shell |
| L-lazy | landing | p7 | Dynamic-import supabase-js on first submit (ruling 10 lib items all landed: f08825b 7aa4130 6ea4204 5a27f6a 288364e) |
| L-docs-cut | landing | p3 | Docs de-dup; vitest excludes `e2e/**`; `og` script; gitignore Playwright output; `og:image` once `public/og.png` exists |
| L-e2e | landing | pF | landing.spec.ts, screenshots.spec.ts → `.scratch/shots/` (restarted 07:45Z) |
| S-verify | sched | pG | `supabase/schedule-verify.sql` (schema landed 084ca5f); then S-roster-db |
| S-data | sched | pH | `src/lib/schedule.ts` typed data layer + in-memory demo fixtures; signatures on the board |
| S-rsvp-ui | sched | pD | `/schedule` page against `schedule.ts` (tiers landed 435e63d) |
| S-checkin-ui | sched | pE | `/checkin` page against `schedule.ts` + `checkin.ts` |
| R-schedule-sql | review | pA | RLS/security review of `schedule.sql` → `.scratch/review-schedule-sql.md` |
| R-schedule-design | review | p6 | Screen-by-screen brief for pD/pE → `.scratch/design-schedule.md` |
| S-design-cut | sched | pB | Done 939467e (DESIGN.md at 81 lines); pane retired |

## Older in-progress table (superseded)

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
| S-shell | sched | L-app-cut (p1 takes it) | Route switch tolerant of auth callbacks, `/schedule` + `/checkin` lazy routes, auth gate using `auth.ts`, SignIn wiring |
| S-rsvp-ui | sched | S-schema, S-shell | `/schedule`: walk details, capacity, RSVP with dog picker + waiver/photo checkboxes, inline "you're walking" + opt-out (uses `rsvp.ts`, `time.ts`) |
| S-checkin-ui | sched | S-schema, S-shell | `/checkin` admin list: check-in / opt-out (uses `checkin.ts`) |
| S-roster-db | sched | S-schema | `/roster` reads `dogs` instead of `roster.ts` |
| L-supabase | landing | founder creates the Supabase project | Apply `schema.sql`, run `verify.sql`, set env in Cloudflare |
| L-deploy | landing | founder's Cloudflare account | First Pages deploy of `mochislegacy.com` |
| L-email | landing | founder decision | Confirmation email on signup (edge function + provider) |

## Done

L-scaffold, L-chrome, L-modal, L-delete-sections, L-roster-page, L-ci, L-runbook, L-vitest, L-unit-tests, L-supabase-docs, L-playwright-dep, S-welfare, S-auth, S-design-draft.
