# i5 — chrome trim (ruling 8)

Pane `w2:p9`. Paths: `src/components/Hero.tsx`, `Footer.tsx`, `LineupPlaceholder.tsx`. Header and `src/index.css` unchanged (no glow/paw lived there).

## Ruling 8 folded

| Item | What landed |
|---|---|
| Memorial eyebrow | Removed from Hero. Memory lives in the Footer line. |
| H1 | `Mochi's Legacy` |
| Mission | Exact: `A Boulder-area crew of volunteer dogs and handlers sharing comfort and joy, one visit at a time.` |
| Kickoff | Exact: `October 2 · Foothills Community Park, Shelter A`. No `time TBA`, no calendar icon. |
| Paw divider | Deleted. |
| Radial glow | Deleted (`overflow-hidden` + `radial-gradient` wrapper gone). |
| Order | name → mission → kickoff → `LineupPlaceholder` → three buttons. |
| Buttons | `I have a dog` solid amber; `I want to volunteer` / `I want to support` outline. All three `h-12` with `border-2` so heights match. |
| Placeholder | Fallback: `The full squad portrait goes here.` |
| Footer | One line `In memory of Mochi · Not yet a 501(c)(3), so pledges are not tax-deductible.` then the Newsletter slot (p4 owns the inline row). |

Not ours: modal titles/fields (p4), newsletter internals (p4).

## 390px fold

Tall phone ≈ iPhone 12–15 (390×844). Compact stack so photo top *and* the first button clear the fold without scroll:

- sticky Header `h-16` = 64px
- Hero `py-6` (24px top; `sm:py-16` on larger)
- H1 `text-4xl leading-tight` ≈ 44px
- mission `mt-2 text-base leading-snug` ≈ 2 lines / 48px
- kickoff `mt-3 text-sm` ≈ 32px
- photo `mt-4` + `aspect-[16/7]` ≈ 16 + 157px at 358px content width
- first button `mt-4` + `h-12` = 64px

≈ 449px to the bottom of the first button. Fits 844 with room; still inside a ~664 Safari-chrome viewport.

## Build

`npm run build` green after this trim. Commit is explicit-path only (no `git add -A`).

---

# Ruling 9 — feel-good chrome (visual only; copy waits on design review)

Pane `w2:p9`. Paths: `Hero.tsx`, `LineupPlaceholder.tsx`, `src/index.css`. Header/Footer untouched. No new deps. Ruling 8 copy and three-button structure kept.

| Sure thing | What landed |
|---|---|
| Mood layer | Static top-ellipse amber radial (`rgba(251,191,36,0.16)` → transparent). No animation, no blend modes. |
| One paw | Single `-rotate-[18deg]` print above the H1 (not a trail). Empty lineup slot still uses one paw as the missing-art mark. |
| Display H1 | `text-5xl / sm:text-6xl / md:text-7xl`, leading 1.05. |
| Hero photo frame | `rounded-3xl` + warm soft shadow + amber ring. Caption under the frame (ruling-8 sentence until new copy). Inner dashed text removed so it isn't doubled. |
| Motion | `animate-fade-up` on the hero stack; button `hover:-translate-y-0.5` + shadow. Both behind `motion-safe:`. `prefers-reduced-motion` also kills `html` smooth-scroll. |
| Buttons | Same labels; Dog / HandHeart / HeartHandshake; primary solid amber; hover lift. |

Held for copy review: two-sentence Mochi story, warm kickoff invite, “what we do” line.

Fold: extra paw (~24px) + larger H1 (~12–24px) + caption (~24px) ≈ 510px to first-button bottom at 390 — still inside a tall-phone viewport.

---

# Ruling 9 — copy + rest of feel-good (Part 3)

Pane `w2:p9`. Paths: `Hero.tsx`, `LineupPlaceholder.tsx`, `Footer.tsx`, `src/index.css`. Buttons unchanged (solid + two outline). No new deps. p3 owns the Fraunces `<link>` in `index.html`; `--font-display` falls back to Georgia.

| Item | What landed |
|---|---|
| H1 face | `font-display` → `"Fraunces", Georgia, serif`. |
| Page wash | Static top-down amber→cream on `html`; `#root > .min-h-screen` transparent so p1's `bg-amber-50` doesn't hide it. Footer `bg-transparent`. |
| Paw | One `h-56` watermark at `opacity-5` behind the mission/story block. Glyph above the H1 removed. |
| Story | Under the mission, she/her: `One very good golden retriever showed us how much a visit from a dog can mean. Mochi's Legacy keeps her at work, through every wagging team that follows.` |
| What we do | `We organize volunteer handler-and-dog teams to visit senior living communities, schools, and libraries.` |
| Kickoff | Invitation block; `October 2` in `font-semibold`. |
| Caption | `The kickoff squad — come meet them October 2.` |
| Alt | `The Mochi's Legacy kickoff squad portrait.` (no superhero wording). |
| Empty-slot paw | `group-hover:rotate-12` behind `motion-safe:`. |
