export type Engagement = {
  dogId: string
  start: string
  end: string
  kind: 'walk' | 'event' | 'visit'
}

export type WelfareRules = {
  maxHoursPerDay: number
  maxEngagementsPerWeek: number
}

export const DEFAULT_WELFARE_RULES: WelfareRules = {
  maxHoursPerDay: 1,
  maxEngagementsPerWeek: 3,
}

export type AttendResult = { ok: boolean; reasons: string[] }

// Day and week bounds use the JS runtime's local timezone (not UTC). Week starts Monday.

const MS_HOUR = 3_600_000

function asDate(iso: string): Date {
  return new Date(iso)
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

function startOfWeekMonday(d: Date): Date {
  const day = startOfLocalDay(d)
  const weekday = day.getDay()
  return addDays(day, weekday === 0 ? -6 : 1 - weekday)
}

function inWeek(iso: string, weekStart: Date): boolean {
  const t = asDate(iso).getTime()
  return t >= weekStart.getTime() && t < addDays(weekStart, 7).getTime()
}

function hoursOnDay(start: Date, end: Date, day: Date): number {
  const lo = Math.max(start.getTime(), day.getTime())
  const hi = Math.min(end.getTime(), addDays(day, 1).getTime())
  return hi > lo ? (hi - lo) / MS_HOUR : 0
}

function eachLocalDay(start: Date, end: Date): Date[] {
  const days: Date[] = []
  let day = startOfLocalDay(start)
  const last = startOfLocalDay(new Date(Math.max(start.getTime(), end.getTime() - 1)))
  while (day.getTime() <= last.getTime()) {
    days.push(day)
    day = addDays(day, 1)
  }
  return days
}

function overlaps(a0: Date, a1: Date, b0: Date, b1: Date): boolean {
  return a0 < b1 && b0 < a1
}

function forDog(dogId: string, existing: Engagement[]): Engagement[] {
  return existing.filter((e) => e.dogId === dogId)
}

export function remainingThisWeek(
  dogId: string,
  at: string,
  existing: Engagement[],
  rules: WelfareRules = DEFAULT_WELFARE_RULES,
): number {
  const weekStart = startOfWeekMonday(asDate(at))
  const used = forDog(dogId, existing).filter((e) => inWeek(e.start, weekStart)).length
  return Math.max(0, rules.maxEngagementsPerWeek - used)
}

export function canAttend(
  dogId: string,
  proposed: Engagement,
  existing: Engagement[],
  rules: WelfareRules = DEFAULT_WELFARE_RULES,
): AttendResult {
  const reasons: string[] = []
  const mine = forDog(dogId, existing)
  const p0 = asDate(proposed.start)
  const p1 = asDate(proposed.end)

  if (mine.some((e) => overlaps(p0, p1, asDate(e.start), asDate(e.end)))) {
    reasons.push('overlaps an existing engagement')
  }

  for (const day of eachLocalDay(p0, p1)) {
    const hours =
      hoursOnDay(p0, p1, day) +
      mine.reduce((sum, e) => sum + hoursOnDay(asDate(e.start), asDate(e.end), day), 0)
    if (hours > rules.maxHoursPerDay) {
      reasons.push('exceeds daily hour cap')
      break
    }
  }

  if (remainingThisWeek(dogId, proposed.start, existing, rules) < 1) {
    reasons.push('exceeds weekly engagement cap')
  }

  return { ok: reasons.length === 0, reasons }
}
