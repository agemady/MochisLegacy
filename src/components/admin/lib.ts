// Pure helpers for the founders' tools (/checkin). No React here so they can
// be unit-tested and shared by every tab.
import type { Interest, MarkAction, RosterRow } from '../../lib/admin'
import type { Walk } from '../../lib/schedule'
import { denverDay } from '../../lib/time'

// ---------------------------------------------------------------------------
// Class strings (Direction A tokens from src/index.css)
// ---------------------------------------------------------------------------

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-honey/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ground'

const TONE = {
  primary:
    'bg-pine font-bold text-white shadow-[0_8px_18px_-8px_rgba(44,94,67,0.65)] hover:bg-[#234c36] active:bg-[#1c3e2c]',
  secondary: 'border-2 border-sandstone bg-white font-semibold text-espresso hover:border-honey hover:bg-cream-soft',
  pine: 'border-2 border-pine bg-white font-bold text-pine hover:bg-[#eef5f0]',
  danger: 'border-2 border-[#c23a2b] bg-white font-bold text-[#8f2a1d] hover:bg-[#fbe4df]',
} as const

const SIZE = {
  xs: 'min-h-11 px-3 text-[13px]',
  sm: 'min-h-11 px-4 text-sm',
  md: 'min-h-12 px-5 text-base',
  lg: 'min-h-14 px-6 text-lg',
} as const

/** Pill buttons. Compose tone + size instead of overriding classes (Tailwind v4 ordering isn't class order). */
export const btn = (tone: keyof typeof TONE = 'primary', size: keyof typeof SIZE = 'md'): string =>
  `inline-flex items-center justify-center gap-2 rounded-full disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition-colors ${focusRing} ${TONE[tone]} ${SIZE[size]}`

export const btnPrimary = btn('primary', 'md')
export const btnSecondary = btn('secondary', 'sm')

/** Quiet underlined text button (44px tall target). */
export const quiet = (size: 'sm' | 'xs' = 'sm'): string =>
  `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-umber underline decoration-sandstone decoration-2 underline-offset-4 hover:text-espresso hover:decoration-honey disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${
    size === 'sm' ? 'text-sm font-semibold' : 'text-[13px] font-medium'
  }`

export const btnQuiet = quiet('sm')

/** Icon-only close button. */
export const btnClose = `inline-flex h-11 w-11 items-center justify-center rounded-full text-umber hover:bg-butter hover:text-espresso ${focusRing}`

const inputBase =
  'block min-h-12 w-full rounded-xl border-2 bg-white text-base text-espresso placeholder:text-umber/55 focus:outline-none focus:ring-4 disabled:opacity-60'

export const inputCls = `${inputBase} border-sandstone px-3.5 focus:border-honey focus:ring-honey/25`

/** Same field, flagged invalid. */
export const inputBad = `${inputBase} border-[#c23a2b] px-3.5 focus:border-[#c23a2b] focus:ring-[#c23a2b]/20`

/** Search field: room for a leading icon. */
export const inputSearch = `${inputBase} border-sandstone pr-3.5 pl-11 focus:border-honey focus:ring-honey/25`

export const labelCls = 'mb-1.5 block text-sm font-semibold text-espresso'

export const cardCls =
  'rounded-2xl bg-white/90 ring-1 ring-sandstone shadow-[0_10px_30px_-20px_rgba(41,24,12,0.45)]'

// ---------------------------------------------------------------------------
// Walk-day roster: standing, grouping, counts (mirrors supabase/schedule.sql)
// ---------------------------------------------------------------------------

export type Counts = { checked_in: number; confirmed: number; waitlisted: number; opted_out: number }

function byJoin(a: RosterRow, b: RosterRow): number {
  const t = Date.parse(a.joined_at) - Date.parse(b.joined_at)
  if (t) return t
  if (a.joined_at !== b.joined_at) return a.joined_at < b.joined_at ? -1 : 1
  return a.dog_id < b.dog_id ? -1 : a.dog_id > b.dog_id ? 1 : 0
}

/** Recompute standing like mochi_standing: active rows by join order fill the cap, the rest wait. */
export function restand(rows: RosterRow[], cap: number): RosterRow[] {
  const place = new Map<string, number>()
  rows
    .filter((r) => !r.opted_out_at)
    .sort(byJoin)
    .forEach((r, i) => place.set(r.dog_id, i))
  return rows.map((r): RosterRow => {
    if (r.opted_out_at) return { ...r, standing: 'opted_out', waitlist_position: null }
    const i = place.get(r.dog_id) ?? 0
    return i < cap
      ? { ...r, standing: 'confirmed', waitlist_position: null }
      : { ...r, standing: 'waitlisted', waitlist_position: i + 1 - cap }
  })
}

