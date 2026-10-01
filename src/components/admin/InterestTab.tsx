import {
  Archive,
  CheckCircle2,
  Dog,
  HandHeart,
  HeartHandshake,
  Inbox,
  Mail,
  MailCheck,
  Newspaper,
  Phone,
  UserPlus,
} from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  approveDog,
  getInterest,
  setInterestStatus,
  type DogApplication,
  type Interest,
  type InterestKind,
  type InterestStatus,
  type Person,
  type Pledge,
  type VolunteerApplication,
} from '../../lib/admin'
import type { Notify } from './hooks'
import LinkActions from './LinkActions'
import { btnPrimary, btnQuiet, btnSecondary, cardCls, countNew, firstName, focusRing, relativeTime, telHref } from './lib'
import { Badge, ErrorNote, Loading, SectionLabel } from './ui'

type Approved = { app: DogApplication; person: Person }

const FREQ: Record<Pledge['frequency'], string> = { 'one-time': 'one time', monthly: 'a month', yearly: 'a year' }

const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n)

export default function InterestTab({
  adminKey,
  notify,
  onNewCount,
}: {
  adminKey: string
  notify: Notify
  onNewCount: (n: number) => void
}) {
  const [data, setData] = useState<Interest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [approved, setApproved] = useState<Approved[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null)

  const [tick, setTick] = useState(0)
  const load = useCallback(() => setTick((n) => n + 1), [])

  useEffect(() => {
    let live = true
    void getInterest(adminKey).then((res) => {
      if (!live) return
      if (res.ok) {
        setData(res.data)
        setError(null)
      } else setError(res.message)
    })
    return () => {
      live = false
    }
  }, [adminKey, tick])

  useEffect(() => {
    if (data) onNewCount(countNew(data))
  }, [data, onNewCount])

  /** Optimistically patch one entry's status ('archived' removes it). */
  const patch = useCallback((kind: InterestKind, id: string, status: InterestStatus) => {
    setData((d) => {
      if (!d) return d
      const fix = <T extends { id: string; status: InterestStatus }>(xs: T[]) =>
        status === 'archived' || status === 'approved'
          ? xs.filter((x) => x.id !== id)
          : xs.map((x) => (x.id === id ? { ...x, status } : x))
      return {
        ...d,
        dogs: kind === 'dog' ? fix(d.dogs) : d.dogs,
        volunteers: kind === 'volunteer' ? fix(d.volunteers) : d.volunteers,
        pledges: kind === 'pledge' ? fix(d.pledges) : d.pledges,
      }
    })
  }, [])

  const setStatus = useCallback(
    async (kind: InterestKind, item: { id: string; status: InterestStatus }, status: InterestStatus, who: string) => {
      const prev = data
      setBusy(item.id)
      setRowError(null)
      patch(kind, item.id, status)
      const res = await setInterestStatus(adminKey, kind, item.id, status)
      setBusy(null)
      if (!res.ok) {
        if (prev) setData(prev)
        setRowError({ id: item.id, message: res.message })
        notify(`Couldn’t update ${who}: ${res.message}`, { tone: 'error' })
        return
      }
      if (status === 'archived') {
        notify(`Archived ${who}.`, {
          undo: async () => {
            const back = await setInterestStatus(adminKey, kind, item.id, item.status)
            if (back.ok) load()
            else notify(back.message, { tone: 'error' })
          },
        })
      } else if (status === 'contacted') {
        notify(`Marked ${who} as contacted.`)
      }
    },
    [adminKey, data, load, notify, patch],
  )

  async function approve(app: DogApplication) {
    setBusy(app.id)
    setRowError(null)
    const res = await approveDog(adminKey, app.id)
    setBusy(null)
    if (!res.ok) {
      setRowError({ id: app.id, message: res.message })
      notify(`Couldn’t add ${app.dog_name}: ${res.message}`, { tone: 'error' })
      return
    }
    setApproved((xs) => [{ app, person: res.data }, ...xs.filter((x) => x.app.id !== app.id)])
    patch('dog', app.id, 'approved')
    notify(`${app.dog_name} and ${app.owner_name} are in the gaggle. Send the link now.`)
  }

  if (!data) {
    return error ? <ErrorNote onRetry={load}>{error}</ErrorNote> : <Loading label="Loading interest…" />
  }

  const errFor = (id: string) =>
    rowError?.id === id ? (
      <p role="alert" className="mt-3 rounded-lg bg-[#fbe4df] px-3 py-2 text-sm font-semibold text-[#8f2a1d]">
        {rowError.message}
      </p>
    ) : null

  const triage = (kind: InterestKind, item: { id: string; status: InterestStatus }, who: string) => (
    <>
      {item.status === 'new' && (
        <button
          type="button"
          disabled={busy === item.id}
          onClick={() => void setStatus(kind, item, 'contacted', who)}
          className={btnSecondary}
        >
          <MailCheck className="h-4 w-4 text-honey-dark" aria-hidden />
          Mark contacted
        </button>
      )}
      <button
        type="button"
        disabled={busy === item.id}
        onClick={() => void setStatus(kind, item, 'archived', who)}
        className={btnQuiet}
      >
        <Archive className="h-4 w-4" aria-hidden />
        Archive
      </button>
    </>
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-[1.75rem] leading-tight font-bold text-espresso">Interest</h2>
        <p className="text-[15px] text-umber">From the sign-up forms on the home page. Newest first.</p>
      </div>

      {error && <ErrorNote onRetry={load}>{error}</ErrorNote>}

      {/* Dogs */}
      <section aria-labelledby="int-dogs" className="space-y-3">
        <SectionLabel id="int-dogs" count={data.dogs.length}>
          Dogs
        </SectionLabel>

        {approved.map(({ app, person }) => (
          <article
            key={app.id}
            className="rounded-2xl bg-[#eef5f0] p-4 ring-2 ring-[#9cc4ab] sm:p-5"
            aria-label={`${app.dog_name} added to the gaggle`}
          >
            <p className="flex items-start gap-2 font-display text-xl font-semibold text-pine">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" aria-hidden />
              <span>
                {app.dog_name} and {person.name} are in the gaggle.
              </span>
            </p>
            <p className="mt-1 mb-3 text-[15px] text-umber">
              Send {firstName(person.name)} their personal link so they can sign up for walks:
            </p>
            <LinkActions person={person} showUrl onCopied={(t) => notify(t)} />
            <button
              type="button"
              onClick={() => setApproved((xs) => xs.filter((x) => x.app.id !== app.id))}
              className={`${btnQuiet} mt-2 -ml-2`}
            >
              Done
            </button>
          </article>
        ))}

        {data.dogs.length === 0 && approved.length === 0 && (
          <Empty>No new dog applications. The flyer’s QR code leads to the form.</Empty>
        )}
        {data.dogs.map((a) => (
          <article key={a.id} className={`${cardCls} p-4 sm:p-5`} aria-labelledby={`app-${a.id}`}>
            <Header
              id={`app-${a.id}`}
              icon={Dog}
              title={a.dog_name}
              status={a.status}
              when={a.created_at}
              sub={[a.breed, a.age && `${a.age}${/^\d+$/.test(a.age) ? ' yrs' : ''}`, a.city].filter(Boolean).join(' · ')}
            />
            <p className="mt-2 text-[15px] text-espresso">
              Owner: <span className="font-semibold">{a.owner_name}</span>
            </p>
            <Contact email={a.email} phone={a.phone} />
            {a.notes && <Quote>{a.notes}</Quote>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy === a.id}
                onClick={() => void approve(a)}
                className={btnPrimary}
                aria-label={`Add ${a.dog_name} (${a.owner_name}) to the gaggle`}
              >
                <UserPlus className="h-5 w-5" aria-hidden />
                {busy === a.id ? 'Adding…' : 'Add to gaggle'}
              </button>
              {triage('dog', a, a.owner_name)}
            </div>
            {errFor(a.id)}
          </article>
        ))}
      </section>

      {/* Volunteers */}
      <section aria-labelledby="int-vol" className="space-y-3">
        <SectionLabel id="int-vol" count={data.volunteers.length}>
          Volunteers
        </SectionLabel>
        {data.volunteers.length === 0 && <Empty>No new volunteers right now.</Empty>}
        {data.volunteers.map((v: VolunteerApplication) => (
          <article key={v.id} className={`${cardCls} p-4 sm:p-5`} aria-labelledby={`vol-${v.id}`}>
            <Header id={`vol-${v.id}`} icon={HandHeart} title={v.name} status={v.status} when={v.created_at} />
            <Contact email={v.email} phone={v.phone} />
            <dl className="mt-1 space-y-1 text-[15px]">
              {v.interests && <Line label="Wants to help with">{v.interests}</Line>}
              {v.availability && <Line label="Available">{v.availability}</Line>}
              {v.skills.length > 0 && <Line label="Skills">{v.skills.join(', ')}</Line>}
            </dl>
            <div className="mt-3 flex flex-wrap items-center gap-2">{triage('volunteer', v, v.name)}</div>
            {errFor(v.id)}
          </article>
        ))}
      </section>

      {/* Pledges */}
      <section aria-labelledby="int-pledge" className="space-y-3">
        <SectionLabel id="int-pledge" count={data.pledges.length}>
          Pledges
        </SectionLabel>
        <p className="text-sm text-umber">
          Pledges are promises, not payments. Nothing has been charged, and they aren’t tax-deductible until the
          501(c)(3) letter arrives.
        </p>
        {data.pledges.length === 0 && <Empty>No new pledges right now.</Empty>}
        {data.pledges.map((p) => (
          <article key={p.id} className={`${cardCls} p-4 sm:p-5`} aria-labelledby={`pl-${p.id}`}>
            <Header id={`pl-${p.id}`} icon={HeartHandshake} title={p.name} status={p.status} when={p.created_at} />
            <p className="mt-2 text-[15px] text-espresso">
              <span className="font-semibold">
                {p.pledge_amount != null ? `Pledged ${money(p.pledge_amount)} ${FREQ[p.frequency]}` : 'Pledged support'}
              </span>{' '}
              <span className="text-umber">(a promise, not a payment)</span>
            </p>
            <Contact email={p.email} phone={null} />
            {p.visit_request && (
              <dl className="mt-1 text-[15px]">
                <Line label="Visit request">{p.visit_request}</Line>
              </dl>
            )}
            {p.message && <Quote>{p.message}</Quote>}
            <div className="mt-3 flex flex-wrap items-center gap-2">{triage('pledge', p, p.name)}</div>
            {errFor(p.id)}
          </article>
        ))}
      </section>

      {/* Newsletter */}
      <section aria-labelledby="int-news" className="flex items-center gap-3 rounded-2xl bg-butter/70 p-4 ring-1 ring-sandstone">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-honey-dark">
          <Newspaper className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 id="int-news" className="text-[13px] font-bold tracking-[0.08em] text-umber uppercase">
            Newsletter
          </h3>
          <p className="text-[15px] text-espresso">
            <strong className="font-display text-2xl">{data.subscribers}</strong>{' '}
            {data.subscribers === 1 ? 'subscriber' : 'subscribers'}
          </p>
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Header({
  id,
  icon: Icon,
  title,
  status,
  when,
  sub,
}: {
  id: string
  icon: typeof Dog
  title: string
  status: InterestStatus
  when: string
  sub?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-butter text-honey-dark">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 id={id} className="font-display text-xl leading-tight font-bold text-espresso">
              {title}
            </h3>
            {status === 'new' ? <Badge tone="honey">New</Badge> : <Badge tone="plain">Contacted</Badge>}
          </div>
          <time
            dateTime={when}
            title={new Date(when).toLocaleString()}
            className="shrink-0 pt-1 text-xs font-semibold whitespace-nowrap text-umber"
          >
            {relativeTime(when)}
          </time>
        </div>
        {sub && <p className="text-sm text-umber">{sub}</p>}
      </div>
    </div>
  )
}

function Contact({ email, phone }: { email: string; phone: string | null }) {
  return (
    <div className="mt-1 flex flex-wrap gap-x-4 text-[15px]">
      <a
        href={`mailto:${email}`}
        className={`inline-flex min-h-11 min-w-0 items-center gap-1.5 rounded-lg break-all text-honey-dark underline decoration-sandstone decoration-2 underline-offset-4 hover:decoration-honey ${focusRing}`}
      >
        <Mail className="h-4 w-4 shrink-0" aria-hidden />
        {email}
      </a>
      {phone && (
        <a
          href={telHref(phone)}
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg text-honey-dark underline decoration-sandstone decoration-2 underline-offset-4 hover:decoration-honey ${focusRing}`}
        >
          <Phone className="h-4 w-4" aria-hidden />
          {phone}
        </a>
      )}
    </div>
  )
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-1.5">
      <dt className="text-umber">{label}:</dt>
      <dd className="text-espresso">{children}</dd>
    </div>
  )
}

function Quote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="mt-2 border-l-4 border-sandstone pl-3 text-[15px] text-espresso italic">{children}</blockquote>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-2xl bg-cream-soft/80 px-4 py-4 text-[15px] text-umber ring-1 ring-sandstone/70">
      <Inbox className="h-5 w-5 shrink-0 text-honey-dark" aria-hidden />
      {children}
    </p>
  )
}
