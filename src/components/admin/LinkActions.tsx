import { Check, Copy, KeyRound, Mail, MessageSquareText } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { Person } from '../../lib/admin'
import { personalLink } from '../../lib/key'
import { btn, focusRing, linkMessage, mailtoHref, smsHref } from './lib'

type Which = 'link' | 'admin'

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Send a person their personal link: copy, text (sms:), email (mailto:).
 * If the clipboard is blocked, the URL appears in a selected read-only field.
 */
export default function LinkActions({
  person,
  showUrl = false,
  onCopied,
  children,
}: {
  person: Person
  /** Show the URL itself (just added / just approved). */
  showUrl?: boolean
  onCopied?: (what: string) => void
  /** Extra controls at the end of the button row. */
  children?: ReactNode
}) {
  const url = personalLink(person.access_token)
  const adminUrl = personalLink(person.access_token, '/checkin')
  const message = linkMessage(person.name, url)
  const [copied, setCopied] = useState<Which | null>(null)
  const [revealed, setRevealed] = useState<Which | null>(showUrl ? 'link' : null)
  const [manual, setManual] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const inputId = useId()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const shownUrl = revealed === 'admin' ? adminUrl : url
  // When the link is the point (just added), the likeliest way to send it leads.
  const lead = !showUrl ? null : person.phone ? 'text' : person.email ? 'email' : 'copy'
  const cls = (which: 'copy' | 'text' | 'email' | 'admin') =>
    btn(which === lead ? 'primary' : 'secondary', 'sm')

  async function copy(which: Which) {
    const text = which === 'admin' ? adminUrl : url
    let ok = await writeClipboard(text)
    if (!ok) {
      // Fallback: show the URL selected so a long-press "Copy" works.
      setRevealed(which)
      await new Promise((r) => requestAnimationFrame(r))
      const el = inputRef.current
      if (el) {
        el.focus()
        el.setSelectionRange(0, text.length)
        try {
          // Deprecated, but still the only synchronous copy on some older phones.
          ok = document.execCommand('copy')
        } catch {
          ok = false
        }
      }
      setManual(!ok)
    }
    if (ok) {
      setManual(false)
      setCopied(which)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(null), 2500)
      onCopied?.(which === 'admin' ? `Copied ${person.name}'s admin link.` : `Copied ${person.name}'s link.`)
    }
  }

  return (
    <div className="space-y-2.5">
      {revealed && (
        <div>
          <label htmlFor={inputId} className="mb-1 block text-xs font-bold tracking-wide text-umber uppercase">
            {revealed === 'admin' ? 'Admin link' : 'Personal link'}
          </label>
          <input
            id={inputId}
            ref={inputRef}
            readOnly
            value={shownUrl}
            onFocus={(e) => e.currentTarget.select()}
            className={`block min-h-11 w-full truncate rounded-lg border border-sandstone bg-cream-soft px-3 font-mono text-[13px] text-espresso ${focusRing}`}
          />
          {manual && (
            <p className="mt-1 text-xs font-semibold text-honey-dark">
              Copying is blocked here. The link is selected: press and hold to copy it.
            </p>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => copy('link')} className={cls('copy')}>
          {copied === 'link' ? (
            <Check className={`h-4 w-4 ${lead === 'copy' ? '' : 'text-pine'}`} aria-hidden />
          ) : (
            <Copy className={`h-4 w-4 ${lead === 'copy' ? '' : 'text-honey-dark'}`} aria-hidden />
          )}
          {copied === 'link' ? 'Copied' : 'Copy link'}
        </button>
        {person.phone && (
          <a href={smsHref(person.phone, message)} className={cls('text')}>
            <MessageSquareText className={`h-4 w-4 ${lead === 'text' ? '' : 'text-honey-dark'}`} aria-hidden />
            Text link
          </a>
        )}
        {person.email && (
          <a href={mailtoHref(person.email, "Your Mochi's Legacy walk link", message)} className={cls('email')}>
            <Mail className={`h-4 w-4 ${lead === 'email' ? '' : 'text-honey-dark'}`} aria-hidden />
            Email link
          </a>
        )}
        {person.is_admin && (
          <button type="button" onClick={() => copy('admin')} className={cls('admin')}>
            {copied === 'admin' ? (
              <Check className="h-4 w-4 text-pine" aria-hidden />
            ) : (
              <KeyRound className="h-4 w-4 text-honey-dark" aria-hidden />
            )}
            {copied === 'admin' ? 'Copied' : 'Copy admin link'}
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
