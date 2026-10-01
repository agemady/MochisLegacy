import {
  CalendarCheck,
  CalendarDays,
  Inbox,
  KeyRound,
  LogOut,
  RotateCcw,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { adminWalks, getInterest } from '../../lib/admin'
import { forgetKey, getKey } from '../../lib/key'
import { getMe, type Walk } from '../../lib/schedule'
import PageTop from '../PageTop'
import GaggleTab from './GaggleTab'
import { useToast } from './hooks'
import InterestTab from './InterestTab'
import { btnPrimary, btnQuiet, btnSecondary, cardCls, countNew, focusRing, pickDefaultWalk } from './lib'
import { Loading, Toast } from './ui'
import WalkDayTab from './WalkDayTab'
import WalksTab from './WalksTab'

type Tab = 'walkday' | 'gaggle' | 'interest' | 'walks'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'walkday', label: 'Walk day', icon: CalendarCheck },
  { id: 'gaggle', label: 'Gaggle', icon: Users },
  { id: 'interest', label: 'Interest', icon: Inbox },
  { id: 'walks', label: 'Walks', icon: CalendarDays },
]

/** `#tab=gaggle` → 'gaggle'. Read only after getKey() has taken any `#k=` out of the URL. */
function readTab(): Tab {
  const m = /(?:^#|&)tab=([a-z]+)/.exec(window.location.hash)
  const t = m?.[1]
  return TABS.some((x) => x.id === t) ? (t as Tab) : 'walkday'
}

function writeTab(t: Tab): void {
  const { pathname, search } = window.location
  history.replaceState(null, '', `${pathname}${search}${t === 'walkday' ? '' : `#tab=${t}`}`)
}

type Gate =
  | { state: 'checking' }
  | { state: 'denied'; message: string; owner: boolean }
  | { state: 'ok'; name: string | null }

/** /checkin (alias /admin): founders' walk-day check-in, gaggle roster, interest, and walks. */
export default function AdminPage() {
  // Order matters: getKey() strips `#k=…` from the URL before the tab is read.
  const [key, setKey] = useState<string | null>(() => getKey())
  const [tab, setTab] = useState<Tab>(readTab)
  const [gate, setGate] = useState<Gate>({ state: 'checking' })
  const [walks, setWalks] = useState<Walk[]>([])
  const [walkId, setWalkId] = useState<string | null>(null)
  const [newCount, setNewCount] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const { toast, notify, dismiss } = useToast()
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ walkday: null, gaggle: null, interest: null, walks: null })

  useEffect(() => {
    if (!key) return
    let live = true
    void Promise.all([adminWalks(key), getMe(key)]).then(([w, me]) => {
      if (!live) return
      if (!w.ok) {
        setGate({ state: 'denied', message: w.message, owner: me.ok && !me.data.person.is_admin })
        return
      }
      setWalks(w.data)
      setWalkId((id) => (id && w.data.some((x) => x.id === id) ? id : (pickDefaultWalk(w.data)?.id ?? null)))
      setGate({ state: 'ok', name: me.ok ? me.data.person.name : null })
      void getInterest(key).then((i) => {
        if (live && i.ok) setNewCount(countNew(i.data))
      })
    })
    return () => {
      live = false
    }
  }, [key, attempt])

  const reloadWalks = useCallback(async () => {
    if (!key) return
    const res = await adminWalks(key)
    if (res.ok) {
      setWalks(res.data)
      setWalkId((id) => (id && res.data.some((x) => x.id === id) ? id : (pickDefaultWalk(res.data)?.id ?? null)))
    }
  }, [key])

  const selectTab = useCallback((t: Tab, focus = false) => {
    setTab(t)
    writeTab(t)
    if (focus) tabRefs.current[t]?.focus()
  }, [])

  const forget = () => {
    forgetKey()
    setKey(null)
    setGate({ state: 'checking' })
  }

  /** A founder made a new link for themselves: switch this page to it. */
  const adoptKey = useCallback(
    (token: string) => {
      const { pathname, search } = window.location
      history.replaceState(null, '', `${pathname}${search}#k=${token}`)
      const next = getKey()
      writeTab(tab)
      setKey(next)
    },
    [tab],
  )

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.findIndex((t) => t.id === tab)
    const go = (j: number) => {
      e.preventDefault()
      selectTab(TABS[(j + TABS.length) % TABS.length].id, true)
    }
    if (e.key === 'ArrowRight') go(i + 1)
    else if (e.key === 'ArrowLeft') go(i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(TABS.length - 1)
  }

  let body: ReactNode
  if (!key) {
    body = (
      <GateCard icon={KeyRound} title="Open your personal admin link">
        <p>
          These walk-day tools are for Mochi’s Legacy founders. Open the personal admin link you were sent (it ends in{' '}
          <code className="rounded bg-butter px-1.5 py-0.5 text-[0.9em] text-espresso">#k=…</code>) on this phone, and
          it will remember you.
        </p>
        <p className="mt-3">Lost it? Another founder can make you a new one from the Gaggle tab.</p>
      </GateCard>
    )
  } else if (gate.state === 'checking') {
    body = <Loading label="Checking your link…" />
  } else if (gate.state === 'denied') {
    body = (
      <GateCard
        icon={ShieldAlert}
        title={gate.owner ? 'This link is for walk sign-ups' : 'This link can’t open the walk tools'}
      >
        <p className="font-semibold text-espresso" role="alert">
          {gate.message}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {gate.owner ? (
            <a href="/schedule" className={btnPrimary}>
              <CalendarCheck className="h-5 w-5" aria-hidden />
              Go to walk sign-ups
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                setGate({ state: 'checking' })
                setAttempt((n) => n + 1)
              }}
              className={btnSecondary}
            >
              <RotateCcw className="h-4 w-4 text-honey-dark" aria-hidden />
              Try again
            </button>
          )}
          <button type="button" onClick={forget} className={gate.owner ? btnQuiet : btnSecondary}>
            <LogOut className="h-4 w-4 text-honey-dark" aria-hidden />
            Forget this link
          </button>
        </div>
      </GateCard>
    )
  } else {
    body = (
      <>
        <h1 className="sr-only">Founders’ walk tools</h1>
        <div
          role="tablist"
          aria-label="Walk tools"
          className="mt-5 grid grid-cols-4 gap-1 rounded-2xl bg-white/75 p-1 shadow-[0_8px_24px_-18px_rgba(41,24,12,0.5)] ring-1 ring-sandstone backdrop-blur-sm"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const selected = tab === id
            return (
              <button
                key={id}
                ref={(el) => {
                  tabRefs.current[id] = el
                }}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={selected}
                aria-controls="admin-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(id)}
                onKeyDown={onTabKey}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[13px] leading-tight font-bold sm:flex-row sm:gap-2 sm:text-[15px] motion-safe:transition-colors ${focusRing} ${
                  selected
                    ? 'bg-espresso text-cream-soft shadow-[0_6px_14px_-6px_rgba(41,24,12,0.7)]'
                    : 'text-umber hover:bg-butter hover:text-espresso'
                }`}
              >
                <Icon className={`h-5 w-5 ${selected ? 'text-[#ffc861]' : 'text-honey-dark'}`} aria-hidden />
                <span>{label}</span>
                {id === 'interest' && newCount > 0 && (
                  <span className="absolute top-1 right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c23a2b] px-1 text-[11px] font-bold text-white sm:static">
                    {newCount}
                    <span className="sr-only"> new</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div role="tabpanel" id="admin-panel" aria-labelledby={`tab-${tab}`} className="mt-5">
          {tab === 'walkday' && (
            <WalkDayTab
              adminKey={key}
              walks={walks}
              walkId={walkId}
              onWalkId={setWalkId}
              notify={notify}
              onGoWalks={() => selectTab('walks')}
            />
          )}
          {tab === 'gaggle' && <GaggleTab adminKey={key} notify={notify} onOwnLinkChanged={adoptKey} />}
          {tab === 'interest' && <InterestTab adminKey={key} notify={notify} onNewCount={setNewCount} />}
          {tab === 'walks' && (
            <WalksTab
              adminKey={key}
              walks={walks}
              reload={reloadWalks}
              notify={notify}
              onOpenWalkDay={(id) => {
                setWalkId(id)
                selectTab('walkday')
                window.scrollTo({ top: 0 })
              }}
            />
          )}
        </div>

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-2 border-t border-sandstone/80 pt-3 text-sm text-umber">
          <span>{gate.name ? `Using ${gate.name}’s admin link on this device.` : 'Using an admin link on this device.'}</span>
          <button type="button" onClick={forget} className={btnQuiet}>
            <LogOut className="h-4 w-4" aria-hidden />
            Forget this link
          </button>
        </footer>
      </>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pt-5 pb-32 sm:pt-8">
      <PageTop />
      {body}
      <Toast toast={toast} onDismiss={dismiss} />
    </main>
  )
}

function GateCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className={`${cardCls} mt-10 p-6 sm:p-8`} aria-labelledby="gate-h">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-butter text-honey-dark">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h1 id="gate-h" className="mt-4 font-display text-3xl leading-tight font-bold text-espresso">
        {title}
      </h1>
      <div className="mt-3 text-[17px] leading-relaxed text-umber">{children}</div>
    </section>
  )
}
