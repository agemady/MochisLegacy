import { isSupabaseConfigured, supabase } from './supabase'

export type SubmitResult = {
  ok: boolean
  demo: boolean
  id?: string
  message: string
}

export type DogSignupInput = {
  ownerName: string
  email: string
  phone?: string
  dogName: string
  breed?: string
  age?: string
  city?: string
  notes?: string
}

export type VolunteerInput = {
  name: string
  email: string
  phone?: string
  skills?: string[]
  interests?: string
  availability?: string
}

export type PledgeInput = {
  name: string
  email: string
  pledgeAmount?: number
  frequency?: 'one-time' | 'monthly' | 'yearly'
  visitRequest?: string
  message?: string
}

export type SubscribeInput = {
  email: string
}

type OutboxKind = 'dog' | 'volunteer' | 'pledge' | 'subscribe'
type OutboxEntry =
  | { kind: 'dog'; payload: DogSignupInput }
  | { kind: 'volunteer'; payload: VolunteerInput }
  | { kind: 'pledge'; payload: PledgeInput }
  | { kind: 'subscribe'; payload: SubscribeInput }

const OUTBOX_KEY = 'mochislegacy-form-outbox'
const DEMO_MESSAGE =
  'Saved locally (demo mode). Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to submit for real.'

function readOutbox(): OutboxEntry[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? '[]') as OutboxEntry[]
  } catch {
    return []
  }
}

function writeOutbox(entries: OutboxEntry[]): void {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries))
}

function fail(error: { message?: string } | null): SubmitResult {
  return {
    ok: false,
    demo: false,
    message: error?.message || 'Something went wrong — please try again.',
  }
}

function ok(id: unknown, message: string): SubmitResult {
  return {
    ok: true,
    demo: false,
    id: typeof id === 'string' ? id : undefined,
    message,
  }
}

function demoSave(kind: OutboxKind, payload: OutboxEntry['payload']): SubmitResult {
  writeOutbox([...readOutbox(), { kind, payload } as OutboxEntry])
  console.info(`[Mochi's Legacy] demo ${kind} stored locally`, payload)
  return { ok: true, demo: true, message: DEMO_MESSAGE }
}

async function rpc(name: string, args: Record<string, unknown>): Promise<SubmitResult> {
  if (!supabase) {
    return { ok: false, demo: true, message: 'Supabase is not configured.' }
  }
  const { data, error } = await supabase.rpc(name, args)
  if (error) return fail(error)
  return ok(data, 'Thanks — we got it.')
}

export async function submitDogSignup(input: DogSignupInput): Promise<SubmitResult> {
  if (!isSupabaseConfigured) return demoSave('dog', input)
  return rpc('public_submit_dog_signup', {
    p_owner_name: input.ownerName,
    p_email: input.email,
    p_phone: input.phone ?? null,
    p_dog_name: input.dogName,
    p_breed: input.breed ?? null,
    p_age: input.age ?? null,
    p_city: input.city ?? null,
    p_notes: input.notes ?? null,
  })
}

export async function submitVolunteer(input: VolunteerInput): Promise<SubmitResult> {
  if (!isSupabaseConfigured) return demoSave('volunteer', input)
  return rpc('public_submit_volunteer', {
    p_name: input.name,
    p_email: input.email,
    p_phone: input.phone ?? null,
    p_skills: input.skills ?? [],
    p_interests: input.interests ?? null,
    p_availability: input.availability ?? null,
  })
}

export async function submitPledge(input: PledgeInput): Promise<SubmitResult> {
  if (!isSupabaseConfigured) return demoSave('pledge', input)
  return rpc('public_submit_pledge', {
    p_name: input.name,
    p_email: input.email,
    p_pledge_amount: input.pledgeAmount ?? null,
    p_frequency: input.frequency ?? 'one-time',
    p_visit_request: input.visitRequest ?? null,
    p_message: input.message ?? null,
  })
}

export async function subscribe(input: SubscribeInput): Promise<SubmitResult> {
  if (!isSupabaseConfigured) return demoSave('subscribe', input)
  return rpc('public_subscribe', {
    p_email: input.email,
  })
}

async function flushEntry(entry: OutboxEntry): Promise<boolean> {
  const result =
    entry.kind === 'dog'
      ? await submitDogSignup(entry.payload)
      : entry.kind === 'volunteer'
        ? await submitVolunteer(entry.payload)
        : entry.kind === 'pledge'
          ? await submitPledge(entry.payload)
          : await subscribe(entry.payload)
  return result.ok && !result.demo
}

export async function flushFormOutbox(): Promise<void> {
  if (!isSupabaseConfigured) return
  const remaining: OutboxEntry[] = []
  for (const entry of readOutbox()) {
    if (!(await flushEntry(entry))) remaining.push(entry)
  }
  writeOutbox(remaining)
}

if (isSupabaseConfigured) {
  void flushFormOutbox()
}
