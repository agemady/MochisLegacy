import { CalendarCheck, CalendarPlus, Clock, Eye, EyeOff, Flag, MapPin, Pencil, Send, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { saveWalk, type WalkInput } from '../../lib/admin'
import type { Walk, WalkStatus } from '../../lib/schedule'
import { denverDay, denverLocalToIso, formatWalkWindow, isoToDenverLocal } from '../../lib/time'
import type { Notify } from './hooks'
import {
  addDays,
  btnPrimary,
  btnClose,
  btnQuiet,
  btnSecondary,
  cardCls,
  inputBad,
  inputCls,
  labelCls,
  prefersReducedMotion,
} from './lib'
import { Badge, EmptyState, ErrorNote, SectionLabel } from './ui'

const SPOT = 'Foothills Community Park, Shelter A'

const toInput = (w: Walk, status: WalkStatus = w.status): WalkInput => ({
  id: w.id,
  title: w.title,
  starts_at: w.starts_at,
  ends_at: w.ends_at,
  meeting_spot: w.meeting_spot,
  cap: w.cap,
  status,
  notes: w.notes,
})

function StatusChip({ status }: { status: WalkStatus }) {
  if (status === 'draft')
    return (
      <Badge tone="honey" icon={EyeOff}>
        Draft
      </Badge>
    )
  if (status === 'published')
    return (
      <Badge tone="ok" icon={Eye}>
        Published
      </Badge>
    )
  return (
    <Badge tone="plain" icon={Flag}>
      Done
    </Badge>
  )
}

type Editing = { mode: 'new' } | { mode: 'edit'; walk: Walk }

export default function WalksTab({
  adminKey,
  walks,
  reload,
  notify,
  onOpenWalkDay,
}: {
  adminKey: string
  walks: Walk[]
  reload: () => Promise<void>
  notify: Notify
  onOpenWalkDay: (id: string) => void
}) {
  const [editing, setEditing] = useState<Editing | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (editing) formRef.current?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [editing])

  const upcoming = walks
    .filter((w) => w.status !== 'draft' && Date.parse(w.ends_at) > now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const drafts = walks.filter((w) => w.status === 'draft').sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const recent = walks
    .filter((w) => w.status !== 'draft' && Date.parse(w.ends_at) <= now)
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at))

  async function setStatus(w: Walk, status: WalkStatus) {
    setBusy(w.id)
    setRowError(null)
    const res = await saveWalk(adminKey, toInput(w, status))
    setBusy(null)
    if (!res.ok) {
      setRowError({ id: w.id, message: res.message })
      return
    }
    await reload()
    if (status === 'published') {
      notify(`${w.title} is published. Owners can sign up now.`, {
        undo: () => void saveWalk(adminKey, toInput(w, w.status)).then(() => reload()),
      })
    } else if (status === 'done') notify(`${w.title} is marked done.`)
  }

  const item = (w: Walk) => {
    const past = Date.parse(w.ends_at) <= now
    return (
      <li key={w.id} className={`${cardCls} p-4 sm:p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl leading-tight font-bold text-espresso">{w.title}</h3>
            <p className="mt-1 flex items-start gap-1.5 text-[15px] text-espresso">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-honey-dark" aria-hidden />
              {formatWalkWindow(w.starts_at, w.ends_at)}
            </p>
            <p className="mt-0.5 flex items-start gap-1.5 text-sm text-umber">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-honey-dark" aria-hidden />
              {w.meeting_spot}
            </p>
          </div>
          <StatusChip status={w.status} />
        </div>
        <p className="mt-2 text-sm text-umber">
          <strong className="text-espresso">
            {w.confirmed}/{w.cap}
          </strong>{' '}
          confirmed · <strong className="text-espresso">{w.waitlisted}</strong> waitlist ·{' '}
          <strong className="text-espresso">{w.opted_out}</strong> out
          {(past || w.checked_in > 0) && (
            <>
              {' '}
              · <strong className="text-pine">{w.checked_in}</strong> came
            </>
          )}
        </p>
        {w.status === 'draft' && (
          <p className="mt-1 text-sm font-medium text-honey-dark">Owners can’t see this walk until you publish it.</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {w.status === 'draft' && (
            <button
              type="button"
              disabled={busy === w.id}
              onClick={() => void setStatus(w, 'published')}
              className={btnPrimary}
              aria-label={`Publish ${w.title}, ${formatWalkWindow(w.starts_at, w.ends_at)}`}
            >
              <Send className="h-4 w-4" aria-hidden />
              Publish
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing({ mode: 'edit', walk: w })}
            className={btnSecondary}
            aria-label={`Edit ${w.title}, ${formatWalkWindow(w.starts_at, w.ends_at)}`}
          >
            <Pencil className="h-4 w-4 text-honey-dark" aria-hidden />
            Edit
          </button>
          {w.status !== 'draft' && (
            <button type="button" onClick={() => onOpenWalkDay(w.id)} className={btnSecondary}>
              <CalendarCheck className="h-4 w-4 text-honey-dark" aria-hidden />
              Walk day
            </button>
          )}
          {w.status === 'published' && past && (
            <button
              type="button"
              disabled={busy === w.id}
              onClick={() => void setStatus(w, 'done')}
              className={btnQuiet}
            >
              <Flag className="h-4 w-4" aria-hidden />
              Mark done
            </button>
          )}
        </div>
        {rowError?.id === w.id && (
          <div className="mt-3">
            <ErrorNote>{rowError.message}</ErrorNote>
          </div>
        )}
      </li>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.75rem] leading-tight font-bold text-espresso">Walks</h2>
          <p className="text-[15px] text-umber">All times are Mountain Time.</p>
        </div>
        {!editing && (
          <button type="button" onClick={() => setEditing({ mode: 'new' })} className={btnPrimary}>
            <CalendarPlus className="h-5 w-5" aria-hidden />
            New walk
          </button>
        )}
      </div>

      {editing && (
        <div ref={formRef} className="scroll-mt-4">
          <WalkForm
            key={editing.mode === 'edit' ? editing.walk.id : 'new'}
            adminKey={adminKey}
            walk={editing.mode === 'edit' ? editing.walk : null}
            latest={walks}
            onCancel={() => setEditing(null)}
            onSaved={async (w, wasPublished) => {
              setEditing(null)
              await reload()
              if (w.status === 'published' && !wasPublished) notify(`${w.title} is published. Owners can sign up now.`)
              else if (w.status === 'draft') notify('Draft saved. Only founders can see it.')
              else notify('Walk saved.')
            }}
          />
        </div>
      )}

      {walks.length === 0 && !editing ? (
        <EmptyState icon={CalendarPlus} title="No walks yet">
          Create a walk, then publish it so owners can sign up with their links.
        </EmptyState>
      ) : (
        <>
          <Group title="Upcoming" items={upcoming} render={item} empty="No published walks coming up." />
          {drafts.length > 0 && <Group title="Drafts" items={drafts} render={item} />}
          {recent.length > 0 && <Group title="Recent" items={recent} render={item} />}
        </>
      )}
    </div>
  )
}

function Group({
  title,
  items,
  render,
  empty,
}: {
  title: string
  items: Walk[]
  render: (w: Walk) => ReactNode
  empty?: string
}) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-2.5">
      <SectionLabel id={id} count={items.length}>
        {title}
      </SectionLabel>
      {items.length ? (
        <ul className="space-y-3">{items.map(render)}</ul>
      ) : (
        empty && <p className="rounded-2xl bg-cream-soft/80 px-4 py-4 text-[15px] text-umber ring-1 ring-sandstone/70">{empty}</p>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: WalkStatus; label: string; hint: string }[] = [
  { value: 'draft', label: 'Draft', hint: 'Only founders see it' },
  { value: 'published', label: 'Published', hint: 'Owners can sign up' },
  { value: 'done', label: 'Done', hint: 'The walk is over' },
]

function defaults(walks: Walk[]): { date: string; start: string; end: string } {
  const last = [...walks].sort((a, b) => b.starts_at.localeCompare(a.starts_at))[0]
  const tomorrow = addDays(denverDay(new Date()), 1)
  if (!last) return { date: tomorrow, start: '09:00', end: '10:00' }
  const s = isoToDenverLocal(last.starts_at)
  const e = isoToDenverLocal(last.ends_at)
  const next = addDays(s.date, 7)
  return { date: next > tomorrow ? next : tomorrow, start: s.time, end: e.time }
}

function WalkForm({
  adminKey,
  walk,
  latest,
  onCancel,
  onSaved,
}: {
  adminKey: string
  walk: Walk | null
  latest: Walk[]
  onCancel: () => void
  onSaved: (w: Walk, wasPublished: boolean) => void | Promise<void>
}) {
  const init = walk
    ? {
        date: isoToDenverLocal(walk.starts_at).date,
        start: isoToDenverLocal(walk.starts_at).time,
        end: isoToDenverLocal(walk.ends_at).time,
      }
    : defaults(latest)
  const [title, setTitle] = useState(walk?.title ?? 'Gaggle walk')
  const [date, setDate] = useState(init.date)
  const [start, setStart] = useState(init.start)
  const [end, setEnd] = useState(init.end)
  const [spot, setSpot] = useState(walk?.meeting_spot ?? SPOT)
  const [cap, setCap] = useState(String(walk?.cap ?? 15))
  const [notes, setNotes] = useState(walk?.notes ?? '')
  const [status, setStatus] = useState<WalkStatus>(walk?.status ?? 'draft')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const id = useId()
  const f = (k: string) => `${id}-${k}`

  const capN = Number(cap)
  const timeError = start && end && end <= start ? 'The end time needs to be after the start time.' : null
  const capError = !Number.isInteger(capN) || capN < 1 || capN > 200 ? 'Capacity must be between 1 and 200 dogs.' : null
  const missing = !date ? 'Pick a date.' : !start || !end ? 'Add a start and end time.' : !spot.trim() ? 'Add a meeting spot.' : null
  const bumped = walk && !capError && capN < walk.confirmed ? walk.confirmed - capN : 0
  const wasPublished = walk?.status === 'published'

  const submitLabel =
    status === 'published'
      ? wasPublished
        ? 'Save changes'
        : 'Publish walk'
      : status === 'draft'
        ? 'Save draft'
        : 'Save walk'

  async function submit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    const problem = missing ?? timeError ?? capError
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError(null)
    const res = await saveWalk(adminKey, {
      id: walk?.id ?? null,
      title: title.trim() || 'Gaggle walk',
      starts_at: denverLocalToIso(date, start),
      ends_at: denverLocalToIso(date, end),
      meeting_spot: spot.trim(),
      cap: capN,
      status,
      notes: notes.trim() || null,
    })
    setSaving(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    await onSaved(res.data, wasPublished)
  }

  return (
    <form onSubmit={submit} noValidate className={`${cardCls} space-y-4 p-4 ring-2 ring-honey/50 sm:p-5`} aria-labelledby={f('h')}>
      <div className="flex items-center justify-between gap-2">
        <h3 id={f('h')} className="font-display text-xl font-semibold text-espresso">
          {walk ? 'Edit walk' : 'New walk'}
        </h3>
        <button type="button" onClick={onCancel} aria-label="Close the form" className={btnClose}>
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div>
        <label htmlFor={f('title')} className={labelCls}>
          Title
        </label>
        <input id={f('title')} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={f('date')} className={labelCls}>
            Date
          </label>
          <input
            id={f('date')}
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor={f('start')} className={labelCls}>
            Starts
          </label>
          <input
            id={f('start')}
            type="time"
            required
            step={300}
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor={f('end')} className={labelCls}>
            Ends
          </label>
          <input
            id={f('end')}
            type="time"
            required
            step={300}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            aria-invalid={!!timeError}
            aria-describedby={timeError ? f('end-err') : undefined}
            className={timeError ? inputBad : inputCls}
          />
        </div>
        <p className="col-span-2 -mt-1 text-xs text-umber sm:col-span-3">Mountain Time (Boulder).</p>
        {timeError && (
          <p id={f('end-err')} className="col-span-2 -mt-2 text-sm font-semibold text-[#8f2a1d] sm:col-span-3">
            {timeError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={f('spot')} className={labelCls}>
          Meeting spot
        </label>
        <input id={f('spot')} value={spot} onChange={(e) => setSpot(e.target.value)} maxLength={160} className={inputCls} />
      </div>

      <div>
        <label htmlFor={f('cap')} className={labelCls}>
          Capacity <span className="font-normal text-umber">(dogs)</span>
        </label>
        <input
          id={f('cap')}
          type="number"
          inputMode="numeric"
          min={1}
          max={200}
          value={cap}
          onChange={(e) => setCap(e.target.value)}
          aria-invalid={touched && !!capError}
          className={`${inputCls} max-w-32`}
        />
        {bumped > 0 && (
          <p className="mt-1.5 text-sm font-semibold text-honey-dark">
            {walk?.confirmed} dogs are confirmed: {bumped === 1 ? '1 dog moves' : `${bumped} dogs move`} to the waitlist.
          </p>
        )}
      </div>

      <div>
        <label htmlFor={f('notes')} className={labelCls}>
          What to bring <span className="font-normal text-umber">(owners see this)</span>
        </label>
        <textarea
          id={f('notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Leash, water, poop bags…"
          className={`${inputCls} py-3`}
        />
      </div>

      <fieldset>
        <legend className={labelCls}>Status</legend>
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-cream-soft p-1.5 ring-1 ring-sandstone">
          {STATUS_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`relative flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-xl px-1.5 py-2 text-center has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-honey/60 ${
                status === o.value ? 'bg-espresso text-cream-soft shadow-sm' : 'text-espresso hover:bg-butter'
              }`}
            >
              <input
                type="radio"
                name={f('status')}
                value={o.value}
                checked={status === o.value}
                onChange={() => setStatus(o.value)}
                className="sr-only"
              />
              <span className="text-[15px] font-bold">{o.label}</span>
              <span className={`text-xs leading-tight ${status === o.value ? 'text-cream-soft/85' : 'text-umber'}`}>
                {o.hint}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-sm text-umber">
          {status === 'draft'
            ? 'Owners won’t see this walk until it’s published.'
            : status === 'published'
              ? 'Owners see it on their sign-up page right away.'
              : 'Done walks stay in the history; sign-ups are closed.'}
        </p>
      </fieldset>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {status === 'published' && !wasPublished ? (
            <Send className="h-5 w-5" aria-hidden />
          ) : (
            <CalendarCheck className="h-5 w-5" aria-hidden />
          )}
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={btnQuiet}>
          Cancel
        </button>
      </div>
    </form>
  )
}
