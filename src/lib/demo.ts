// In-memory stand-in for supabase/schedule.sql, used when Supabase isn't
// configured (local dev, e2e, screenshots). Same rules as the SQL functions:
// standing derived from joined_at order and cap, one walk per dog per day,
// waiver required, owners touch only their own dogs, admins everything.
//
// Demo links: /schedule#k=<DEMO_OWNER_KEY>  ·  /checkin#k=<DEMO_ADMIN_KEY>
import { DemoError } from './rpc'
import type { Me, MyRsvp, Placement, Standing, Walk, WalkStatus } from './schedule'
import type {
  DogApplication,
  Interest,
  InterestKind,
  InterestStatus,
  MarkAction,
  Person,
  Pledge,
  Roster,
  RosterRow,
  VolunteerApplication,
  WalkInput,
} from './admin'

export const DEMO_OWNER_KEY = '00000000000000000000000000000001'
export const DEMO_ADMIN_KEY = '0000000000000000000000000000000a'

type PersonRow = { id: string; name: string; email: string | null; phone: string | null; is_admin: boolean; token: string }
type DogRow = { id: string; owner_id: string; name: string; tier: 'gaggle' | 'candidate' | 'therapy'; status: 'active' | 'retired' }
type WalkRow = {
  id: string; title: string; starts_at: string; ends_at: string; meeting_spot: string
  cap: number; status: WalkStatus; notes: string | null
}
type RsvpRow = {
  walk_id: string; dog_id: string; waiver_signed: boolean; photo_consent: boolean; joined_at: string
  checked_in_at: string | null; opted_out_at: string | null; opted_out_by: 'owner' | 'admin' | null
}

const HOUR = 3_600_000
const DAY = 24 * HOUR
const SPOT = 'Foothills Community Park, Shelter A'

let seq = 0
let clock = 0
const uid = (p: string) => `${p}-${++seq}`
const hex32 = () => Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
// Strictly increasing timestamps so queue order is stable within one tick.
const now = () => new Date(Math.max(Date.now(), clock + 1)).toISOString()
const tick = () => {
  const t = Math.max(Date.now(), clock + 1)
  clock = t
  return new Date(t).toISOString()
}

/** 9:00 AM Mountain (15:00Z during daylight time) `days` from today. */
function morning(days: number, hour = 15): string {
  const d = new Date(Date.now() + days * DAY)
  d.setUTCHours(hour, 0, 0, 0)
  return d.toISOString()
}

let persons: PersonRow[] = []
let dogs: DogRow[] = []
let walks: WalkRow[] = []
let rsvps: RsvpRow[] = []
let dogApps: DogApplication[] = []
let volunteers: VolunteerApplication[] = []
let pledges: Pledge[] = []
let subscribers = 0

