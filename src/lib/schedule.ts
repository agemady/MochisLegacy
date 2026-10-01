import { call, type Result } from './rpc'
import * as demo from './demo'

export type { Result } from './rpc'

export type Tier = 'gaggle' | 'candidate' | 'therapy'
export type WalkStatus = 'draft' | 'published' | 'done'
export type Standing = 'confirmed' | 'waitlisted' | 'opted_out'

/** A walk with live counts (mochi_walk_json in supabase/schedule.sql). */
export type Walk = {
  id: string
  title: string
  starts_at: string
  ends_at: string
  meeting_spot: string
  cap: number
  status: WalkStatus
  notes: string | null
  confirmed: number
  waitlisted: number
  checked_in: number
  opted_out: number
}

export type MyDog = { id: string; name: string; tier: Tier }

/** One of my dogs' active place on an upcoming walk. */
export type MyRsvp = {
  walk_id: string
  dog_id: string
  waiver_signed: boolean
  photo_consent: boolean
  checked_in_at: string | null
  standing: 'confirmed' | 'waitlisted'
  waitlist_position: number | null
}

export type Me = {
  person: { id: string; name: string; is_admin: boolean }
  dogs: MyDog[]
  rsvps: MyRsvp[]
}

export type Placement = { standing: 'confirmed' | 'waitlisted'; waitlist_position: number | null }

export const spotsLeft = (w: Walk): number => Math.max(0, w.cap - w.confirmed)

/** Upcoming published walks, soonest first. Public: no key needed. */
export function listUpcomingWalks(): Promise<Result<Walk[]>> {
  return call('mochi_upcoming_walks', {}, () => demo.upcomingWalks())
}

/** Whoever the personal link belongs to, their dogs, and their RSVPs. */
export function getMe(key: string): Promise<Result<Me>> {
  return call('mochi_me', { p_token: key }, () => demo.me(key))
}

/** Join a walk (or the waitlist when it's full). Idempotent for a dog already in. */
export function rsvp(
  key: string,
  walkId: string,
  dogId: string,
  consents: { waiverSigned: boolean; photoConsent: boolean },
): Promise<Result<Placement>> {
  return call(
    'mochi_rsvp',
    {
      p_token: key,
      p_walk_id: walkId,
      p_dog_id: dogId,
      p_waiver_signed: consents.waiverSigned,
      p_photo_consent: consents.photoConsent,
    },
    () => demo.rsvp(key, walkId, dogId, consents.waiverSigned, consents.photoConsent),
  )
}

/** Give up a spot (the next waitlisted dog moves up automatically). */
export function optOut(key: string, walkId: string, dogId: string): Promise<Result<boolean>> {
  return call('mochi_opt_out', { p_token: key, p_walk_id: walkId, p_dog_id: dogId }, () =>
    demo.optOut(key, walkId, dogId),
  )
}
