import { describe, expect, it } from 'vitest'
import {
  placeRsvp,
  promoteFromWaitlist,
  waitlistPosition,
  type Rsvp,
  type Walk,
} from './rsvp'

const walk = (cap: number): Walk => ({ cap })

function cancel(rsvps: readonly Rsvp[], dogId: string): Rsvp[] {
  return rsvps.map((r) =>
    r.dogId === dogId && r.status !== 'cancelled' ? { ...r, status: 'cancelled' as const } : r,
  )
}

function statuses(rsvps: readonly Rsvp[]): Record<string, Rsvp['status']> {
  return Object.fromEntries(rsvps.map((r) => [r.dogId, r.status]))
}

describe('placeRsvp', () => {
  it('confirms while there is room under cap', () => {
    const a = placeRsvp(walk(2), [], 'd1')
    expect(a).toMatchObject({ ok: true, status: 'confirmed' })
    const b = placeRsvp(walk(2), a.ok ? a.rsvps : [], 'd2')
    expect(b).toMatchObject({ ok: true, status: 'confirmed' })
    if (b.ok) expect(statuses(b.rsvps)).toEqual({ d1: 'confirmed', d2: 'confirmed' })
  })

  it('waitlists past cap and reports 1-based position', () => {
    let rsvps: Rsvp[] = []
    for (const id of ['d1', 'd2']) {
      const r = placeRsvp(walk(2), rsvps, id)
      expect(r.ok && r.status === 'confirmed').toBe(true)
      if (r.ok) rsvps = r.rsvps
    }
    const w1 = placeRsvp(walk(2), rsvps, 'd3')
    expect(w1).toMatchObject({ ok: true, status: 'waitlisted', position: 1 })
    const w2 = placeRsvp(walk(2), w1.ok ? w1.rsvps : [], 'd4')
    expect(w2).toMatchObject({ ok: true, status: 'waitlisted', position: 2 })
  })

  it('rejects a second RSVP from the same dog (confirmed or waitlisted)', () => {
    const confirmed = placeRsvp(walk(1), [], 'd1')
    expect(placeRsvp(walk(1), confirmed.ok ? confirmed.rsvps : [], 'd1')).toEqual({
      ok: false,
      error: 'already_rsvpd',
    })
    const waitlisted = placeRsvp(walk(1), confirmed.ok ? confirmed.rsvps : [], 'd2')
    expect(placeRsvp(walk(1), waitlisted.ok ? waitlisted.rsvps : [], 'd2')).toEqual({
      ok: false,
      error: 'already_rsvpd',
    })
  })

  it('lets a cancelled dog RSVP again', () => {
    const placed = placeRsvp(walk(1), [], 'd1')
    const after = cancel(placed.ok ? placed.rsvps : [], 'd1')
    const again = placeRsvp(walk(1), after, 'd1')
    expect(again).toMatchObject({ ok: true, status: 'confirmed' })
  })
})

describe('promoteFromWaitlist', () => {
  it('promotes the first waitlisted dog after a confirmed cancellation', () => {
    let rsvps: Rsvp[] = []
    for (const id of ['d1', 'd2', 'd3', 'd4']) {
      const r = placeRsvp(walk(2), rsvps, id)
      if (r.ok) rsvps = r.rsvps
    }
    rsvps = promoteFromWaitlist(walk(2), cancel(rsvps, 'd1'))
    expect(statuses(rsvps)).toEqual({
      d1: 'cancelled',
      d2: 'confirmed',
      d3: 'confirmed',
      d4: 'waitlisted',
    })
    expect(waitlistPosition(rsvps, 'd4')).toBe(1)
  })

  it('promotes nothing when the waitlist is empty or the walk is still full', () => {
    const only = placeRsvp(walk(1), [], 'd1')
    const rsvps = only.ok ? only.rsvps : []
    expect(promoteFromWaitlist(walk(1), rsvps)).toEqual(rsvps)
    expect(promoteFromWaitlist(walk(1), cancel(rsvps, 'd1'))).toEqual(cancel(rsvps, 'd1'))
  })

  it('fills every open confirmed slot from the waitlist in FIFO order', () => {
    let rsvps: Rsvp[] = []
    for (const id of ['d1', 'd2', 'd3', 'd4']) {
      const r = placeRsvp(walk(2), rsvps, id)
      if (r.ok) rsvps = r.rsvps
    }
    rsvps = promoteFromWaitlist(walk(2), cancel(cancel(rsvps, 'd1'), 'd2'))
    expect(statuses(rsvps)).toEqual({
      d1: 'cancelled',
      d2: 'cancelled',
      d3: 'confirmed',
      d4: 'confirmed',
    })
  })
})