/** Reset the demo world (tests call this between cases). */
export function reset(): void {
  seq = 0
  clock = 0
  const person = (name: string, extra: Partial<PersonRow> = {}): PersonRow => ({
    id: uid('person'), name, email: null, phone: null, is_admin: false, token: hex32(), ...extra,
  })
  const founder = person('Founder', { is_admin: true, token: DEMO_ADMIN_KEY, phone: '303-555-0100' })
  const sam = person('Sam Rivera', { token: DEMO_OWNER_KEY, phone: '303-555-0142', email: 'sam@example.com' })
  const others = ['Ari Chen', 'Casey Moore', 'Devon Park', 'Emery Hall', 'Frankie Diaz', 'Gray Ellis', 'Harper Quinn', 'Indy Brooks']
    .map((n, i) => person(n, { phone: `303-555-01${String(50 + i)}` }))
  persons = [founder, sam, ...others]

  const dog = (owner: PersonRow, name: string): DogRow => ({ id: uid('dog'), owner_id: owner.id, name, tier: 'gaggle', status: 'active' })
  const [ari, casey, devon, emery, frankie, gray, harper, indy] = others
  const benny = dog(sam, 'Benny')
  const honey = dog(sam, 'Honey')
  const bear = dog(ari, 'Bear')
  const juni1 = dog(casey, 'Juni')
  const juni2 = dog(devon, 'Juni')
  const louie = dog(emery, 'Louie')
  const moss = dog(frankie, 'Moss')
  const buddy = dog(gray, 'Buddy')
  const jaz = dog(harper, 'Jaz')
  const mini = dog(indy, 'Mini Mochi')
  const luna = dog(founder, 'Luna')
  dogs = [benny, honey, bear, juni1, juni2, louie, moss, buddy, jaz, mini, luna]

  const kickoff: WalkRow = {
    id: uid('walk'), title: 'Kickoff gaggle walk', starts_at: morning(1), ends_at: morning(1, 16),
    meeting_spot: SPOT, cap: 15, status: 'published', notes: 'Bring a leash, water, and poop bags.',
  }
  const second: WalkRow = {
    id: uid('walk'), title: 'Gaggle walk', starts_at: morning(8), ends_at: morning(8, 16),
    meeting_spot: SPOT, cap: 4, status: 'published', notes: null,
  }
  const draft: WalkRow = {
    id: uid('walk'), title: 'Gaggle walk', starts_at: morning(15), ends_at: morning(15, 16),
    meeting_spot: SPOT, cap: 15, status: 'draft', notes: null,
  }
  walks = [kickoff, second, draft]

  const join = (w: WalkRow, d: DogRow, photo = true): RsvpRow => ({
    walk_id: w.id, dog_id: d.id, waiver_signed: true, photo_consent: photo, joined_at: tick(),
    checked_in_at: null, opted_out_at: null, opted_out_by: null,
  })
  rsvps = [
    join(kickoff, bear), join(kickoff, juni1), join(kickoff, louie, false), join(kickoff, moss), join(kickoff, luna),
    join(second, bear), join(second, juni2), join(second, buddy), join(second, jaz), join(second, mini),
  ]

  const ago = (h: number) => new Date(Date.now() - h * HOUR).toISOString()
  dogApps = [
    { id: uid('app'), owner_name: 'Pat Lee', email: 'pat@example.com', phone: '720-555-0111', dog_name: 'Biscuit',
      breed: 'Golden retriever', age: '4', city: 'Boulder', notes: 'Loves kids, calm on leash.', status: 'new', created_at: ago(5) },
    { id: uid('app'), owner_name: 'Robin Shah', email: 'robin@example.com', phone: null, dog_name: 'Maple',
      breed: 'Lab mix', age: '2', city: 'Louisville', notes: null, status: 'contacted', created_at: ago(30) },
  ]
  volunteers = [
    { id: uid('vol'), name: 'Jamie Fox', email: 'jamie@example.com', phone: null, skills: [], interests: 'Photos at walks',
      availability: 'Weekends', status: 'new', created_at: ago(12) },
  ]
  pledges = [
    { id: uid('pledge'), name: 'Morgan Wu', email: 'morgan@example.com', pledge_amount: 25, frequency: 'monthly',
      visit_request: null, message: 'For Mochi.', status: 'new', created_at: ago(48) },
  ]
  subscribers = 7
}
reset()

// ---------------------------------------------------------------------------
// Rules shared by every call
// ---------------------------------------------------------------------------

function personFor(key: string): PersonRow {
  const p = /^[0-9a-f]{32}$/.test(key) ? persons.find((x) => x.token === key) : undefined
  if (!p) throw new DemoError("This link isn't valid. Ask a founder for a fresh one.")
  return p
}

function requireAdmin(key: string): PersonRow {
  const p = personFor(key)
  if (!p.is_admin) throw new DemoError("This link doesn't have walk-admin access.")
  return p
}

function standing(walkId: string): Map<string, { standing: Standing; waitlist_position: number | null }> {
  const w = walks.find((x) => x.id === walkId)
  const out = new Map<string, { standing: Standing; waitlist_position: number | null }>()
  if (!w) return out
  const rows = rsvps.filter((r) => r.walk_id === walkId)
  rows
    .filter((r) => !r.opted_out_at)
    .sort((a, b) => a.joined_at.localeCompare(b.joined_at) || a.dog_id.localeCompare(b.dog_id))
    .forEach((r, i) =>
      out.set(r.dog_id, i < w.cap
        ? { standing: 'confirmed', waitlist_position: null }
        : { standing: 'waitlisted', waitlist_position: i + 1 - w.cap }),
    )
  for (const r of rows) if (r.opted_out_at) out.set(r.dog_id, { standing: 'opted_out', waitlist_position: null })
  return out
}

