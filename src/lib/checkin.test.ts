import { describe, expect, it } from 'vitest'
import { checkOut, transition, type CheckinEvent, type CheckinState } from './checkin'
import type { Engagement } from './welfare'

const at = '2026-06-01T10:00:00.000Z'

function next(state: CheckinState, event: CheckinEvent): CheckinState | 'illegal' {
  const result = transition(state, event, at)
  return result.ok ? result.state : 'illegal'
}

describe('transition', () => {
  it('moves rsvpd -> checked_in -> checked_out on the happy path', () => {
    expect(next('rsvpd', 'check_in')).toBe('checked_in')
    expect(next('checked_in', 'check_out')).toBe('checked_out')
  })

  it('lets an rsvpd dog end the day as no_show or opted_out', () => {
    expect(next('rsvpd', 'no_show')).toBe('no_show')
    expect(next('rsvpd', 'opted_out')).toBe('opted_out')
  })

  it('rejects check_out before check_in', () => {
    expect(next('rsvpd', 'check_out')).toBe('illegal')
  })

  it('rejects a second check-in and illegal exits from checked_in', () => {
    expect(next('checked_in', 'check_in')).toBe('illegal')
    expect(next('checked_in', 'no_show')).toBe('illegal')
    expect(next('checked_in', 'opted_out')).toBe('illegal')
  })

  it('accepts no events in terminal states', () => {
    const terminal: CheckinState[] = ['checked_out', 'no_show', 'opted_out']
    const events: CheckinEvent[] = ['check_in', 'check_out', 'no_show', 'opted_out']
    for (const state of terminal) {
      for (const event of events) {
        expect(next(state, event)).toBe('illegal')
      }
    }
  })
})

describe('checkOut', () => {
  it('produces a walk Engagement compatible with welfare.ts', () => {
    const start = '2026-06-01T10:05:00.000Z'
    const end = '2026-06-01T10:50:00.000Z'
    const engagement: Engagement = checkOut('biscuit', start, end)
    expect(engagement).toEqual({ dogId: 'biscuit', start, end, kind: 'walk' })
  })
})
