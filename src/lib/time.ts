const TZ = 'America/Denver'

type PartMap = Record<string, string>

function partsOf(
  value: string | Date,
  extra: Intl.DateTimeFormatOptions = {},
): PartMap {
  const map: PartMap = {}
  for (const part of new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    ...extra,
  }).formatToParts(typeof value === 'string' ? new Date(value) : value)) {
    if (part.type !== 'literal') map[part.type] = part.value
  }
  return map
}

function clockAndPeriod(iso: string): { clock: string; period: string } {
  const p = partsOf(iso, { hour: 'numeric', minute: '2-digit', hour12: true })
  return { clock: `${p.hour}:${p.minute}`, period: p.dayPeriod.toUpperCase() }
}

/** Walk windows render in America/Denver (Mountain Time). */
export function formatWalkWindow(startISO: string, endISO: string): string {
  const start = partsOf(startISO, { weekday: 'short', month: 'short', day: 'numeric' })
  const a = clockAndPeriod(startISO)
  const b = clockAndPeriod(endISO)
  const range =
    a.period === b.period
      ? `${a.clock}–${b.clock} ${b.period}`
      : `${a.clock} ${a.period}–${b.clock} ${b.period}`
  return `${start.weekday} ${start.month} ${start.day} · ${range}`
}

export function isUpcoming(iso: string, now: Date | string = new Date()): boolean {
  return new Date(iso).getTime() >= new Date(now).getTime()
}

function denverYmd(date: Date): { year: number; month: number; day: number; weekday: number } {
  const p = partsOf(date, { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric' })
  const sun0 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday)
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day), weekday: sun0 }
}

function denverOffsetMs(date: Date): number {
  const p = partsOf(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  )
  return asUtc - date.getTime()
}

function denverMidnight(year: number, month: number, day: number): Date {
  const wallAsUtc = Date.UTC(year, month - 1, day)
  let instant = wallAsUtc - denverOffsetMs(new Date(wallAsUtc))
  instant = wallAsUtc - denverOffsetMs(new Date(instant))
  return new Date(instant)
}

/** Monday 00:00 America/Denver of the week containing `date`. */
export function startOfWeekMonday(date: Date): Date {
  const ymd = denverYmd(date)
  const back = ymd.weekday === 0 ? 6 : ymd.weekday - 1
  const monday = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day - back))
  return denverMidnight(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate())
}