function walkJson(w: WalkRow): Walk {
  const s = [...standing(w.id).values()]
  const rows = rsvps.filter((r) => r.walk_id === w.id)
  return {
    ...w,
    confirmed: s.filter((x) => x.standing === 'confirmed').length,
    waitlisted: s.filter((x) => x.standing === 'waitlisted').length,
    checked_in: rows.filter((r) => r.checked_in_at && !r.opted_out_at).length,
    opted_out: rows.filter((r) => r.opted_out_at).length,
  }
}

function personJson(p: PersonRow): Person {
  return {
    id: p.id, name: p.name, email: p.email, phone: p.phone, is_admin: p.is_admin, access_token: p.token,
    dogs: dogs
      .filter((d) => d.owner_id === p.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ id, name, tier, status }) => ({ id, name, tier, status })),
  }
}

const denverDay = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver' }).format(new Date(iso))

// ---------------------------------------------------------------------------
// Public + owner
// ---------------------------------------------------------------------------

export function upcomingWalks(): Walk[] {
  const t = Date.now()
  return walks
    .filter((w) => w.status === 'published' && Date.parse(w.ends_at) > t)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 12)
    .map(walkJson)
}

export function me(key: string): Me {
  const p = personFor(key)
  const mine = dogs.filter((d) => d.owner_id === p.id)
  const upcoming = new Set(upcomingWalks().map((w) => w.id))
  const list: MyRsvp[] = []
  for (const r of rsvps) {
    if (r.opted_out_at || !upcoming.has(r.walk_id) || !mine.some((d) => d.id === r.dog_id)) continue
    const s = standing(r.walk_id).get(r.dog_id)!
    list.push({
      walk_id: r.walk_id, dog_id: r.dog_id, waiver_signed: r.waiver_signed, photo_consent: r.photo_consent,
      checked_in_at: r.checked_in_at, standing: s.standing as MyRsvp['standing'], waitlist_position: s.waitlist_position,
    })
  }
  return {
    person: { id: p.id, name: p.name, is_admin: p.is_admin },
    dogs: mine
      .filter((d) => d.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ id, name, tier }) => ({ id, name, tier })),
    rsvps: list,
  }
}

export function rsvp(key: string, walkId: string, dogId: string, waiver: boolean, photo: boolean): Placement {
  const p = personFor(key)
  const d = dogs.find((x) => x.id === dogId && x.owner_id === p.id)
  if (!d) throw new DemoError("That dog isn't on your account.")
  if (d.status !== 'active') throw new DemoError(`${d.name} isn't active on the roster right now.`)
  const w = walks.find((x) => x.id === walkId)
  if (!w || w.status !== 'published') throw new DemoError("That walk isn't open for sign-ups.")
  if (Date.parse(w.starts_at) <= Date.now()) throw new DemoError('Sign-ups for this walk are closed.')
  if (!waiver) throw new DemoError('Please agree to the walk waiver to sign up.')

  const existing = rsvps.find((r) => r.walk_id === walkId && r.dog_id === dogId)
  if (!existing || existing.opted_out_at) {
    const clash = rsvps.some((r) => {
      if (r.dog_id !== dogId || r.walk_id === walkId || r.opted_out_at) return false
      const other = walks.find((x) => x.id === r.walk_id)
      return other?.status === 'published' && denverDay(other.starts_at) === denverDay(w.starts_at)
    })
    if (clash) throw new DemoError(`One walk a day: ${d.name} is already on another walk that day.`)
    const row: RsvpRow = {
      walk_id: walkId, dog_id: dogId, waiver_signed: true, photo_consent: photo, joined_at: tick(),
      checked_in_at: null, opted_out_at: null, opted_out_by: null,
    }
    if (existing) Object.assign(existing, row)
    else rsvps.push(row)
  }
  const s = standing(walkId).get(dogId)!
  return { standing: s.standing as Placement['standing'], waitlist_position: s.waitlist_position }
}

