import { getSupabase } from './supabase'

export type Result<T> = { ok: true; data: T } | { ok: false; message: string }

/** Thrown by the demo store with user-facing text, like the SQL `raise exception`s. */
export class DemoError extends Error {}

const FALLBACK = "Couldn't reach the server. Check your connection and try again."
const OFFLINE = 'Walk sign-ups are offline right now. Please try again soon.'

/**
 * Call a mochi_* database function, or the in-memory demo store when Supabase
 * isn't configured (local dev, e2e). A production build without Supabase
 * reports offline rather than faking success.
 *
 * Every `raise exception` in supabase/schedule.sql is written for people
 * (SQLSTATE P0001), so those messages are shown as-is; anything else is
 * replaced by a generic retry message.
 */
export async function call<T>(fn: string, args: Record<string, unknown>, demo: () => T): Promise<Result<T>> {
  const supabase = await getSupabase()
  if (!supabase) {
    if (import.meta.env.PROD) return { ok: false, message: OFFLINE }
    try {
      return { ok: true, data: structuredClone(demo()) }
    } catch (e) {
      return { ok: false, message: e instanceof DemoError ? e.message : FALLBACK }
    }
  }
  try {
    const { data, error } = await supabase.rpc(fn, args)
    if (error) return { ok: false, message: error.code === 'P0001' ? error.message : FALLBACK }
    return { ok: true, data: data as T }
  } catch {
    return { ok: false, message: FALLBACK }
  }
}
