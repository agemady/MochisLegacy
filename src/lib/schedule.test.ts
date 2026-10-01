import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as admin from './admin'
import * as demo from './demo'
import * as s from './schedule'
import type { Result } from './rpc'

const OWNER = demo.DEMO_OWNER_KEY
const ADMIN = demo.DEMO_ADMIN_KEY
const yes = { waiverSigned: true, photoConsent: false }

function data<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(`expected ok, got: ${r.message}`)
  return r.data
}

async function walks() {
  const [kickoff, second] = data(await s.listUpcomingWalks())
  return { kickoff, second }
}

async function dogsOf(key: string) {
  const me = data(await s.getMe(key))
  return Object.fromEntries(me.dogs.map((d) => [d.name, d.id]))
}

describe('schedule data layer (demo mode)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    demo.reset()
  })

  it('lists only upcoming published walks, soonest first, with counts', async () => {
    const list = data(await s.listUpcomingWalks())
    expect(list.map((w) => w.status)).toEqual(['published', 'published'])
    expect(list[0].starts_at < list[1].starts_at).toBe(true)
    expect(list[0]).toMatchObject({ cap: 15, confirmed: 5, waitlisted: 0 })
    expect(list[1]).toMatchObject({ cap: 4, confirmed: 4, waitlisted: 1 })
    expect(s.spotsLeft(list[0])).toBe(10)
    expect(s.spotsLeft(list[1])).toBe(0)
  })

  it('rejects a bad link with a person-readable message', async () => {
    const r = await s.getMe('ffffffffffffffffffffffffffffffff')
    expect(r).toEqual({ ok: false, message: "This link isn't valid. Ask a founder for a fresh one." })
  })

  it('requires the waiver, confirms under the cap, and is idempotent', async () => {
    const { kickoff } = await walks()
    const { Benny } = await dogsOf(OWNER)
    expect(await s.rsvp(OWNER, kickoff.id, Benny, { waiverSigned: false, photoConsent: false })).toEqual({
      ok: false,
      message: 'Please agree to the walk waiver to sign up.',
    })
    expect(data(await s.rsvp(OWNER, kickoff.id, Benny, yes))).toEqual({ standing: 'confirmed', waitlist_position: null })
    expect(data(await s.rsvp(OWNER, kickoff.id, Benny, yes))).toEqual({ standing: 'confirmed', waitlist_position: null })
    expect((await walks()).kickoff.confirmed).toBe(6)
    const me = data(await s.getMe(OWNER))
    expect(me.rsvps).toEqual([expect.objectContaining({ walk_id: kickoff.id, dog_id: Benny, standing: 'confirmed' })])
  })

  it('waitlists past the cap and promotes on opt-out', async () => {
    const { second } = await walks()
    const { Honey } = await dogsOf(OWNER)
    expect(data(await s.rsvp(OWNER, second.id, Honey, yes))).toEqual({ standing: 'waitlisted', waitlist_position: 2 })

    // An admin opts out a confirmed dog: waitlist #1 (Mini Mochi) moves up, Honey becomes #1.
    const roster = data(await admin.getRoster(ADMIN, second.id))
    const bear = roster.rows.find((r) => r.dog_name === 'Bear')!
    expect(data(await admin.mark(ADMIN, second.id, bear.dog_id, 'opt_out'))).toBe(true)
    const after = data(await admin.getRoster(ADMIN, second.id))
    expect(after.rows.find((r) => r.dog_name === 'Mini Mochi')).toMatchObject({ standing: 'confirmed' })
    expect(after.rows.find((r) => r.dog_name === 'Honey')).toMatchObject({ standing: 'waitlisted', waitlist_position: 1 })
    expect(after.rows.find((r) => r.dog_name === 'Bear')).toMatchObject({ standing: 'opted_out', opted_out_by: 'admin' })

    // Owner gives up the waitlist spot; re-joining goes to the back of the line.
    expect(data(await s.optOut(OWNER, second.id, Honey))).toBe(true)
    expect(data(await s.getMe(OWNER)).rsvps).toEqual([])
    expect(await s.optOut(OWNER, second.id, Honey)).toEqual({ ok: false, message: "That dog isn't signed up for this walk." })
  })

  it('allows one walk per dog per day', async () => {
    const { kickoff } = await walks()
    const later = data(
      await admin.saveWalk(ADMIN, {
        id: null,
        title: 'Evening loop',
        starts_at: new Date(Date.parse(kickoff.starts_at) + 2 * 3_600_000).toISOString(),
        ends_at: new Date(Date.parse(kickoff.starts_at) + 3 * 3_600_000).toISOString(),
        meeting_spot: 'Foothills Community Park, Shelter A',
        cap: 10,
        status: 'published',
        notes: null,
      }),
    )
    const { Benny } = await dogsOf(OWNER)
    data(await s.rsvp(OWNER, kickoff.id, Benny, yes))
    expect(await s.rsvp(OWNER, later.id, Benny, yes)).toEqual({
      ok: false,
      message: 'One walk a day: Benny is already on another walk that day.',
    })
  })

  it("never lets an owner touch someone else's dog or the admin tools", async () => {
    const { kickoff } = await walks()
    const roster = data(await admin.getRoster(ADMIN, kickoff.id))
    const bear = roster.rows.find((r) => r.dog_name === 'Bear')!
    expect(await s.optOut(OWNER, kickoff.id, bear.dog_id)).toEqual({ ok: false, message: "That dog isn't on your account." })
    expect(await admin.getRoster(OWNER, kickoff.id)).toEqual({
      ok: false,
      message: "This link doesn't have walk-admin access.",
    })
  })

  it('runs walk day: check in, undo, waiver, add a roster dog, restore', async () => {
    const { kickoff } = await walks()
    const rows = data(await admin.getRoster(ADMIN, kickoff.id)).rows
    const moss = rows.find((r) => r.dog_name === 'Moss')!
    data(await admin.mark(ADMIN, kickoff.id, moss.dog_id, 'check_in'))
    expect(data(await admin.getRoster(ADMIN, kickoff.id)).walk.checked_in).toBe(1)
    data(await admin.mark(ADMIN, kickoff.id, moss.dog_id, 'undo_check_in'))
    expect(data(await admin.getRoster(ADMIN, kickoff.id)).walk.checked_in).toBe(0)

    const people = data(await admin.listPeople(ADMIN))
    const jaz = people.flatMap((p) => p.dogs).find((d) => d.name === 'Jaz')!
    data(await admin.mark(ADMIN, kickoff.id, jaz.id, 'add'))
    let jazRow = data(await admin.getRoster(ADMIN, kickoff.id)).rows.find((r) => r.dog_id === jaz.id)!
    expect(jazRow).toMatchObject({ standing: 'confirmed', waiver_signed: false })
    data(await admin.mark(ADMIN, kickoff.id, jaz.id, 'waiver'))
    data(await admin.mark(ADMIN, kickoff.id, jaz.id, 'opt_out'))
    data(await admin.mark(ADMIN, kickoff.id, jaz.id, 'restore'))
    jazRow = data(await admin.getRoster(ADMIN, kickoff.id)).rows.find((r) => r.dog_id === jaz.id)!
    expect(jazRow).toMatchObject({ standing: 'confirmed', waiver_signed: true, opted_out_at: null })
  })

  it('turns interest into roster members with personal links', async () => {
    const interest = data(await admin.getInterest(ADMIN))
    expect(interest.dogs.map((d) => d.dog_name)).toEqual(['Biscuit', 'Maple'])
    const owner = data(await admin.approveDog(ADMIN, interest.dogs[0].id))
    expect(owner).toMatchObject({ name: 'Pat Lee', email: 'pat@example.com', dogs: [expect.objectContaining({ name: 'Biscuit' })] })
    expect(owner.access_token).toMatch(/^[0-9a-f]{32}$/)
    expect(data(await admin.getInterest(ADMIN)).dogs.map((d) => d.dog_name)).toEqual(['Maple'])

    // The new link works for the owner, and a fresh link retires the old one.
    expect(data(await s.getMe(owner.access_token)).dogs.map((d) => d.name)).toEqual(['Biscuit'])
    const rotated = data(await admin.newLink(ADMIN, owner.id))
    expect(rotated.access_token).not.toBe(owner.access_token)
    expect((await s.getMe(owner.access_token)).ok).toBe(false)

    // Adding by email reuses the person instead of duplicating them.
    const again = data(await admin.addOwner(ADMIN, { name: 'Pat L.', email: 'PAT@example.com', dogName: 'Pepper' }))
    expect(again.id).toBe(owner.id)
    expect(again.dogs.map((d) => d.name)).toEqual(['Biscuit', 'Pepper'])
  })
})