export function optOut(key: string, walkId: string, dogId: string): boolean {
  const p = personFor(key)
  if (!dogs.some((x) => x.id === dogId && x.owner_id === p.id)) throw new DemoError("That dog isn't on your account.")
  const w = walks.find((x) => x.id === walkId)
  const r = rsvps.find((x) => x.walk_id === walkId && x.dog_id === dogId && !x.opted_out_at)
  if (!r || !w || Date.parse(w.ends_at) <= Date.now()) throw new DemoError("That dog isn't signed up for this walk.")
  r.opted_out_at = now()
  r.opted_out_by = 'owner'
  return true
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export function adminWalks(key: string): Walk[] {
  requireAdmin(key)
  const cutoff = Date.now() - 14 * DAY
  return walks
    .filter((w) => Date.parse(w.ends_at) > cutoff || w.status === 'draft')
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .map(walkJson)
}

export function saveWalk(key: string, input: WalkInput): Walk {
  requireAdmin(key)
  if (!input.starts_at || !input.ends_at || Date.parse(input.ends_at) <= Date.parse(input.starts_at)) {
    throw new DemoError('The walk needs a start time and an end time after it.')
  }
  if (!input.meeting_spot.trim()) throw new DemoError('Add a meeting spot.')
  if (!(input.cap >= 1 && input.cap <= 200)) throw new DemoError('Capacity must be between 1 and 200 dogs.')
  const fields = {
    title: input.title.trim() || 'Gaggle walk',
    starts_at: new Date(input.starts_at).toISOString(),
    ends_at: new Date(input.ends_at).toISOString(),
    meeting_spot: input.meeting_spot.trim(),
    cap: input.cap,
    status: input.status,
    notes: input.notes?.trim() || null,
  }
  if (!input.id) {
    const w: WalkRow = { id: uid('walk'), ...fields }
    walks.push(w)
    return walkJson(w)
  }
  const w = walks.find((x) => x.id === input.id)
  if (!w) throw new DemoError('That walk no longer exists.')
  Object.assign(w, fields)
  return walkJson(w)
}

export function roster(key: string, walkId: string): Roster {
  requireAdmin(key)
  const w = walks.find((x) => x.id === walkId)
  if (!w) throw new DemoError('That walk no longer exists.')
  const s = standing(walkId)
  const rows: RosterRow[] = rsvps
    .filter((r) => r.walk_id === walkId)
    .map((r) => {
      const d = dogs.find((x) => x.id === r.dog_id)!
      const o = persons.find((x) => x.id === d.owner_id)!
      const st = s.get(r.dog_id)!
      return {
        dog_id: d.id, dog_name: d.name, owner_name: o.name, owner_phone: o.phone,
        waiver_signed: r.waiver_signed, photo_consent: r.photo_consent, joined_at: r.joined_at,
        checked_in_at: r.checked_in_at, opted_out_at: r.opted_out_at, opted_out_by: r.opted_out_by,
        standing: st.standing, waitlist_position: st.waitlist_position,
      }
    })
    .sort((a, b) => a.dog_name.localeCompare(b.dog_name) || a.owner_name.localeCompare(b.owner_name))
  return { walk: walkJson(w), rows }
}

export function mark(key: string, walkId: string, dogId: string, action: MarkAction): boolean {
  requireAdmin(key)
  if (!walks.some((x) => x.id === walkId)) throw new DemoError('That walk no longer exists.')
  const r = rsvps.find((x) => x.walk_id === walkId && x.dog_id === dogId)
  if (action === 'add') {
    if (!dogs.some((x) => x.id === dogId && x.status === 'active')) throw new DemoError('Only active roster dogs can join a walk.')
    if (!r) {
      rsvps.push({
        walk_id: walkId, dog_id: dogId, waiver_signed: false, photo_consent: false, joined_at: tick(),
        checked_in_at: null, opted_out_at: null, opted_out_by: null,
      })
    } else if (r.opted_out_at) {
      r.opted_out_at = null
      r.opted_out_by = null
    }
    return true
  }
  if (!['check_in', 'undo_check_in', 'opt_out', 'restore', 'waiver'].includes(action)) throw new DemoError('Unknown action.')
  if (!r) throw new DemoError("That dog isn't signed up for this walk.")
  if (action === 'check_in') r.checked_in_at ??= now()
  if (action === 'undo_check_in') r.checked_in_at = null
  if (action === 'opt_out') {
    r.opted_out_at ??= now()
    r.opted_out_by ??= 'admin'
  }
  if (action === 'restore') {
    r.opted_out_at = null
    r.opted_out_by = null
  }
  if (action === 'waiver') r.waiver_signed = true
  return true
}

export function people(key: string): Person[] {
  requireAdmin(key)
  return [...persons].sort((a, b) => a.name.localeCompare(b.name)).map(personJson)
}

export function addOwner(key: string, name: string, email?: string, phone?: string, dogName?: string): Person {
  requireAdmin(key)
  if (!name.trim()) throw new DemoError("Add the owner's name.")
  const e = email?.trim().toLowerCase() || null
  if (e && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new DemoError("That email doesn't look right.")
  let p = e ? persons.find((x) => x.email?.toLowerCase() === e) : undefined
  if (!p) {
    p = { id: uid('person'), name: name.trim(), email: e, phone: phone?.trim() || null, is_admin: false, token: hex32() }
    persons.push(p)
  }
  const dn = dogName?.trim()
  if (dn && !dogs.some((d) => d.owner_id === p.id && d.name.toLowerCase() === dn.toLowerCase())) {
    dogs.push({ id: uid('dog'), owner_id: p.id, name: dn, tier: 'gaggle', status: 'active' })
  }
  return personJson(p)
}

export function addDog(key: string, ownerId: string, dogName: string): Person {
  requireAdmin(key)
  const p = persons.find((x) => x.id === ownerId)
  if (!p) throw new DemoError('That owner no longer exists.')
  const dn = dogName.trim()
  if (!dn) throw new DemoError("Add the dog's name.")
  const existing = dogs.find((d) => d.owner_id === p.id && d.name.toLowerCase() === dn.toLowerCase())
  if (existing) existing.status = 'active'
  else dogs.push({ id: uid('dog'), owner_id: p.id, name: dn, tier: 'gaggle', status: 'active' })
  return personJson(p)
}

export function newLink(key: string, personId: string): Person {
  requireAdmin(key)
  const p = persons.find((x) => x.id === personId)
  if (!p) throw new DemoError('That person no longer exists.')
  p.token = hex32()
  return personJson(p)
}

export function interest(key: string): Interest {
  requireAdmin(key)
  const open = <T extends { status: InterestStatus; created_at: string }>(xs: T[]) =>
    xs.filter((x) => x.status === 'new' || x.status === 'contacted').sort((a, b) => b.created_at.localeCompare(a.created_at))
  return { dogs: open(dogApps), volunteers: open(volunteers), pledges: open(pledges), subscribers }
}

export function setInterestStatus(key: string, kind: InterestKind, id: string, status: InterestStatus): boolean {
  requireAdmin(key)
  const list: { id: string; status: InterestStatus }[] =
    kind === 'dog' ? dogApps : kind === 'volunteer' ? volunteers : kind === 'pledge' ? pledges : []
  if (!['dog', 'volunteer', 'pledge'].includes(kind)) throw new DemoError('Unknown kind.')
  const row = list.find((x) => x.id === id)
  if (!row) throw new DemoError('That entry no longer exists.')
  row.status = status
  return true
}

export function approveDog(key: string, applicationId: string): Person {
  requireAdmin(key)
  const app = dogApps.find((x) => x.id === applicationId)
  if (!app) throw new DemoError('That entry no longer exists.')
  const out = addOwner(key, app.owner_name, app.email, app.phone ?? undefined, app.dog_name)
  app.status = 'approved'
  return out
}
