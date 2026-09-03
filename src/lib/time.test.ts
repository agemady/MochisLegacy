import { describe, expect, it } from 'vitest'
import { formatWalkWindow, isUpcoming, startOfWeekMonday } from './time'

describe('formatWalkWindow', () => {
  it('formats a Thursday morning walk in Mountain Time', () => {
    expect(
      formatWalkWindow('2025-10-02T15:00:00.000Z', '2025-10-02T16:00:00.000Z'),
    ).toBe('Thu Oct 2 · 9:00–10:00 AM')
  })

  it('keeps both periods when the window crosses noon', () => {
    expect(
      formatWalkWindow('2025-10-02T17:00:00.000Z', '2025-10-02T19:30:00.000Z'),
    ).toBe('Thu Oct 2 · 11:00 AM–1:30 PM')
  })
})

describe('isUpcoming', () => {
  const now = '2025-10-02T15:00:00.000Z'

  it('is true at or after now', () => {
    expect(isUpcoming('2025-10-02T15:00:00.000Z', now)).toBe(true)
    expect(isUpcoming('2025-10-02T15:00:01.000Z', now)).toBe(true)
  })

  it('is false before now', () => {
    expect(isUpcoming('2025-10-02T14:59:59.000Z', now)).toBe(false)
  })
})

describe('startOfWeekMonday', () => {
  it('returns Monday midnight Mountain from a Thursday in MDT', () => {
    expect(startOfWeekMonday(new Date('2025-10-02T15:00:00.000Z')).toISOString()).toBe(
      '2025-09-29T06:00:00.000Z',
    )
  })

  it('returns the same Monday for Sunday and stays put on Monday', () => {
    expect(startOfWeekMonday(new Date('2025-10-05T20:00:00.000Z')).toISOString()).toBe(
      '2025-09-29T06:00:00.000Z',
    )
    expect(startOfWeekMonday(new Date('2025-09-29T06:00:00.000Z')).toISOString()).toBe(
      '2025-09-29T06:00:00.000Z',
    )
  })

  it('uses MST offset in winter', () => {
    expect(startOfWeekMonday(new Date('2026-01-07T18:00:00.000Z')).toISOString()).toBe(
      '2026-01-05T07:00:00.000Z',
    )
  })
})
