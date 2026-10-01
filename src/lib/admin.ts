import { call, type Result } from './rpc'
import * as demo from './demo'
import type { Standing, Tier, Walk, WalkStatus } from './schedule'

export type RosterRow = {
  dog_id: string
  dog_name: string
  owner_name: string
  owner_phone: string | null
  waiver_signed: boolean
  photo_consent: boolean
  joined_at: string
  checked_in_at: string | null
  opted_out_at: string | null
  opted_out_by: 'owner' | 'admin' | null
  standing: Standing
  waitlist_position: number | null
}

export type Roster = { walk: Walk; rows: RosterRow[] }

/** Walk-day actions (mochi_admin_mark). */
export type MarkAction = 'check_in' | 'undo_check_in' | 'opt_out' | 'restore' | 'waiver' | 'add'

export type PersonDog = { id: string; name: string; tier: Tier; status: 'active' | 'retired' }

export type Person = {
  id: string
  name: string
  email: string | null
  phone: string | null
  is_admin: boolean
  access_token: string
  dogs: PersonDog[]
}

export type InterestStatus = 'new' | 'contacted' | 'approved' | 'archived'
export type InterestKind = 'dog' | 'volunteer' | 'pledge'

export type DogApplication = {
  id: string
  owner_name: string
  email: string
  phone: string | null
  dog_name: string
  breed: string | null
  age: string | null
  city: string | null
  notes: string | null
  status: InterestStatus
  created_at: string
}

export type VolunteerApplication = {
  id: string
  name: string
  email: string
  phone: string | null
  skills: string[]
  interests: string | null
  availability: string | null
  status: InterestStatus
  created_at: string
}

export type Pledge = {
  id: string
  name: string
  email: string
  pledge_amount: number | null
  frequency: 'one-time' | 'monthly' | 'yearly'
  visit_request: string | null
  message: string | null
  status: InterestStatus
  created_at: string
}

export type Interest = {
  dogs: DogApplication[]
  volunteers: VolunteerApplication[]
  pledges: Pledge[]
  subscribers: number
}

export type WalkInput = {
  id: string | null
  title: string
  starts_at: string
  ends_at: string
  meeting_spot: string
  cap: number
  status: WalkStatus
  notes: string | null
}

/** Recent and upcoming walks in any status (drafts included). */
export function adminWalks(key: string): Promise<Result<Walk[]>> {
  return call('mochi_admin_walks', { p_token: key }, () => demo.adminWalks(key))
}

/** Create (id null) or update a walk. */
export function saveWalk(key: string, w: WalkInput): Promise<Result<Walk>> {
  return call(
    'mochi_admin_save_walk',
    {
      p_token: key,
      p_id: w.id,
      p_title: w.title,
      p_starts_at: w.starts_at,
      p_ends_at: w.ends_at,
      p_meeting_spot: w.meeting_spot,
      p_cap: w.cap,
      p_status: w.status,
      p_notes: w.notes,
    },
    () => demo.saveWalk(key, w),
  )
}

export function getRoster(key: string, walkId: string): Promise<Result<Roster>> {
  return call('mochi_admin_roster', { p_token: key, p_walk_id: walkId }, () => demo.roster(key, walkId))
}

export function mark(key: string, walkId: string, dogId: string, action: MarkAction): Promise<Result<boolean>> {
  return call(
    'mochi_admin_mark',
    { p_token: key, p_walk_id: walkId, p_dog_id: dogId, p_action: action },
    () => demo.mark(key, walkId, dogId, action),
  )
}

/** Everyone on the roster with their dogs and personal-link tokens. */
export function listPeople(key: string): Promise<Result<Person[]>> {
  return call('mochi_admin_people', { p_token: key }, () => demo.people(key))
}

export function addOwner(
  key: string,
  o: { name: string; email?: string; phone?: string; dogName?: string },
): Promise<Result<Person>> {
  return call(
    'mochi_admin_add_owner',
    {
      p_token: key,
      p_name: o.name,
      p_email: o.email || null,
      p_phone: o.phone || null,
      p_dog_name: o.dogName || null,
    },
    () => demo.addOwner(key, o.name, o.email, o.phone, o.dogName),
  )
}

export function addDog(key: string, ownerId: string, dogName: string): Promise<Result<Person>> {
  return call('mochi_admin_add_dog', { p_token: key, p_owner_id: ownerId, p_dog_name: dogName }, () =>
    demo.addDog(key, ownerId, dogName),
  )
}

/** Issue a fresh personal link; the old one stops working. */
export function newLink(key: string, personId: string): Promise<Result<Person>> {
  return call('mochi_admin_new_link', { p_token: key, p_person_id: personId }, () => demo.newLink(key, personId))
}

/** Open (new + contacted) landing-page interest. */
export function getInterest(key: string): Promise<Result<Interest>> {
  return call('mochi_admin_interest', { p_token: key }, () => demo.interest(key))
}

export function setInterestStatus(
  key: string,
  kind: InterestKind,
  id: string,
  status: InterestStatus,
): Promise<Result<boolean>> {
  return call(
    'mochi_admin_set_interest_status',
    { p_token: key, p_kind: kind, p_id: id, p_status: status },
    () => demo.setInterestStatus(key, kind, id, status),
  )
}

/** Approve a dog application: owner + dog join the roster; returns the owner (with link token). */
export function approveDog(key: string, applicationId: string): Promise<Result<Person>> {
  return call('mochi_admin_approve_dog', { p_token: key, p_application_id: applicationId }, () =>
    demo.approveDog(key, applicationId),
  )
}
