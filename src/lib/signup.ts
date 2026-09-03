import { supabase } from './supabase'

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

const DEMO: SubmitResult = {
  ok: true,
  demo: true,
  message:
    'Demo mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to submit for real.',
}

const OFFLINE: SubmitResult = {
  ok: false,
  demo: false,
  message: 'Sign-ups are temporarily offline. Please try again soon.',
}

const FRIENDLY_ERRORS = new Set([
  'email is required',
  'invalid email address',
  'owner name is required',
  'dog name is required',
  'name is required',
  'a field is too long',
  'frequency must be one-time, monthly, or yearly',
  'pledge amount cannot be negative',
])

const FALLBACK_ERROR = 'Unable to submit right now. Please try again or email us.'

function sanitizeError(raw: string | undefined): string {
  const message = (raw ?? '').trim()
  return FRIENDLY_ERRORS.has(message) ? message : FALLBACK_ERROR
}

async function rpc(name: string, args: Record<string, unknown>): Promise<SubmitResult> {
  if (!supabase) return import.meta.env.PROD ? OFFLINE : DEMO
  const { data, error } = await supabase.rpc(name, args)
  if (error) {
    return {
      ok: false,
      demo: false,
      message: sanitizeError(error.message),
    }
  }
  return {
    ok: true,
    demo: false,
    id: typeof data === 'string' ? data : undefined,
    message: 'Thanks — we got it.',
  }
}

export function submitDogSignup(input: DogSignupInput): Promise<SubmitResult> {
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

export function submitVolunteer(input: VolunteerInput): Promise<SubmitResult> {
  return rpc('public_submit_volunteer', {
    p_name: input.name,
    p_email: input.email,
    p_phone: input.phone ?? null,
    p_skills: input.skills ?? [],
    p_interests: input.interests ?? null,
    p_availability: input.availability ?? null,
  })
}

export function submitPledge(input: PledgeInput): Promise<SubmitResult> {
  return rpc('public_submit_pledge', {
    p_name: input.name,
    p_email: input.email,
    p_pledge_amount: input.pledgeAmount ?? null,
    p_frequency: input.frequency ?? 'one-time',
    p_visit_request: input.visitRequest ?? null,
    p_message: input.message ?? null,
  })
}

export function subscribe(input: SubscribeInput): Promise<SubmitResult> {
  return rpc('public_subscribe', { p_email: input.email })
}
