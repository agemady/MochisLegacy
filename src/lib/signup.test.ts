import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SubmitResult } from './signup'

type Spec = {
  fn: 'submitDogSignup' | 'submitVolunteer' | 'submitPledge' | 'subscribe'
  input: Record<string, unknown>
  name: string
  keys: string[]
}

// One spec per RPC declared in supabase/schema.sql; keys = exact parameter names.
const specs: Spec[] = [
  { fn: 'submitDogSignup', input: { ownerName: 'O', email: 'o@x.co', dogName: 'Rex' }, name: 'public_submit_dog_signup',
    keys: ['p_owner_name', 'p_email', 'p_phone', 'p_dog_name', 'p_breed', 'p_age', 'p_city', 'p_notes'] },
  { fn: 'submitVolunteer', input: { name: 'V', email: 'v@x.co', skills: ['walks'] }, name: 'public_submit_volunteer',
    keys: ['p_name', 'p_email', 'p_phone', 'p_skills', 'p_interests', 'p_availability'] },
  { fn: 'submitPledge', input: { name: 'P', email: 'p@x.co', pledgeAmount: 25, frequency: 'monthly' }, name: 'public_submit_pledge',
    keys: ['p_name', 'p_email', 'p_pledge_amount', 'p_frequency', 'p_visit_request', 'p_message'] },
  { fn: 'subscribe', input: { email: 's@x.co' }, name: 'public_subscribe', keys: ['p_email'] },
]

// Minimal localStorage stub — signup may persist unsubmitted forms locally (node env lacks it).
const mem = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
})

function clearOutbox(): void {
  mem.clear()
}

afterEach(clearOutbox)

describe('signup in demo mode (env unset)', () => {
  it('every submit function returns { ok: true, demo: true } without calling rpc', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', undefined)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined)
    vi.resetModules()
    const s = await import('./signup')
    const results = await Promise.all([
      s.submitDogSignup({ ownerName: 'O', email: 'o@x.co', dogName: 'Rex' }),
      s.submitVolunteer({ name: 'V', email: 'v@x.co' }),
      s.submitPledge({ name: 'P', email: 'p@x.co' }),
      s.subscribe({ email: 's@x.co' }),
    ])
    for (const r of results) expect(r).toMatchObject({ ok: true, demo: true })
  })
})

describe('signup with env set (supabase mocked)', () => {
  const rpc = vi.fn()
  beforeEach(() => {
    clearOutbox()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
    vi.doMock('./supabase', () => ({ isSupabaseConfigured: true, supabase: { rpc } }))
    vi.resetModules()
    rpc.mockReset().mockResolvedValue({ data: 'new-uuid', error: null })
  })

  it.each(specs)('$fn calls supabase.rpc("$name") with the schema.sql argument keys', async ({ fn, input, name, keys }) => {
    const s = (await import('./signup')) as typeof import('./signup')
    const res = await (s[fn] as (i: unknown) => Promise<SubmitResult>)(input)
    expect(res.ok).toBe(true)
    expect(rpc).toHaveBeenCalledOnce()
    expect(rpc.mock.calls[0][0]).toBe(name)
    expect(Object.keys(rpc.mock.calls[0][1] as object).sort()).toEqual([...keys].sort())
  })

  it('returns ok:false with a message when rpc errors', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'row-level security blocked insert' } })
    const s = (await import('./signup')) as typeof import('./signup')
    const res = await s.subscribe({ email: 's@x.co' })
    expect(res).toMatchObject({ ok: false, demo: false, message: 'row-level security blocked insert' })
  })
})
