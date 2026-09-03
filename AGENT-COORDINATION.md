# Agent coordination

**Overseer: Fable (Claude) in Herdr pane `w2:p8`, tab "fable coordinator".** The overseer is the only agent that steers other panes. Rulings below come from the founder's verbatim words (gemini planning session, 2026-09-02) and are posted as comments on the canonical map, [Wayfind the Mochi's Legacy public site](https://github.com/agemady/MochisLegacy/issues/1). Do not create another map. Do not re-litigate a ruling; raise objections to the overseer.

## Rulings (founder-sourced unless marked provisional)

1. **Source of truth.** The founder's words + the handoff doc (`%TEMP%\mochis-legacy-handoff.md`) outrank the old `D:/projects/mochis-legacy` repo. The founder said that repo is the wrong repo and not to read it into context. Its non-conflicting guardrails still hold: community-first, no hospital/hospice/clinical copy, cancer is origin story only, therapy dogs are not service dogs, pledges are not tax-deductible until the 501(c)(3) letter.
2. **Scope.** Landing page = mission intro + kickoff event + dog squad + 3 signups (dog owner, volunteer, pledge/donation) + newsletter. Scheduling/ops app is a separate later stage. Nothing else ships now.
3. **Kickoff event.** Print **October 2 · Foothills Community Park, Shelter A** (time TBA). Source: the founder's own planning doc ("Flyer for October 2nd", "[Ed] Book Park Shelter: Foothills Community Park - A"). It is not "unverified".
4. **Visual language.** Founder decision: a **superhero-esque lineup** of the kickoff dogs, art made manually in Photoshop. Squad section = superhero card framing with placeholder art slots. Call names only: Benny, Honey, Bear, Juni, Juni (two dogs), Louie, Moss, Buddy, Jaz, Mini Mochi, Luna. **No invented aliases, powers, or backstories.** Rest of the page stays simple and warm (amber/stone seeded in `src/index.css`); no wall-to-wall comic chrome.
5. **Data model (PROVISIONAL, overseer; founder may reverse).** New dedicated Supabase project. Stage 1 schema = four purpose-built tables `dog_applications`, `volunteer_applications`, `donation_pledges`, `subscribers`, RLS enabled, **zero anon table grants**, one `SECURITY DEFINER` RPC per form with anon `EXECUTE` only (same security pattern as the old schema, not its ops model). The ported ops schema (`people/dogs/teams/events/attendances`) is Stage 2 and leaves this repo. Rationale: founder asked for "simple" storage and landing-only scope.
6. **Stack.** Vite + React + TS + Tailwind v4 + lucide + supabase-js. Build is green (native bindings are devDependencies). Host later: Cloudflare Pages, `mochislegacy.com`.

## Ownership (one writer per path)

| Pane | Model | Owns |
|---|---|---|
| `w2:p1` | GLM 5.3 flash | `src/App.tsx` composition, `src/components/Header.tsx`, `Hero.tsx` (event banner), `Footer.tsx`, `src/index.css` |
| `w2:p3` | GLM 5.3 flash | `README.md`, `.env.example`, `index.html` meta/OG; then **build sentinel**: after each new commit run `npm run build` + `npm run lint`, write status to `.scratch/build-status.md` |
| `w2:p4` | GLM 5.3 flash | `src/components/Mission.tsx`, `DogSquad.tsx`, `src/data/dogs.ts`; then `src/components/forms/` (SignupTabs: dog owner / volunteer / pledge; `Newsletter.tsx`) coded against `src/lib/signup.ts` |
| `w2:p5` | Grok 4.6 | Map driver (tracker hygiene only, no source files); `docs/DEPLOY.md`; then idle |
| `w2:p6` | Grok 4.6 | Integration reviewer: correctness + founder-safety of landed commits, findings to `.scratch/p6-review.md`; no source files, no ticket ops, no steering other panes |
| `w2:p7` | Grok 4.6 | `supabase/schema.sql` (Stage 1 schema per ruling 5), `src/lib/supabase.ts`, `src/lib/signup.ts` (typed `submitDogSignup` / `submitVolunteer` / `submitPledge` / `subscribe`, demo-mode fallback when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing). Publish the `signup.ts` interface first |
| `w2:p8` | Fable | Overseer. Pushes to `origin/main`. Steers panes. Posts rulings on the map |

## Hard rules

- One shared working copy, `main`. Commit **only your own paths** (`git add <file>...`), never `git add -A` / `git commit -a`. Never `push`, `checkout`, `reset`, `stash`, or `rebase`.
- `npm run build` must be green before you commit.
- Do not touch `package.json` / lockfile (build is done).
- Claim a ticket by assigning it before touching files; refer to tickets by name.
- Only the overseer steers other panes. Objections go to the overseer, not to other agents.
