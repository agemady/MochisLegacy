# Agent coordination

**Overseer: Fable (Claude) in Herdr pane `w2:p8`, tab "fable coordinator".** The overseer is the only agent that steers other panes. Rulings below come from the founder's verbatim words (gemini planning session, 2026-09-02) and are posted as comments on the canonical map, [Wayfind the Mochi's Legacy public site](https://github.com/agemady/MochisLegacy/issues/1). Do not create another map. Do not re-litigate a ruling; raise objections to the overseer.

## Rulings (founder-sourced unless marked provisional)

1. **Source of truth.** The founder's words + the handoff doc (`%TEMP%\mochis-legacy-handoff.md`) outrank the old `D:/projects/mochis-legacy` repo. The founder said that repo is the wrong repo and not to read it into context. Its non-conflicting guardrails still hold: community-first, no hospital/hospice/clinical copy, cancer is origin story only, therapy dogs are not service dogs, pledges are not tax-deductible until the 501(c)(3) letter.
2. **Scope.** Landing page = mission intro + kickoff event + dog squad + 3 signups (dog owner, volunteer, pledge/donation) + newsletter. Scheduling/ops app is a separate later stage. Nothing else ships now.
3. **Kickoff event.** Print **October 2 · Foothills Community Park, Shelter A** (time TBA). Source: the founder's own planning doc ("Flyer for October 2nd", "[Ed] Book Park Shelter: Foothills Community Park - A"). It is not "unverified".
4. **Visual language.** Founder decision: a **superhero-esque lineup** of the kickoff dogs, art made manually in Photoshop. Squad section = superhero card framing with placeholder art slots. Call names only: Benny, Honey, Bear, Juni, Juni (two dogs), Louie, Moss, Buddy, Jaz, Mini Mochi, Luna. **No invented aliases, powers, or backstories.** Rest of the page stays simple and warm (amber/stone seeded in `src/index.css`); no wall-to-wall comic chrome.
5. **Data model (PROVISIONAL, overseer; founder may reverse).** New dedicated Supabase project. Stage 1 schema = four purpose-built tables `dog_applications`, `volunteer_applications`, `donation_pledges`, `subscribers`, RLS enabled, **zero anon table grants**, one `SECURITY DEFINER` RPC per form with anon `EXECUTE` only (same security pattern as the old schema, not its ops model). The ported ops schema (`people/dogs/teams/events/attendances`) is Stage 2 and leaves this repo. Rationale: founder asked for "simple" storage and landing-only scope.
6. **Stack.** Vite + React + TS + Tailwind v4 + lucide + supabase-js. Build is green (native bindings are devDependencies). Host later: Cloudflare Pages, `mochislegacy.com`.
7. **Simplify (founder, 2026-09-03; supersedes the section list in ruling 2 and the card grid in ruling 4).** This is a landing page, not a website. One screen, top to bottom: name + one-sentence mission; the kickoff line (ruling 3); a **full-width placeholder for the hero lineup photo** (one Photoshop image of the whole squad, not eleven cards; renders `/lineup.png` when the founder drops it into `public/`, else a dashed slot saying the lineup portrait is coming); **three big buttons**, one per client type (I have a dog / I want to volunteer / I want to support), each opening that form in a modal; a one-field newsletter line; a one-line footer (in memory of Mochi; not yet a 501(c)(3), pledges not tax-deductible). **Removed:** the Mission section, the Track A/B cards, the eleven-card DogSquad grid, the tabbed forms section, header nav links. Form bodies and `src/lib/signup.ts` are reused unchanged.

8. **Copy and fields (overseer, adopted from `.scratch/review-design.md`, 2026-09-03).** Hero: H1 "Mochi's Legacy"; mission "A Boulder-area crew of volunteer dogs and handlers sharing comfort and joy, one visit at a time."; kickoff "October 2 · Foothills Community Park, Shelter A" (no time); no memorial eyebrow, no paw divider, no glow; date and photo above the fold at 390px. Buttons "I have a dog" (solid) / "I want to volunteer" / "I want to support" (outline). Modal titles "Join with your dog" / "Lend a hand" / "Back the mission". Fields: dog = owner name, email, dog name, optional notes; volunteer = name, email, optional "how would you like to help"; pledge = name, email, optional amount, one-time/monthly. Newsletter = one inline row. Footer "In memory of Mochi · Not yet a 501(c)(3), so pledges are not tax-deductible." Placeholder text "The full squad portrait goes here."

9. **Feel-good pass (founder, 2026-09-03): "simple but stylistic, immersive, and fun to visit; informative but also makes you feel good."** Ruling 7's structure stands (one screen, lineup slot, three buttons, modal forms). Ruling 8's clutter cuts stand, its austerity does not. Bring back warmth and character: a soft mood layer (subtle glow or gradient, one paw motif, generous display type), a two-sentence Mochi story under the mission (origin-story warmth, cancer stays a mention at most), a warm kickoff invitation (date, place, "bring your dog"), the lineup slot framed like a hero photo with a caption, a one-line "what we do" that informs, and gentle motion (entrance fade, button hover lift, all behind `prefers-reduced-motion`). Fun beats minimal; clutter still loses. Proposals come from the design reviewer, the overseer picks, chrome (p9) and forms (p4) implement.

## Ownership (one writer per path)

| Pane | Model | Owns |
|---|---|---|
| `w2:p1` | GLM 5.3 flash | **Roster** (unlisted page): `src/data/roster.ts`, `src/components/Roster.tsx`, the `/roster` pathname switch in `src/App.tsx`, `public/_redirects` |
| `w2:p3` | GLM 5.3 flash | `README.md`, `.env.example`, `index.html`, `.github/workflows/ci.yml`; **build sentinel**: after each new commit run `npm run build` + `npm run lint`, write status to `.scratch/build-status.md` |
| `w2:p4` | GLM 5.3 flash | `src/components/forms/SignupModal.tsx` (exports `type SignupKind = 'dog' \| 'volunteer' \| 'pledge'`; default export `SignupModal({ kind, onClose }: { kind: SignupKind \| null; onClose: () => void })`; renders nothing when `kind` is null; one form per kind reusing the existing dog/volunteer/pledge bodies and `src/lib/signup.ts`), `Newsletter.tsx` (single email field). Commits `SignupModal.tsx` first; after p1's App no longer imports them, deletes `Mission.tsx`, `DogSquad.tsx`, `src/data/dogs.ts`, `forms/SignupTabs.tsx` |
| `w2:p5` | Gemini 3.8 flash | **Reviewer cut-review**: no source edits; output `.scratch/review-cut.md` (what to delete, file:line, lines saved) |
| `w2:p6` | Muse Spark 1.3 | **Reviewer design-copy**: no source edits; output `.scratch/review-design.md` (critique + copy options) |
| `w2:p7` | Grok 4.6 fast | **lib-trim**: `src/lib/signup.ts`, `src/lib/supabase.ts`, `supabase/schema.sql`. Exported names/types stay stable (SignupModal imports them) |
| `w2:p9` | Grok 4.6 fast | **chrome**: `src/components/Header.tsx`, `Hero.tsx`, `LineupPlaceholder.tsx`, `Footer.tsx`, `src/index.css`; mobile pass on those files |
| `w2:pA` | Gemini 3.8 flash | **Reviewer tech-debt**: no source edits; output `.scratch/review-arch.md` (what hurts in three months, smallest fix, now vs defer) |
| `w2:p8` | Fable | Overseer. Pushes to `origin/main`. Steers panes. Posts rulings on the map |
| `w2:pB` | Gemini 3.8 flash | **Designer scheduling** (worktree, branch `scheduling`): `docs/scheduling/DESIGN.md` only |
| `w2:pD` | GLM 5.3 flash | **unit-tests**: `src/lib/signup.test.ts`; one `package.json` change (vitest + `test` script), committed first |
| `w2:pE` | GLM 5.3 flash | **supabase-ops**: `supabase/README.md`, `supabase/verify.sql` |
| `w2:pF` | GLM 5.3 flash | **e2e**: `playwright.config.ts`, `e2e/`; one `package.json` change (@playwright/test + `e2e` script) after pD's commit |
| `w2:pG` | Grok 4.6 fast | **welfare** (worktree, branch `scheduling`): `src/lib/welfare.ts`, `src/lib/welfare.test.ts` |
| `w2:pH` | Grok 4.6 fast | **auth** (worktree, branch `scheduling`): `src/lib/auth.ts`, `src/components/SignIn.tsx` |

## Scheduling track (branch `scheduling`, worktree `D:/projects/MochisLegacy-scheduling`)

Not urgent, but key once walks and events start. Lives on its own branch in its own worktree so landing work on `main` is never disturbed. Phase 1 is design only: `docs/scheduling/DESIGN.md` (domain model, MVP scope for Gaggle of Goldens walks, data additions, mobile-first UI sketch, auth question, what not to build). No source code on that branch until the overseer approves the design. Agents on that track work only inside the worktree directory.

## Hard rules

- One shared working copy, `main`. Commit **only your own paths** (`git add <file>...`), never `git add -A` / `git commit -a`. Never `push`, `checkout`, `reset`, `stash`, or `rebase`.
- `npm run build` must be green before you commit.
- Do not touch `package.json` / lockfile except the two granted one-shot changes (pD vitest, then pF playwright). p3 adds the CI steps afterwards.
- Claim a ticket by assigning it before touching files; refer to tickets by name.
- Only the overseer steers other panes. Objections go to the overseer, not to other agents.
- Reviewers never edit source. Their findings go to `.scratch/review-*.md`; the overseer adjudicates and hands trims to the file owner. Less code wins: a finding that deletes lines outranks one that adds them.
- Sessions are disposable: spawned per task, exited when done. Builders are Grok 4.6 fast (high) or GLM 5.3 flash; reviewers are Gemini 3.8 flash or Muse Spark 1.3; large judgment calls are the overseer's.
