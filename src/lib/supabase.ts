import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let clientPromise: Promise<SupabaseClient | null> | undefined

export function getSupabase(): Promise<SupabaseClient | null> {
  if (!supabaseUrl || !supabaseAnonKey) return Promise.resolve(null)
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(supabaseUrl, supabaseAnonKey),
    )
  }
  return clientPromise
}
