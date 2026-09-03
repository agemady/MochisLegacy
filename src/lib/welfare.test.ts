import { describe, expect, it } from 'vitest'
import { canAttend, remainingThisWeek, type Engagement } from './welfare'

function at(year: number, month: number, day: number, hour: number, minute = 0): string {
  return new Date(year, month - 1, day, hour, minute).toISOString()
}

function walk(dogId: string, start: string, end: string): Engagement {
  return { dogId, start, end, kind: 'walk' }
}

// 2026-10-05 is a Monday in local time.
const mon = (hour: number, minute = 0) => at(2026, 10, 5, hour, minute)
const tue = (hour: number, minute = 0) => at(2026, 10, 6, hour, minute)
const wed = (hour: number, minute = 0) => at(2026, 10, 7, hour, minute)
const thu = (hour: number, minute = 0) => at(2026, 10, 8, hour, minute)
const prevFri = (hour: number, minute = 0) => at(2026, 10, 2, hour, minute)

describe('canAttend', () => {
  it('rejects when the day would exceed the hour cap', () => {
    const existing = [walk('d1', mon(10), mon(10, 30))]
    const proposed = walk('d1', mon(14), mon(14, 36))
    const result = canAttend('d1', proposed, existing)
    expect(result.ok).toBe(false)
    expect(result.reasons).toContain('exceeds daily hour cap')
  })

  it('allows a day that stays within the hour cap', () => {
    const existing = [walk('d1', mon(10), mon(10, 30))]
    const proposed = walk('d1', mon(14), mon(14, 30))
    expect(canAttend('d1', proposed, existing).ok).toBe(true)
  })

  it('rejects when the week is already at the engagement cap', () => {
    const existing = [
      walk('d1', mon(10), mon(10, 20)),
      walk('d1', tue(10), tue(10, 20)),
      walk('d1', wed(10), wed(10, 20)),
    ]
    const proposed = walk('d1', thu(10), thu(10, 20))
    const result = canAttend('d1', proposed, existing)
    expect(result.ok).toBe(false)
    expect(result.reasons).toContain('exceeds weekly engagement cap')
  })

  it('rejects overlapping engagements', () => {
    const existing = [walk('d1', mon(10), mon(10, 20))]
    const proposed = walk('d1', mon(10, 10), mon(10, 30))
    const result = canAttend('d1', proposed, existing)
    expect(result.ok).toBe(false)
    expect(result.reasons).toContain('overlaps an existing engagement')
  })
})

describe('remainingThisWeek', () => {
  it('counts only this dog and this Monday-start week', () => {
    const existing = [
      walk('d1', mon(10), mon(10, 20)),
      walk('d1', prevFri(10), prevFri(10, 20)),
      walk('d2', tue(10), tue(10, 20)),
    ]
    expect(remainingThisWeek('d1', thu(12), existing)).toBe(2)
  })
})
