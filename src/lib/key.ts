// Personal links: `/schedule#k=<32 hex>` (owners) or `/checkin#k=<...>` (admins).
// The key lives in the URL fragment so it never reaches a server log or a
// Referer header; on first load it moves to localStorage and leaves the URL.

const STORAGE = 'mochi-key'
const KEY_RE = /^[0-9a-f]{32}$/

function store(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

let memory: string | null = null

/** Pull `#k=…` out of the address bar (if present) and remember it. */
export function captureKeyFromUrl(): void {
  const m = /^#k=([0-9a-f]{32})$/.exec(window.location.hash)
  if (!m) return
  memory = m[1]
  try {
    store()?.setItem(STORAGE, m[1])
  } catch {
    // Private mode: keep it in memory for this visit.
  }
  history.replaceState(null, '', window.location.pathname + window.location.search)
}

export function getKey(): string | null {
  captureKeyFromUrl()
  if (memory) return memory
  let saved: string | null = null
  try {
    saved = store()?.getItem(STORAGE) ?? null
  } catch {
    saved = null
  }
  memory = saved && KEY_RE.test(saved) ? saved : null
  return memory
}

export function forgetKey(): void {
  memory = null
  try {
    store()?.removeItem(STORAGE)
  } catch {
    // nothing stored
  }
}

/** The shareable personal link for a token. */
export function personalLink(token: string, path: '/schedule' | '/checkin' = '/schedule'): string {
  return `${window.location.origin}${path}#k=${token}`
}
