import { AlertCircle, CheckCircle2, LoaderCircle, RotateCcw, X, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ToastMsg } from './hooks'
import { btnSecondary, cardCls, focusRing } from './lib'

/** Bottom toast + polite live region. Always mounted so screen readers hear every update. */
export function Toast({ toast, onDismiss }: { toast: ToastMsg | null; onDismiss: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div role="status" aria-live="polite" aria-atomic="true" className="w-full max-w-md">
        {toast && (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl py-2 pr-2 pl-4 text-[15px] font-semibold shadow-[0_18px_40px_-12px_rgba(41,24,12,0.55)] motion-safe:animate-fade-up ${
              toast.tone === 'error' ? 'bg-[#8f2a1d] text-white' : 'bg-espresso text-cream-soft'
            }`}
          >
            {toast.tone === 'error' ? (
              <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#9fd3b4]" aria-hidden />
            )}
            <span className="min-w-0 flex-1 py-2">{toast.text}</span>
            {toast.undo && (
              <button
                type="button"
                onClick={() => {
                  toast.undo?.()
                  onDismiss()
                }}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 font-bold text-[#ffd27a] hover:bg-white/10 ${focusRing}`}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Undo
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl opacity-80 hover:bg-white/10 hover:opacity-100 ${focusRing}`}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const tones = {
  warn: 'bg-[#fbe4df] text-[#8f2a1d] ring-[#efb3a7]',
  ok: 'bg-[#e3efe7] text-pine ring-[#b9d6c4]',
  honey: 'bg-butter text-honey-dark ring-sandstone',
  plain: 'bg-cream-soft text-umber ring-sandstone',
  ink: 'bg-espresso text-cream-soft ring-espresso',
} as const

export function Badge({
  tone = 'plain',
  icon: Icon,
  children,
}: {
  tone?: keyof typeof tones
  icon?: LucideIcon
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] leading-none font-bold ring-1 ring-inset ${tones[tone]}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />}
      {children}
    </span>
  )
}

/** Small uppercase section label with a count. */
export function SectionLabel({ children, count, id }: { children: ReactNode; count?: number; id?: string }) {
  return (
    <h3 id={id} className="flex items-baseline gap-2 text-[13px] font-bold tracking-[0.08em] text-umber uppercase">
      {children}
      {count !== undefined && (
        <span className="rounded-full bg-butter px-2 py-0.5 text-xs tracking-normal text-honey-dark">{count}</span>
      )}
    </h3>
  )
}

export function ErrorNote({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-[#fbe4df] px-3.5 py-2.5 text-sm font-semibold text-[#8f2a1d] ring-1 ring-[#efb3a7] ring-inset"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">{children}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className={btnSecondary}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Try again
        </button>
      )}
    </div>
  )
}

export function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-umber" role="status">
      <LoaderCircle className="h-5 w-5 motion-safe:animate-spin" aria-hidden />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className={`${cardCls} flex flex-col items-center gap-2 px-6 py-8 text-center`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-butter text-honey-dark">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <p className="font-display text-lg font-semibold text-espresso">{title}</p>
      {children && <div className="max-w-sm text-sm text-umber">{children}</div>}
    </div>
  )
}