/** The local (optimistic) effect of a walk-day action on one dog. */
export function applyMark(rows: RosterRow[], cap: number, dogId: string, action: MarkAction, at: string): RosterRow[] {
  const next = rows.map((r): RosterRow => {
    if (r.dog_id !== dogId) return r
    switch (action) {
      case 'check_in':
        return { ...r, checked_in_at: r.checked_in_at ?? at }
      case 'undo_check_in':
        return { ...r, checked_in_at: null }
      case 'opt_out':
        return { ...r, opted_out_at: r.opted_out_at ?? at, opted_out_by: r.opted_out_by ?? 'admin' }
      case 'restore':
        return { ...r, opted_out_at: null, opted_out_by: null }
      case 'waiver':
        return { ...r, waiver_signed: true }
      default:
        return r
    }
  })
  return restand(next, cap)
}

export function countsOf(rows: RosterRow[]): Counts {
  return {
    checked_in: rows.filter((r) => r.checked_in_at && !r.opted_out_at).length,
    confirmed: rows.filter((r) => r.standing === 'confirmed').length,
    waitlisted: rows.filter((r) => r.standing === 'waitlisted').length,
    opted_out: rows.filter((r) => r.opted_out_at).length,
  }
}

export type RosterGroups = { due: RosterRow[]; waitlist: RosterRow[]; here: RosterRow[]; out: RosterRow[] }

const byName = (a: RosterRow, b: RosterRow) =>
  a.dog_name.localeCompare(b.dog_name) || a.owner_name.localeCompare(b.owner_name)

/** Confirmed-but-not-here (A–Z), waitlist (by position), here (A–Z), opted out (A–Z). */
export function groupRoster(rows: RosterRow[]): RosterGroups {
  const g: RosterGroups = { due: [], waitlist: [], here: [], out: [] }
  for (const r of rows) {
    if (r.opted_out_at) g.out.push(r)
    else if (r.checked_in_at) g.here.push(r)
    else if (r.standing === 'waitlisted') g.waitlist.push(r)
    else g.due.push(r)
  }
  g.due.sort(byName)
  g.waitlist.sort((a, b) => (a.waitlist_position ?? 0) - (b.waitlist_position ?? 0) || byName(a, b))
  g.here.sort(byName)
  g.out.sort(byName)
  return g
}

/** Walk-day default: today's walk (Denver date), else the next upcoming, else the most recent. */
export function pickDefaultWalk(walks: Walk[], now: Date = new Date()): Walk | null {
  if (!walks.length) return null
  const live = walks.filter((w) => w.status !== 'draft')
  const pool = live.length ? live : walks
  const t = now.getTime()
  const today = denverDay(now)
  const todays = pool
    .filter((w) => denverDay(w.starts_at) === today)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  if (todays.length) return todays.find((w) => Date.parse(w.ends_at) > t) ?? todays[todays.length - 1]
  const upcoming = pool
    .filter((w) => Date.parse(w.starts_at) > t)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  if (upcoming.length) return upcoming[0]
  return [...pool].sort((a, b) => b.starts_at.localeCompare(a.starts_at))[0] ?? null
}

// ---------------------------------------------------------------------------
// Personal links and contact hrefs
// ---------------------------------------------------------------------------

export const firstName = (name: string): string => name.trim().split(/\s+/)[0] || name.trim()

export function linkMessage(name: string, url: string): string {
  return `Hi ${firstName(name)}! Here's your personal Mochi's Legacy link for gaggle walk sign-ups: ${url} (it's just for you, so please don't share it).`
}

const dial = (phone: string) => phone.replace(/[^\d+]/g, '')

export const telHref = (phone: string): string => `tel:${dial(phone)}`

export const smsHref = (phone: string, body: string): string => `sms:${dial(phone)}?&body=${encodeURIComponent(body)}`

export const mailtoHref = (email: string, subject: string, body: string): string =>
  `mailto:${email.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

/** Landing-page interest still marked "new" (the Interest tab badge). */
export const countNew = (i: Interest): number =>
  [...i.dogs, ...i.volunteers, ...i.pledges].filter((x) => x.status === 'new').length

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** "5 hours ago", "yesterday", "3 days ago"; older than a month → "Sep 3". */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const mins = Math.round((Date.parse(iso) - now) / 60_000)
  if (Math.abs(mins) < 1) return 'just now'
  if (Math.abs(mins) < 60) return rtf.format(mins, 'minute')
  const hours = Math.round(mins / 60)
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return rtf.format(days, 'day')
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', month: 'short', day: 'numeric' }).format(
    new Date(iso),
  )
}

/** "9:41 AM" in Mountain Time. */
export const clockTime = (d: Date): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit' }).format(d)

/** "2026-10-02" + n days (calendar arithmetic, no time zone involved). */
export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return t.toISOString().slice(0, 10)
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}
