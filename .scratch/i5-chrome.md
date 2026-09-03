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
