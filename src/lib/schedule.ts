import { roster } from '../data/roster'
import { getSupabase } from './supabase'
import { placeRsvp, type Rsvp } from './rsvp'

export type Person = {
  id: string; auth_user_id: string | null; name: string; email: string
  phone: string | null; is_admin: boolean; created_at: string
}
export type Dog = {
  id: string; owner_id: string; name: string
  tier: 'gaggle' | 'candidate' | 'therapy'; status: 'active' | 'retired'; created_at: string
}
export type Walk = {
  id: string; starts_at: string; ends_at: string; meeting_spot: string
  cap: number; status: 'draft' | 'published' | 'done'; created_at: string
}
export type WalkRsvp = {
  walk_id: string; dog_id: string; waiver_signed: boolean; photo_consent: boolean
  checked_in_at: string | null; opted_out_at: string | null; created_at: string
}
export type Result<T = unknown> = { ok: boolean; data?: T; message: string }

const OWNER = 'person-demo'
const AT = '2026-09-03T00:00:00.000Z'
const ok = <T>(data: T, message: string): Result<T> => ({ ok: true, data, message })
const fail = (message: string): Result<never> => ({ ok: false, message })
const iso = () => new Date().toISOString()

const walk: Walk = {
  id: 'walk-oct2', starts_at: '2026-10-02T09:00:00-06:00', ends_at: '2026-10-02T10:00:00-06:00',
  meeting_spot: 'Foothills Community Park, Shelter A', cap: 15, status: 'published', created_at: AT,
}
const dogs: Dog[] = [
  { id: 'dog-benny', owner_id: OWNER, name: 'Benny', tier: 'gaggle', status: 'active', created_at: AT },
  { id: 'dog-honey', owner_id: OWNER, name: 'Honey', tier: 'gaggle', status: 'active', created_at: AT },
  { id: 'dog-bear', owner_id: OWNER, name: 'Bear', tier: 'gaggle', status: 'active', created_at: AT },
]
let rsvps: WalkRsvp[] = []

function libRsvps(rows: WalkRsvp[], cap: number): Rsvp[] {
  const active = rows.filter((r) => !r.opted_out_at).sort((a, b) => a.created_at.localeCompare(b.created_at))
  return [
    ...active.map((r, i) => ({ dogId: r.dog_id, status: (i < cap ? 'confirmed' : 'waitlisted') as Rsvp['status'] })),
    ...rows.filter((r) => r.opted_out_at).map((r) => ({ dogId: r.dog_id, status: 'cancelled' as const })),
  ]
}

function rowOf(list: WalkRsvp[], walkId: string, dogId: string) {
  return list.find((r) => r.walk_id === walkId && r.dog_id === dogId)
}

async function loadWalk(id: string): Promise<Result<Walk>> {
  const supabase = await getSupabase()
  if (!supabase) return id === walk.id ? ok(walk, 'Demo mode') : fail('Walk not found.')
  const { data, error } = await supabase.from('walks').select('*').eq('id', id).maybeSingle()
  return error || !data ? fail('Walk not found.') : ok(data as Walk, 'OK')
}

async function loadRsvps(walkId: string): Promise<Result<WalkRsvp[]>> {
  const supabase = await getSupabase()
  if (!supabase) return ok(rsvps.filter((r) => r.walk_id === walkId), 'Demo mode')
  const { data, error } = await supabase.from('walk_rsvps').select('*').eq('walk_id', walkId)
  return error ? fail('Unable to load RSVPs right now.') : ok((data ?? []) as WalkRsvp[], 'OK')
}

async function requireAdmin(): Promise<Result<true>> {
  const supabase = await getSupabase()
  if (!supabase) return fail('Admin only.')
  const { data } = await supabase.rpc('is_admin')
  return data === true ? ok(true, 'OK') : fail('Admin only.')
}

async function patchRsvp(
  walkId: string, dogId: string, patch: Partial<WalkRsvp>, missing: string, done: string, admin: boolean,
): Promise<Result<WalkRsvp>> {
  if (!admin && 'checked_in_at' in patch) delete patch.checked_in_at
  const supabase = await getSupabase()
  if (!supabase) {
    const row = rowOf(rsvps, walkId, dogId)
    if (!row || row.opted_out_at) return fail(missing)
    Object.assign(row, patch)
    return ok(row, done)
  }
  if (admin) {
    const gate = await requireAdmin()
    if (!gate.ok) return fail(gate.message)
  }
  const { data, error } = await supabase
    .from('walk_rsvps').update(patch).eq('walk_id', walkId).eq('dog_id', dogId)
    .is('opted_out_at', null).select().maybeSingle()
  return error || !data ? fail(missing) : ok(data as WalkRsvp, done)
}

