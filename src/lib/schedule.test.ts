import { beforeEach, describe, expect, it, vi } from 'vitest'

const consents = { waiverSigned: true, photoConsent: true }

describe('schedule demo-mode data layer', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    vi.doUnmock('./supabase')
    vi.resetModules()
  })

  it('covers walk, capacity, duplicate, promotion, check-in, and list', async () => {
    const s = await import('./schedule')
    const up = await s.getUpcomingWalk()
    expect(up).toMatchObject({
      ok: true,
      data: {
        id: 'walk-oct2',
        starts_at: '2026-10-02T09:00:00-06:00',
        meeting_spot: 'Foothills Community Park, Shelter A',
        cap: 15,
      },
    })
    const walk = up.data!
    const ids = Array.from({ length: walk.cap + 1 }, (_, i) => `d${i}`)
    const placed = []
    for (const id of ids) placed.push(await s.rsvp(walk.id, id, consents))
    expect(placed.slice(0, walk.cap).every((r) => r.ok && r.message === "You're walking.")).toBe(true)
    expect(placed.at(-1)).toMatchObject({ ok: true, message: "You're on the waitlist (#1)." })
    expect(await s.rsvp(walk.id, ids[0], consents)).toMatchObject({
      ok: false, message: 'That dog is already on this walk.',
    })

    const cancelled = await s.optOut(walk.id, ids[0])
    expect(cancelled.ok).toBe(true)
    expect(cancelled.data?.opted_out_at).toBeTruthy()
    // Promotion took the open slot: a new dog waitlists at #1 instead of confirming.
    expect(await s.rsvp(walk.id, 'd-extra', consents)).toMatchObject({
      ok: true, message: "You're on the waitlist (#1).",
    })

    const cin = await s.checkIn(walk.id, ids[1])
    expect(cin).toMatchObject({ ok: true, message: 'Checked in.' })
    expect(cin.data?.checked_in_at).toBeTruthy()

    const rows = (await s.listRsvpsForWalk(walk.id)).data ?? []
    expect(rows.find((r) => r.dog_id === ids[0])?.opted_out_at).toBeTruthy()
    expect(rows.find((r) => r.dog_id === ids[1])?.checked_in_at).toBeTruthy()
    const active = rows.filter((r) => !r.opted_out_at).sort((a, b) => a.created_at.localeCompare(b.created_at))
    expect(active.slice(0, walk.cap).map((r) => r.dog_id)).toContain(ids[walk.cap])
    expect(active.map((r) => r.dog_id)).toEqual(expect.arrayContaining([...ids.slice(1), 'd-extra']))
  })

  it('rejects check-in unless admin', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
    vi.doMock('./supabase', () => ({
      getSupabase: () => Promise.resolve({ rpc: async () => ({ data: false }) }),
    }))
    vi.resetModules()
    const s = await import('./schedule')
    expect(await s.checkIn('walk-oct2', 'dog-benny')).toMatchObject({ ok: false, message: 'Admin only.' })
  })
})
