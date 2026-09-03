import { beforeEach, describe, expect, it, vi } from 'vitest'
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

describe('signup in demo mode (env unset)', () => {
  it('every submit function returns { ok: true, demo: true } without calling rpc', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', undefined)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined)
    vi.stubEnv('PROD', false)
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

describe('signup in production with supabase unconfigured', () => {
  it('returns ok:false with the offline message, not a fake success', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', undefined)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined)
    vi.stubEnv('PROD', true)
    vi.resetModules()
    const s = await import('./signup')
    const results = await Promise.all([
      s.submitDogSignup({ ownerName: 'O', email: 'o@x.co', dogName: 'Rex' }),
      s.submitVolunteer({ name: 'V', email: 'v@x.co' }),
      s.submitPledge({ name: 'P', email: 'p@x.co' }),
      s.subscribe({ email: 's@x.co' }),
    ])
    for (const r of results) {
      expect(r).toEqual({
        ok: false,
        demo: false,
        message: 'Sign-ups are temporarily offline. Please try again soon.',
      })
    }
  })
})

describe('signup with env set (supabase mocked)', () => {
  const rpc = vi.fn()
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
    vi.doMock('./supabase', () => ({ supabase: { rpc } }))
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

  it('passes through friendly RPC validation messages', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'invalid email address' } })
    const s = (await import('./signup')) as typeof import('./signup')
    const res = await s.subscribe({ email: 'nope' })
    expect(res).toMatchObject({ ok: false, demo: false, message: 'invalid email address' })
  })

  it('sanitizes unexpected rpc errors to a generic fallback', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'row-level security blocked insert' } })
    const s = (await import('./signup')) as typeof import('./signup')
    const res = await s.subscribe({ email: 's@x.co' })
    expect(res).toMatchObject({
      ok: false,
      demo: false,
      message: 'Unable to submit right now. Please try again or email us.',
    })
  })
})
