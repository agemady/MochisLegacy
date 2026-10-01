import { describe, expect, it, vi } from 'vitest'
import schemaSql from '../../supabase/schema.sql?raw'
import scheduleSql from '../../supabase/schedule.sql?raw'

// Every RPC the site sends must name a function in supabase/*.sql with exactly
// matching parameter names (PostgREST resolves functions by name + argument
// names), and must supply every parameter that has no default.

type Sig = { params: string[]; required: string[] }

function signatures(): Map<string, Sig> {
  const sql = `${schemaSql}\n${scheduleSql}`
  const out = new Map<string, Sig>()
  for (const m of sql.matchAll(/create or replace function public\.(mochi_\w+)\(([\s\S]*?)\)\s*returns/g)) {
    const params: string[] = []
    const required: string[] = []
    for (const raw of m[2].split(',').map((s) => s.trim()).filter(Boolean)) {
      const name = raw.split(/\s+/)[0]
      params.push(name)
      if (!/\bdefault\b/.test(raw)) required.push(name)
    }
    out.set(m[1], { params, required })
  }
  return out
}

const calls: { fn: string; args: Record<string, unknown> }[] = []
vi.mock('./supabase', () => ({
  getSupabase: async () => ({
    rpc: async (fn: string, args: Record<string, unknown>) => {
      calls.push({ fn, args })
      return { data: null, error: null }
    },
  }),
}))

describe('site ↔ SQL function contract', () => {
  it('every schedule, admin and signup call matches a mochi_ function signature', async () => {
    const s = await import('./schedule')
    const a = await import('./admin')
    const g = await import('./signup')
    const k = 'k'
    await Promise.all([
      s.listUpcomingWalks(),
      s.getMe(k),
      s.rsvp(k, 'w', 'd', { waiverSigned: true, photoConsent: false }),
      s.optOut(k, 'w', 'd'),
      a.adminWalks(k),
      a.saveWalk(k, { id: null, title: 't', starts_at: 's', ends_at: 'e', meeting_spot: 'm', cap: 1, status: 'draft', notes: null }),
      a.getRoster(k, 'w'),
      a.mark(k, 'w', 'd', 'check_in'),
      a.listPeople(k),
      a.addOwner(k, { name: 'n' }),
      a.addDog(k, 'o', 'd'),
      a.newLink(k, 'p'),
      a.getInterest(k),
      a.setInterestStatus(k, 'dog', 'i', 'archived'),
      a.approveDog(k, 'i'),
      g.submitDogSignup({ ownerName: 'o', email: 'o@x.co', dogName: 'd' }),
      g.submitVolunteer({ name: 'v', email: 'v@x.co' }),
      g.submitPledge({ name: 'p', email: 'p@x.co' }),
      g.subscribe({ email: 's@x.co' }),
    ])

    const sigs = signatures()
    expect(calls).toHaveLength(19)
    for (const { fn, args } of calls) {
      const sig = sigs.get(fn)
      expect(sig, `${fn} is not defined in supabase/*.sql`).toBeDefined()
      const sent = Object.keys(args)
      expect(sent.filter((p) => !sig!.params.includes(p)), `${fn}: unknown params`).toEqual([])
      expect(sig!.required.filter((p) => !sent.includes(p)), `${fn}: missing required params`).toEqual([])
    }
  })
})
