export type Walk = { cap: number }

export type RsvpStatus = 'confirmed' | 'waitlisted' | 'cancelled'

export type Rsvp = {
  dogId: string
  status: RsvpStatus
}

export type PlaceRsvpResult =
  | { ok: true; status: 'confirmed'; rsvps: Rsvp[] }
  | { ok: true; status: 'waitlisted'; position: number; rsvps: Rsvp[] }
  | { ok: false; error: 'already_rsvpd' }

function isActive(r: Rsvp): boolean {
  return r.status === 'confirmed' || r.status === 'waitlisted'
}

function confirmedCount(rsvps: readonly Rsvp[]): number {
  return rsvps.filter((r) => r.status === 'confirmed').length
}

/** 1-based place in the current waitlist, or 0 if the dog is not waitlisted. */
export function waitlistPosition(rsvps: readonly Rsvp[], dogId: string): number {
  const i = rsvps.filter((r) => r.status === 'waitlisted').findIndex((r) => r.dogId === dogId)
  return i === -1 ? 0 : i + 1
}

export function placeRsvp(
  walk: Walk,
  rsvps: readonly Rsvp[],
  dogId: string,
): PlaceRsvpResult {
  if (rsvps.some((r) => r.dogId === dogId && isActive(r))) {
    return { ok: false, error: 'already_rsvpd' }
  }
  if (confirmedCount(rsvps) < walk.cap) {
    return { ok: true, status: 'confirmed', rsvps: [...rsvps, { dogId, status: 'confirmed' }] }
  }
  const next: Rsvp[] = [...rsvps, { dogId, status: 'waitlisted' }]
  return { ok: true, status: 'waitlisted', position: waitlistPosition(next, dogId), rsvps: next }
}

/** Fill open confirmed slots from the waitlist in FIFO order (after a cancellation). */
export function promoteFromWaitlist(walk: Walk, rsvps: readonly Rsvp[]): Rsvp[] {
  let open = walk.cap - confirmedCount(rsvps)
  return rsvps.map((r) => {
    if (r.status === 'waitlisted' && open > 0) {
      open -= 1
      return { ...r, status: 'confirmed' as const }
    }
    return r
  })
}
