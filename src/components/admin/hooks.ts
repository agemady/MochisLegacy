import { useCallback, useEffect, useRef, useState } from 'react'

export type ToastMsg = { id: number; text: string; tone: 'ok' | 'error'; undo?: () => void }
export type Notify = (text: string, opts?: { tone?: 'ok' | 'error'; undo?: () => void }) => void

/** One toast at a time; it doubles as the polite aria-live announcer. */
export function useToast(): { toast: ToastMsg | null; notify: Notify; dismiss: () => void } {
  const [toast, setToast] = useState<ToastMsg | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current)
    setToast(null)
  }, [])
  const notify = useCallback<Notify>((text, opts = {}) => {
    window.clearTimeout(timer.current)
    setToast({ id: Date.now(), text, tone: opts.tone ?? 'ok', undo: opts.undo })
    timer.current = window.setTimeout(() => setToast(null), opts.undo ? 8000 : 4500)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return { toast, notify, dismiss }
}

/**
 * Keep data live: call `refresh` now (and whenever it changes), when the page
 * becomes visible again, and every `ms` while it is visible.
 */
export function useLiveRefresh(refresh: () => void, ms = 30_000): void {
  const latest = useRef(refresh)
  useEffect(() => {
    latest.current = refresh
    refresh()
  }, [refresh])
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') latest.current()
    }
    const id = window.setInterval(onVisible, ms)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [ms])
}
