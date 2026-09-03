import type { Engagement } from './welfare'

/** Day-of states for a dog that has an active (confirmed) RSVP. */
export type CheckinState = 'rsvpd' | 'checked_in' | 'checked_out' | 'no_show' | 'opted_out'

/** Day-of events the walk lead can apply to a dog. */
export type CheckinEvent = 'check_in' | 'check_out' | 'no_show' | 'opted_out'

export type TransitionResult =
  | { ok: true; state: CheckinState }
  | { ok: false; error: 'illegal_transition' }

/**
 * Pure day-of state machine: rsvpd -> checked_in -> checked_out,
 * with rsvpd -> no_show | opted_out as the other legal exits.
 * Terminal states (checked_out, no_show, opted_out) accept no further events.
 */
export function transition(state: CheckinState, event: CheckinEvent, _at: string): TransitionResult {
  switch (state) {
    case 'rsvpd':
      switch (event) {
        case 'check_in':
          return { ok: true, state: 'checked_in' }
        case 'no_show':
          return { ok: true, state: 'no_show' }
        case 'opted_out':
          return { ok: true, state: 'opted_out' }
        default:
          return { ok: false, error: 'illegal_transition' }
      }
    case 'checked_in':
      if (event === 'check_out') {
        return { ok: true, state: 'checked_out' }
      }
      return { ok: false, error: 'illegal_transition' }
    default:
      return { ok: false, error: 'illegal_transition' }
  }
}

/** Build the welfare record for a completed walk. `start` is the check-in time, `end` the check-out time. */
export function checkOut(dogId: string, start: string, end: string): Engagement {
  return { dogId, start, end, kind: 'walk' }
}
