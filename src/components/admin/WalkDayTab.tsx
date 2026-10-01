import {
  Backpack,
  Camera,
  CameraOff,
  Check,
  CheckCircle2,
  Clock,
  FileWarning,
  ListOrdered,
  MapPin,
  PartyPopper,
  Phone,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  UserX,
} from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { getRoster, listPeople, mark, type MarkAction, type Person, type Roster, type RosterRow } from '../../lib/admin'
import type { Walk } from '../../lib/schedule'
import { denverDay, formatWalkWindow } from '../../lib/time'
import { useLiveRefresh, type Notify } from './hooks'
import {
  applyMark,
  btn,
  btnPrimary,
  btnQuiet,
  btnSecondary,
  cardCls,
  clockTime,
  countsOf,
  focusRing,
  groupRoster,
  inputCls,
  labelCls,
  quiet,
  restand,
  telHref,
} from './lib'
import { Badge, EmptyState, ErrorNote, Loading, SectionLabel } from './ui'

type Confirm = { dogId: string; kind: 'opt_out' | 'waiver_check_in' }

const statusNote: Record<Walk['status'], string> = {
  draft: 'Draft · owners can’t see it',
  published: 'Published',
  done: 'Done',
}

function walkOptionLabel(w: Walk, all: Walk[]): string {
  const tag = w.status === 'draft' ? ' (draft)' : w.status === 'done' ? ' (done)' : ''
  const [day, time] = formatWalkWindow(w.starts_at, w.ends_at).split(' · ')
  const shared = all.some((x) => x.id !== w.id && denverDay(x.starts_at) === denverDay(w.starts_at))
  return `${day}${shared ? `, ${time}` : ''} · ${w.title}${tag}`
}

/** "Today" / "Tomorrow" / "Ended" chip for the selected walk. */
function dayChip(w: Walk): { text: string; tone: 'ok' | 'honey' | 'plain' } | null {
  const now = new Date()
  const today = denverDay(now)
  const day = denverDay(w.starts_at)
  if (day === today) return { text: Date.parse(w.ends_at) < now.getTime() ? 'Today · ended' : 'Today', tone: 'ok' }
  if (day === denverDay(new Date(now.getTime() + 86_400_000))) return { text: 'Tomorrow', tone: 'honey' }
  if (Date.parse(w.ends_at) < now.getTime()) return { text: 'Ended', tone: 'plain' }
  return null
}