export async function getUpcomingWalk(): Promise<Result<Walk | null>> {
  const supabase = await getSupabase()
  if (!supabase) return ok(walk, 'Demo mode')
  const { data, error } = await supabase
    .from('walks').select('*').eq('status', 'published').gte('starts_at', iso())
    .order('starts_at').limit(1).maybeSingle()
  if (error) return fail('Unable to load walks right now.')
  return ok((data as Walk) ?? null, data ? 'OK' : 'No upcoming walk')
}

export async function getMyDogs(): Promise<Result<Dog[]>> {
  const supabase = await getSupabase()
  if (!supabase) return ok(dogs, 'Demo mode')
  const { data: pid, error: pidErr } = await supabase.rpc('current_person_id')
  if (pidErr || !pid) return fail('Sign in to see your dogs.')
  const { data, error } = await supabase.from('dogs').select('*').eq('owner_id', pid).eq('status', 'active')
  return error ? fail('Unable to load dogs right now.') : ok((data ?? []) as Dog[], 'OK')
}

export async function getMyRsvps(walkId: string): Promise<Result<WalkRsvp[]>> {
  const mine = await getMyDogs()
  if (!mine.ok || !mine.data) {
    return mine.message.startsWith('Sign in') ? ok([], mine.message) : fail(mine.message)
  }
  const ids = new Set(mine.data.map((d) => d.id))
  const all = await loadRsvps(walkId)
  if (!all.ok || !all.data) return fail(all.message)
  return ok(all.data.filter((r) => ids.has(r.dog_id)), mine.message)
}

export async function rsvp(
  walkId: string, dogId: string, consents: { waiverSigned: boolean; photoConsent: boolean },
): Promise<Result<WalkRsvp>> {
  const w = await loadWalk(walkId)
  if (!w.ok || !w.data) return fail(w.message)
  const all = await loadRsvps(walkId)
  if (!all.ok || !all.data) return fail(all.message)
  const existing = rowOf(all.data, walkId, dogId)
  if (existing && !existing.opted_out_at) return fail('That dog is already on this walk.')
  // Waitlist vs cap uses every active RSVP on this walk (rsvps_select_published).
  const placed = placeRsvp({ cap: w.data.cap }, libRsvps(all.data, w.data.cap), dogId)
  if (!placed.ok) return fail('That dog is already on this walk.')
  const message = placed.status === 'waitlisted' ? `You're on the waitlist (#${placed.position}).` : "You're walking."
  const payload = {
    walk_id: walkId, dog_id: dogId, waiver_signed: consents.waiverSigned, photo_consent: consents.photoConsent,
    opted_out_at: null, created_at: iso(),
  }
  const supabase = await getSupabase()
  if (!supabase) {
    const next: WalkRsvp = { ...payload, checked_in_at: existing?.checked_in_at ?? null }
    if (existing) Object.assign(existing, next)
    else rsvps = [...rsvps, next]
    return ok(existing ?? next, message)
  }
  const { data, error } = await supabase.from('walk_rsvps').upsert(payload, { onConflict: 'walk_id,dog_id' }).select().single()
  return error ? fail('Unable to RSVP right now.') : ok(data as WalkRsvp, message)
}

export async function optOut(walkId: string, dogId: string): Promise<Result<WalkRsvp>> {
  return patchRsvp(walkId, dogId, { opted_out_at: iso() }, 'No active RSVP to cancel.', 'Spot released.', false)
}

export async function listRsvpsForWalk(walkId: string): Promise<Result<WalkRsvp[]>> {
  return loadRsvps(walkId)
}

export async function checkIn(walkId: string, dogId: string): Promise<Result<WalkRsvp>> {
  return patchRsvp(walkId, dogId, { checked_in_at: iso() }, 'Dog is not on this walk.', 'Checked in.', true)
}

export type RosterCard = { id: string; name: string; tier: Dog['tier'] }

/** Active dogs for /roster. Unconfigured or empty live table uses roster.ts. */
export async function listRosterDogs(): Promise<Result<RosterCard[]>> {
  const fixture: RosterCard[] = roster.map((d) => ({ id: d.id, name: d.name, tier: d.tier }))
  const supabase = await getSupabase()
  if (!supabase) return ok(fixture, 'Demo mode')
  const { data, error } = await supabase.from('dogs').select('id, name, tier').eq('status', 'active').order('name')
  if (error) return fail('Unable to load the roster right now.')
  const rows = (data ?? []) as RosterCard[]
  return ok(rows.length ? rows : fixture, rows.length ? 'OK' : 'Demo fixture')
}
