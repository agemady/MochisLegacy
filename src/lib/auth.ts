import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase } from './supabase'

export async function signInWithOtp(email: string): Promise<{ error: string | null }> {
  const supabase = await getSupabase()
  if (!supabase) return { error: 'Supabase is not configured.' }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + '/schedule' },
  })
  return { error: error?.message ?? null }
}

export async function signOut(): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return
  await supabase.auth.signOut()
}

export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let unsub: (() => void) | undefined
    void getSupabase().then((supabase) => {
      if (cancelled) return
      if (!supabase) {
        setLoading(false)
        return
      }
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, next) => {
        if (!cancelled) {
          setSession(next)
          setLoading(false)
        }
      })
      if (cancelled) subscription.unsubscribe()
      else unsub = () => subscription.unsubscribe()
    })
    return () => {
      cancelled = true
      unsub?.()
    }
  }, [])

  return { session, loading }
}