export default function WalkDayTab({
  adminKey,
  walks,
  walkId,
  onWalkId,
  notify,
  onGoWalks,
}: {
  adminKey: string
  walks: Walk[]
  walkId: string | null
  onWalkId: (id: string) => void
  notify: Notify
  onGoWalks: () => void
}) {
  const [roster, setRoster] = useState<Roster | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set())
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const seq = useRef(0)
  const pending = useRef(0)
  const rosterRef = useRef<Roster | null>(null)
  const pickId = useId()

  useEffect(() => {
    rosterRef.current = roster
  }, [roster])

  const current = roster && roster.walk.id === walkId ? roster : null

  const refresh = useCallback(async () => {
    if (!walkId) return
    const my = ++seq.current
    const res = await getRoster(adminKey, walkId)
    // A newer fetch or a tap superseded this one; a tap refetches when it lands.
    if (my !== seq.current || pending.current > 0) return
    if (res.ok) {
      setRoster(res.data)
      setLoadError(null)
      setSyncError(null)
      setLastSync(new Date())
    } else if (rosterRef.current?.walk.id === walkId) {
      setSyncError(res.message)
    } else {
      setLoadError(res.message)
    }
  }, [adminKey, walkId])

  useLiveRefresh(refresh)

  const refreshNow = async () => {
    setSyncing(true)
    await refresh()
    setSyncing(false)
  }

  // ---- actions (optimistic, rolled back per row on failure) ---------------

  const labelFor = useCallback((row: RosterRow, rows: RosterRow[]) => {
    const twin = rows.some((r) => r.dog_id !== row.dog_id && r.dog_name === row.dog_name)
    return twin ? `${row.dog_name} (${row.owner_name})` : row.dog_name
  }, [])

  async function run(dogId: string, actions: MarkAction[]) {
    const before = rosterRef.current
    if (!before || !walkId) return
    const prevRow = before.rows.find((r) => r.dog_id === dogId)
    if (!prevRow) return
    const cap = before.walk.cap
    const at = new Date().toISOString()
    let optimistic = before.rows
    for (const a of actions) optimistic = applyMark(optimistic, cap, dogId, a, at)
    const after = optimistic.find((r) => r.dog_id === dogId)!

    pending.current++
    seq.current++
    setConfirm(null)
    setBusy((b) => new Set(b).add(dogId))
    setRowErrors((e) => {
      if (!(dogId in e)) return e
      const n = { ...e }
      delete n[dogId]
      return n
    })
    setRoster((r) => (r && r.walk.id === walkId ? { ...r, rows: applyAll(r.rows, cap, dogId, actions, at) } : r))

    let failure: string | null = null
    for (const a of actions) {
      const res = await mark(adminKey, walkId, dogId, a)
      if (!res.ok) {
        failure = res.message
        break
      }
    }
    pending.current--
    setBusy((b) => {
      const n = new Set(b)
      n.delete(dogId)
      return n
    })

    const name = labelFor(prevRow, before.rows)
    if (failure) {
      setRoster((r) =>
        r && r.walk.id === walkId
          ? { ...r, rows: restand(r.rows.map((x) => (x.dog_id === dogId ? prevRow : x)), r.walk.cap) }
          : r,
      )
      setRowErrors((e) => ({ ...e, [dogId]: failure }))
      notify(`Couldn’t update ${name}: ${failure}`, { tone: 'error' })
    } else {
      const last = actions[actions.length - 1]
      if (last === 'check_in') {
        notify(`${name} is here.`, { undo: () => void run(dogId, ['undo_check_in']) })
      } else if (last === 'undo_check_in') {
        notify(`${name} is no longer checked in.`)
      } else if (last === 'opt_out') {
        const promoted = optimistic.filter(
          (r) =>
            r.standing === 'confirmed' &&
            before.rows.find((b) => b.dog_id === r.dog_id)?.standing === 'waitlisted',
        )
        const moved = promoted.length
          ? ` ${promoted.map((p) => labelFor(p, before.rows)).join(', ')} moves up from the waitlist.`
          : ''
        notify(`${name} opted out.${moved}`, { undo: () => void run(dogId, ['restore']) })
      } else if (last === 'restore') {
        notify(
          after.standing === 'waitlisted'
            ? `${name} is back, on the waitlist (#${after.waitlist_position}).`
            : `${name} is back on the list.`,
        )
      } else if (last === 'waiver') {
        notify(`Paper waiver noted for ${name}.`)
      }
    }
    void refresh()
  }

  // ---- render ---------------------------------------------------------------

  if (!walks.length) {
    return (
      <EmptyState icon={ListOrdered} title="No walks yet">
        <p>Create the first walk, then come back here on walk day to check dogs in.</p>
        <button type="button" onClick={onGoWalks} className={`${btnPrimary} mt-4`}>
          Go to Walks
        </button>
      </EmptyState>
    )
  }

  const walk = current?.walk ?? walks.find((w) => w.id === walkId) ?? null
  const rows = current?.rows ?? []
  const counts = current ? countsOf(rows) : null
  const groups = groupRoster(rows)
  const chip = walk ? dayChip(walk) : null

  const rowProps = (r: RosterRow) => ({
    row: r,
    name: r.dog_name,
    busy: busy.has(r.dog_id),
    error: rowErrors[r.dog_id] ?? null,
    confirm: confirm?.dogId === r.dog_id ? confirm.kind : null,
    onAsk: (kind: Confirm['kind'] | null) => setConfirm(kind ? { dogId: r.dog_id, kind } : null),
    onRun: (actions: MarkAction[]) => void run(r.dog_id, actions),
  })

  return (
    <div className="space-y-5">
      {/* Walk picker + details */}
      <div className={`${cardCls} p-4 sm:p-5`}>
        <div className="flex items-center gap-2.5">
          <label htmlFor={pickId} className="shrink-0 text-xs font-bold tracking-[0.08em] text-umber uppercase">
            Walk
          </label>
          <select
            id={pickId}
            value={walkId ?? ''}
            onChange={(e) => onWalkId(e.target.value)}
            className="block min-h-11 w-full min-w-0 flex-1 rounded-xl border-2 border-sandstone bg-cream-soft/70 px-3 text-[15px] font-semibold text-espresso focus:border-honey focus:ring-4 focus:ring-honey/25 focus:outline-none"
          >
            {walks.map((w) => (
              <option key={w.id} value={w.id}>
                {walkOptionLabel(w, walks)}
              </option>
            ))}
          </select>
        </div>
        {walk && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2 id="walk-title" className="font-display text-[1.75rem] leading-tight font-bold text-espresso">
                {walk.title}
              </h2>
              {chip && <Badge tone={chip.tone}>{chip.text}</Badge>}
              {walk.status !== 'published' && (
                <Badge tone={walk.status === 'draft' ? 'honey' : 'plain'}>{statusNote[walk.status]}</Badge>
              )}
            </div>
            <ul className="mt-2 space-y-1 text-[15px] text-umber">
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-honey-dark" aria-hidden />
                <span>{formatWalkWindow(walk.starts_at, walk.ends_at)} (Mountain)</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-honey-dark" aria-hidden />
                <span>{walk.meeting_spot}</span>
              </li>
              {walk.notes && (
                <li className="flex items-start gap-2">
                  <Backpack className="mt-0.5 h-4 w-4 shrink-0 text-honey-dark" aria-hidden />
                  <span>{walk.notes}</span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Live counters */}
      <div className="sticky top-2 z-20 rounded-2xl bg-white/90 px-3 pt-2 pb-2.5 shadow-[0_12px_28px_-18px_rgba(41,24,12,0.55)] ring-1 ring-sandstone backdrop-blur-md sm:px-4">
        {counts && walk ? (
          <>
            <p data-testid="walk-counts" className="sr-only" aria-live="polite">
              {`${counts.checked_in} here · ${counts.confirmed}/${walk.cap} confirmed · ${counts.waitlisted} waitlist · ${counts.opted_out} out`}
            </p>
            <div className="flex items-center gap-1" aria-hidden="true">
              <dl className="grid flex-1 grid-cols-4 text-center">
                <Stat value={counts.checked_in} label="here" strong />
                <Stat value={`${counts.confirmed}/${walk.cap}`} label="confirmed" />
                <Stat value={counts.waitlisted} label="waitlist" />
                <Stat value={counts.opted_out} label="out" />
              </dl>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sandstone/60">
                <div
                  className="h-full rounded-full bg-pine motion-safe:transition-[width] motion-safe:duration-300"
                  style={{
                    width: `${Math.min(100, (counts.checked_in / Math.max(1, counts.confirmed, counts.checked_in)) * 100)}%`,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => void refreshNow()}
                aria-label={lastSync ? `Refresh roster (updated ${clockTime(lastSync)})` : 'Refresh roster'}
                className={`-my-3 inline-flex h-11 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold text-umber hover:bg-butter ${focusRing}`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'motion-safe:animate-spin' : ''}`} aria-hidden />
                {lastSync ? clockTime(lastSync) : ''}
              </button>
            </div>
          </>
        ) : (
          <p className="py-2 text-center text-sm font-semibold text-umber">Loading the roster…</p>
        )}
      </div>

      {syncError && current && (
        <ErrorNote onRetry={() => void refreshNow()}>
          Couldn’t refresh: {syncError} Showing the list from {lastSync ? clockTime(lastSync) : 'earlier'}.
        </ErrorNote>
      )}

      {!current ? (
        loadError ? (
          <ErrorNote onRetry={() => void refreshNow()}>{loadError}</ErrorNote>
        ) : (
          <Loading label="Loading the roster…" />
        )
      ) : rows.length === 0 ? (
        <EmptyState icon={ListOrdered} title="No dogs signed up yet">
          Owners sign up with their personal links. You can also add a roster dog below.
        </EmptyState>
      ) : (
        <div className="space-y-6">
          <section aria-labelledby="g-due" className="space-y-2.5">
            <SectionLabel id="g-due" count={groups.due.length}>
              Still to arrive
            </SectionLabel>
            {groups.due.length ? (
              <ul className="space-y-2.5">
                {groups.due.map((r) => (
                  <RowCard key={r.dog_id} {...rowProps(r)} />
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 rounded-2xl bg-[#e3efe7] px-4 py-3 font-semibold text-pine">
                <PartyPopper className="h-5 w-5" aria-hidden />
                Every confirmed dog is here.
              </p>
            )}
          </section>

          {groups.waitlist.length > 0 && (
            <section aria-labelledby="g-wait" className="space-y-2.5">
              <SectionLabel id="g-wait" count={groups.waitlist.length}>
                Waitlist
              </SectionLabel>
              <ul className="space-y-2.5">
                {groups.waitlist.map((r) => (
                  <RowCard key={r.dog_id} {...rowProps(r)} />
                ))}
              </ul>
            </section>
          )}

          {groups.here.length > 0 && (
            <section aria-labelledby="g-here" className="space-y-2.5">
              <SectionLabel id="g-here" count={groups.here.length}>
                Here
              </SectionLabel>
              <ul className="space-y-2">
                {groups.here.map((r) => (
                  <RowCard key={r.dog_id} {...rowProps(r)} />
                ))}
              </ul>
            </section>
          )}

          {groups.out.length > 0 && (
            <section aria-labelledby="g-out" className="space-y-2.5">
              <SectionLabel id="g-out" count={groups.out.length}>
                Opted out
              </SectionLabel>
              <ul className="space-y-2">
                {groups.out.map((r) => (
                  <RowCard key={r.dog_id} {...rowProps(r)} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {current && walkId && (
        <AddRosterDog adminKey={adminKey} walkId={walkId} rows={rows} notify={notify} onAdded={refresh} />
      )}
    </div>
  )
}

function Stat({ value, label, strong = false }: { value: number | string; label: string; strong?: boolean }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className={`text-[11px] font-bold tracking-[0.08em] uppercase ${strong ? 'text-pine' : 'text-umber'}`}>{label}</dt>
      <dd
        className={`font-display leading-none font-bold tabular-nums ${
          strong ? 'text-[2rem] text-pine' : 'text-[1.6rem] text-espresso'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function applyAll(rows: RosterRow[], cap: number, dogId: string, actions: MarkAction[], at: string): RosterRow[] {
  let out = rows
  for (const a of actions) out = applyMark(out, cap, dogId, a, at)
  return out
}

// ---------------------------------------------------------------------------
// One dog on the walk
// ---------------------------------------------------------------------------

function RowCard({
  row,
  name,
  busy,
  error,
  confirm,
  onAsk,
  onRun,
}: {
  row: RosterRow
  name: string
  busy: boolean
  error: string | null
  confirm: Confirm['kind'] | null
  onAsk: (kind: Confirm['kind'] | null) => void
  onRun: (actions: MarkAction[]) => void
}) {
  const out = !!row.opted_out_at
  const here = !out && !!row.checked_in_at
  const waiting = !out && !here && row.standing === 'waitlisted'

  const call = row.owner_phone && (
    <a
      href={telHref(row.owner_phone)}
      aria-label={`Call ${row.owner_name} at ${row.owner_phone}`}
      className={`-my-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-2 text-sm font-bold text-honey-dark hover:bg-butter ${focusRing}`}
    >
      <Phone className="h-4 w-4" aria-hidden />
      Call
    </a>
  )

  const badges = (
    <>
      {waiting && <Badge tone="honey" icon={ListOrdered}>Waitlist #{row.waitlist_position}</Badge>}
      {out && (
        <Badge tone="plain" icon={UserX}>
          Opted out by {row.opted_out_by === 'owner' ? 'owner' : 'admin'}
        </Badge>
      )}
      {!row.waiver_signed && (
        <Badge tone="warn" icon={FileWarning}>
          No waiver
        </Badge>
      )}
      {row.photo_consent ? (
        <Badge tone="ok" icon={Camera}>
          Photo OK
        </Badge>
      ) : (
        <Badge tone="plain" icon={CameraOff}>
          No photos
        </Badge>
      )}
    </>
  )

  const waiverButton = !row.waiver_signed && !out && (
    <button
      type="button"
      disabled={busy}
      onClick={() => onRun(['waiver'])}
      aria-label={`Paper waiver signed for ${name} (${row.owner_name})`}
      className={btn('secondary', 'xs')}
    >
      <Check className="h-4 w-4 text-pine" aria-hidden strokeWidth={3} />
      Paper waiver signed
    </button>
  )

  const errorLine = error && (
    <p role="alert" className="mt-2 rounded-lg bg-[#fbe4df] px-3 py-2 text-sm font-semibold text-[#8f2a1d]">
      Didn’t save: {error}
    </p>
  )

  if (here) {
    return (
      <li className="rounded-2xl bg-[#eef5f0] px-4 py-3 ring-1 ring-[#c9dfd1]" aria-busy={busy}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h4 className="font-display text-xl leading-tight font-bold text-espresso">{name}</h4>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-pine">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Here
                {row.checked_in_at && (
                  <span className="font-medium text-pine/80">· {clockTime(new Date(row.checked_in_at))}</span>
                )}
              </span>
            </div>
            <p className="flex items-center gap-1 text-sm text-umber">
              <span className="min-w-0 truncate">{row.owner_name}</span>
              {call}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRun(['undo_check_in'])}
            className={btnQuiet}
            aria-label={`Undo check-in for ${name} (${row.owner_name})`}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Undo
          </button>
        </div>
        {(!row.waiver_signed || !row.photo_consent) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {badges}
            {waiverButton}
          </div>
        )}
        {errorLine}
      </li>
    )
  }

  if (out) {
    return (
      <li className="rounded-2xl bg-white/50 px-4 py-3 ring-1 ring-sandstone/70" aria-busy={busy}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="font-display text-xl leading-tight font-bold text-umber line-through decoration-umber/40">
              {name}
            </h4>
            <p className="text-sm text-umber">{row.owner_name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{badges}</div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRun(['restore'])}
            className={btnSecondary}
            aria-label={`Restore ${name} (${row.owner_name})`}
          >
            <RotateCcw className="h-4 w-4 text-honey-dark" aria-hidden />
            Restore
          </button>
        </div>
        {errorLine}
      </li>
    )
  }

  // Still to arrive, or waitlisted.
  const checkIn = () => (row.waiver_signed ? onRun(['check_in']) : onAsk('waiver_check_in'))
  return (
    <li className={`${cardCls} px-4 pt-3 pb-2`} aria-busy={busy}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-[1.65rem] leading-tight font-bold break-words text-espresso">{name}</h4>
          <p className="mt-0.5 flex items-center gap-1 text-[15px] text-umber">
            <span className="min-w-0 truncate font-medium">{row.owner_name}</span>
            {call}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={checkIn}
          aria-label={`Check in ${name} (${row.owner_name})`}
          className={`${btn(waiting ? 'pine' : 'primary', 'lg')} shrink-0`}
        >
          <Check className="h-5 w-5" aria-hidden strokeWidth={3} />
          Check in
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {badges}
        {waiverButton}
        <button
          type="button"
          disabled={busy}
          onClick={() => onAsk(confirm === 'opt_out' ? null : 'opt_out')}
          aria-expanded={confirm === 'opt_out'}
          aria-label={`Opt out ${name} (${row.owner_name})`}
          className={`${quiet('xs')} ml-auto`}
        >
          Opt out
        </button>
      </div>

      {confirm === 'opt_out' && (
        <div className="mt-3 rounded-xl bg-cream-soft p-3 ring-1 ring-sandstone" role="group" aria-label={`Opt out ${name}?`}>
          <p className="text-[15px] font-semibold text-espresso">
            Opt {name} out of this walk?{' '}
            <span className="font-normal text-umber">
              {row.standing === 'confirmed' ? 'The next waitlisted dog moves up.' : 'They leave the waitlist.'}
            </span>
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onRun(['opt_out'])}
              className={btn('danger', 'sm')}
            >
              <UserX className="h-4 w-4" aria-hidden />
              Yes, opt out
            </button>
            <button type="button" onClick={() => onAsk(null)} className={btnQuiet}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirm === 'waiver_check_in' && (
        <div className="mt-3 rounded-xl bg-[#fbe4df]/60 p-3 ring-1 ring-[#efb3a7]" role="group" aria-label="Waiver needed">
          <p className="text-[15px] font-semibold text-espresso">
            No waiver on file for {name}.{' '}
            <span className="font-normal text-umber">Have {row.owner_name} sign a paper waiver first.</span>
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button type="button" onClick={() => onRun(['waiver', 'check_in'])} className={btnPrimary}>
              <Check className="h-5 w-5" aria-hidden strokeWidth={3} />
              Waiver signed, check in
            </button>
            <button type="button" onClick={() => onAsk(null)} className={btnQuiet}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {errorLine}
    </li>
  )
}

// ---------------------------------------------------------------------------
// Add a roster dog to this walk
// ---------------------------------------------------------------------------

function AddRosterDog({
  adminKey,
  walkId,
  rows,
  notify,
  onAdded,
}: {
  adminKey: string
  walkId: string
  rows: RosterRow[]
  notify: Notify
  onAdded: () => Promise<void>
}) {
  const [people, setPeople] = useState<Person[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [choice, setChoice] = useState('')
  const [saving, setSaving] = useState(false)
  const [tick, setTick] = useState(0)
  const selectId = useId()

  useEffect(() => {
    let live = true
    void listPeople(adminKey).then((res) => {
      if (!live) return
      if (res.ok) {
        setPeople(res.data)
        setError(null)
      } else setError(res.message)
    })
    return () => {
      live = false
    }
  }, [adminKey, tick])

  const options = useMemo(() => {
    const onWalk = new Set(rows.map((r) => r.dog_id))
    const list: { id: string; dog: string; owner: string }[] = []
    for (const p of people ?? [])
      for (const d of p.dogs) if (d.status === 'active' && !onWalk.has(d.id)) list.push({ id: d.id, dog: d.name, owner: p.name })
    return list.sort((a, b) => a.dog.localeCompare(b.dog) || a.owner.localeCompare(b.owner))
  }, [people, rows])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const pick = options.find((o) => o.id === choice)
    if (!pick) {
      setError('Pick a dog to add.')
      return
    }
    setSaving(true)
    setError(null)
    const res = await mark(adminKey, walkId, pick.id, 'add')
    setSaving(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    setChoice('')
    notify(`${pick.dog} (${pick.owner}) is on the walk. They still need a paper waiver.`)
    await onAdded()
  }

  return (
    <section aria-labelledby="add-dog-h" className="rounded-2xl border-2 border-dashed border-sandstone bg-cream-soft/70 p-4 sm:p-5">
      <h3 id="add-dog-h" className="flex items-center gap-2 font-display text-lg font-semibold text-espresso">
        <PlusCircle className="h-5 w-5 text-honey-dark" aria-hidden />
        Add a roster dog to this walk
      </h3>
      <p className="mt-1 text-sm text-umber">For gaggle dogs who turn up without signing up. They start without a waiver.</p>
      {people === null && !error ? (
        <p className="mt-3 text-sm text-umber">Loading the roster…</p>
      ) : (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor={selectId} className={labelCls}>
              Dog
            </label>
            <select
              id={selectId}
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
              disabled={!options.length}
              className={inputCls}
            >
              <option value="">{options.length ? 'Choose a dog…' : 'Every active roster dog is on this walk'}</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.dog} · {o.owner}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving || !options.length}
            className={`${btn('pine', 'md')} sm:min-w-36`}
          >
            <PlusCircle className="h-5 w-5" aria-hidden />
            {saving ? 'Adding…' : 'Add to walk'}
          </button>
        </form>
      )}
      {error && (
        <div className="mt-3">
          <ErrorNote onRetry={people === null ? () => setTick((n) => n + 1) : undefined}>{error}</ErrorNote>
        </div>
      )}
    </section>
  )
}
