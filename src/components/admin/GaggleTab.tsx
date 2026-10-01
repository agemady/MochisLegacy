import { Mail, PawPrint, Phone, Plus, RefreshCcw, Search, ShieldCheck, UserPlus, Users, X } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { addDog, addOwner, listPeople, newLink, type Person } from '../../lib/admin'
import type { Notify } from './hooks'
import LinkActions from './LinkActions'
import {
  btnPrimary,
  btnClose,
  btnQuiet,
  btnSecondary,
  cardCls,
  firstName,
  focusRing,
  inputCls,
  inputSearch,
  labelCls,
  prefersReducedMotion,
  quiet,
  telHref,
} from './lib'
import { Badge, EmptyState, ErrorNote, Loading } from './ui'

const sortPeople = (xs: Person[]) => [...xs].sort((a, b) => a.name.localeCompare(b.name))

export default function GaggleTab({
  adminKey,
  notify,
  onOwnLinkChanged,
}: {
  adminKey: string
  notify: Notify
  /** The founder rotated their own link: the page must switch to the new key. */
  onOwnLinkChanged: (token: string) => void
}) {
  const [people, setPeople] = useState<Person[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState<{ id: string; why: 'added' | 'link' } | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const searchId = useId()

  const [tick, setTick] = useState(0)
  const reload = () => setTick((n) => n + 1)

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

  // Bring a just-added person into view.
  useEffect(() => {
    if (!highlight) return
    const el = document.getElementById(`person-${highlight.id}`)
    el?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [highlight])

  const upsert = useCallback((p: Person) => {
    setPeople((xs) => sortPeople([...(xs ?? []).filter((x) => x.id !== p.id), p]))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!people || !q) return people ?? []
    return people.filter((p) =>
      [p.name, p.email ?? '', p.phone ?? '', ...p.dogs.map((d) => d.name)].some((s) => s.toLowerCase().includes(q)),
    )
  }, [people, query])

  if (!people) {
    return error ? <ErrorNote onRetry={reload}>{error}</ErrorNote> : <Loading label="Loading the gaggle…" />
  }

  const dogCount = people.reduce((n, p) => n + p.dogs.filter((d) => d.status === 'active').length, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.75rem] leading-tight font-bold text-espresso">The gaggle</h2>
          <p className="text-[15px] text-umber">
            {people.length} {people.length === 1 ? 'person' : 'people'} · {dogCount} active{' '}
            {dogCount === 1 ? 'dog' : 'dogs'}
          </p>
        </div>
        {!formOpen && (
          <button type="button" onClick={() => setFormOpen(true)} className={btnPrimary}>
            <UserPlus className="h-5 w-5" aria-hidden />
            Add owner
          </button>
        )}
      </div>

      {formOpen && (
        <AddOwnerForm
          adminKey={adminKey}
          onCancel={() => setFormOpen(false)}
          onAdded={(p, existed) => {
            upsert(p)
            setQuery('')
            setHighlight({ id: p.id, why: 'added' })
            setFormOpen(false)
            notify(
              existed
                ? `${p.name} was already on the roster. Their details are below.`
                : `${p.name} is in the gaggle. Send ${firstName(p.name)} their link.`,
            )
          }}
          knownIds={new Set(people.map((p) => p.id))}
        />
      )}

      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}

      {people.length >= 8 && (
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Search people and dogs
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-umber/70" aria-hidden />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people or dogs"
            autoComplete="off"
            className={inputSearch}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        people.length === 0 ? (
          <EmptyState icon={Users} title="No one on the roster yet">
            Add the first owner and their dog, then send them their personal link.
          </EmptyState>
        ) : (
          <p className="rounded-2xl bg-cream-soft px-4 py-6 text-center text-umber">
            No one matches “{query.trim()}”.
          </p>
        )
      ) : (
        <ul className="grid items-start gap-3 sm:grid-cols-2">
          {filtered.map((p) => (
            <PersonCard
              key={p.id}
              person={p}
              adminKey={adminKey}
              highlighted={highlight?.id === p.id ? highlight.why : null}
              notify={notify}
              onChange={(next, reason) => {
                upsert(next)
                if (reason === 'link') {
                  setHighlight({ id: next.id, why: 'link' })
                  if (p.access_token === adminKey) onOwnLinkChanged(next.access_token)
                }
              }}
              isMe={p.access_token === adminKey}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function AddOwnerForm({
  adminKey,
  onCancel,
  onAdded,
  knownIds,
}: {
  adminKey: string
  onCancel: () => void
  onAdded: (p: Person, existed: boolean) => void
  knownIds: Set<string>
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ids = { name: useId(), phone: useId(), email: useId(), dog: useId() }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = String(f.get('name') ?? '').trim()
    if (!name) {
      setError("Add the owner's name.")
      return
    }
    setSaving(true)
    setError(null)
    const res = await addOwner(adminKey, {
      name,
      phone: String(f.get('phone') ?? '').trim() || undefined,
      email: String(f.get('email') ?? '').trim() || undefined,
      dogName: String(f.get('dog') ?? '').trim() || undefined,
    })
    setSaving(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    onAdded(res.data, knownIds.has(res.data.id))
  }

  return (
    <form onSubmit={submit} className={`${cardCls} space-y-4 p-4 sm:p-5`} aria-labelledby="add-owner-h" noValidate>
      <div className="flex items-center justify-between gap-2">
        <h3 id="add-owner-h" className="font-display text-xl font-semibold text-espresso">
          Add an owner
        </h3>
        <button type="button" onClick={onCancel} aria-label="Close the form" className={btnClose}>
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div>
        <label htmlFor={ids.name} className={labelCls}>
          Name <span className="font-normal text-umber">(required)</span>
        </label>
        <input id={ids.name} name="name" required autoComplete="off" maxLength={120} className={inputCls} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.phone} className={labelCls}>
            Phone <span className="font-normal text-umber">(for texting the link)</span>
          </label>
          <input
            id={ids.phone}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            maxLength={40}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor={ids.email} className={labelCls}>
            Email
          </label>
          <input
            id={ids.email}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            maxLength={254}
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label htmlFor={ids.dog} className={labelCls}>
          First dog’s name
        </label>
        <input id={ids.dog} name="dog" autoComplete="off" maxLength={60} className={inputCls} />
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="submit" disabled={saving} className={btnPrimary}>
          <UserPlus className="h-5 w-5" aria-hidden />
          {saving ? 'Adding…' : 'Add to gaggle'}
        </button>
        <button type="button" onClick={onCancel} className={btnQuiet}>
          Cancel
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------

function PersonCard({
  person: p,
  adminKey,
  highlighted,
  notify,
  onChange,
  isMe,
}: {
  person: Person
  adminKey: string
  highlighted: 'added' | 'link' | null
  notify: Notify
  onChange: (p: Person, reason: 'dog' | 'link') => void
  isMe: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [dogName, setDogName] = useState('')
  const [confirmLink, setConfirmLink] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dogInputId = useId()

  async function saveDog(e: FormEvent) {
    e.preventDefault()
    const name = dogName.trim()
    if (!name) {
      setError("Add the dog's name.")
      return
    }
    setBusy(true)
    setError(null)
    const res = await addDog(adminKey, p.id, name)
    setBusy(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    setDogName('')
    setAdding(false)
    onChange(res.data, 'dog')
    notify(`${name} joined ${firstName(p.name)}’s dogs.`)
  }

  async function rotate() {
    setBusy(true)
    setError(null)
    const res = await newLink(adminKey, p.id)
    setBusy(false)
    setConfirmLink(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    onChange(res.data, 'link')
    notify(`New link ready for ${p.name}. The old one no longer works.`)
  }

  return (
    <li
      id={`person-${p.id}`}
      className={`scroll-mt-24 rounded-2xl p-4 sm:p-5 ${
        highlighted
          ? 'bg-[#fffaf0] shadow-[0_14px_34px_-18px_rgba(180,83,9,0.55)] ring-[3px] ring-honey'
          : cardCls
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-xl leading-tight font-bold text-espresso">{p.name}</h3>
        {p.is_admin && (
          <Badge tone="ink" icon={ShieldCheck}>
            Admin
          </Badge>
        )}
        {isMe && <Badge tone="plain">You</Badge>}
        {highlighted && <Badge tone="honey">{highlighted === 'added' ? 'Just added' : 'New link'}</Badge>}
      </div>

      {(p.phone || p.email) && (
        <div className="mt-1 flex flex-wrap gap-x-4 text-[15px]">
          {p.phone && (
            <a
              href={telHref(p.phone)}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg text-umber hover:text-espresso ${focusRing}`}
            >
              <Phone className="h-4 w-4 text-honey-dark" aria-hidden />
              {p.phone}
            </a>
          )}
          {p.email && (
            <a
              href={`mailto:${p.email}`}
              className={`inline-flex min-h-11 min-w-0 items-center gap-1.5 rounded-lg break-all text-umber hover:text-espresso ${focusRing}`}
            >
              <Mail className="h-4 w-4 shrink-0 text-honey-dark" aria-hidden />
              {p.email}
            </a>
          )}
        </div>
      )}

      <ul className="mt-2 flex flex-wrap items-center gap-1.5" aria-label={`${p.name}’s dogs`}>
        {p.dogs.map((d) => (
          <li
            key={d.id}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold ${
              d.status === 'active'
                ? 'border-sandstone bg-cream-soft text-espresso'
                : 'border-dashed border-sandstone bg-transparent text-umber'
            }`}
          >
            <PawPrint className="h-3.5 w-3.5 text-honey-dark" aria-hidden strokeWidth={2.5} />
            {d.name}
            {d.status === 'retired' && <span className="text-xs font-medium">(retired)</span>}
          </li>
        ))}
        {!adding && (
          <li>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className={`inline-flex min-h-11 items-center gap-1 rounded-full border-2 border-dashed border-sandstone px-3 text-sm font-semibold text-honey-dark hover:border-honey hover:bg-cream-soft ${focusRing}`}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add dog
            </button>
          </li>
        )}
      </ul>

      {adding && (
        <form onSubmit={saveDog} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1 basis-48">
            <label htmlFor={dogInputId} className={labelCls}>
              Dog’s name
            </label>
            <input
              id={dogInputId}
              value={dogName}
              onChange={(e) => setDogName(e.target.value)}
              autoFocus
              autoComplete="off"
              maxLength={60}
              className={inputCls}
            />
          </div>
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? 'Saving…' : 'Save dog'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false)
              setDogName('')
              setError(null)
            }}
            className={btnQuiet}
          >
            Cancel
          </button>
        </form>
      )}

      <div className="mt-4 border-t border-sandstone/70 pt-3.5">
        {highlighted && (
          <p className="mb-2 text-sm font-semibold text-pine">Send {firstName(p.name)} their personal link:</p>
        )}
        <LinkActions person={p} showUrl={!!highlighted} onCopied={(t) => notify(t)}>
          {!confirmLink && (
            <button
              type="button"
              onClick={() => setConfirmLink(true)}
              aria-label={`New link for ${p.name}`}
              className={quiet('xs')}
            >
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
              New link
            </button>
          )}
        </LinkActions>
        {confirmLink && (
          <div className="mt-3 rounded-xl bg-cream-soft p-3 ring-1 ring-sandstone" role="group" aria-label="Make a new link?">
            <p className="text-[15px] font-semibold text-espresso">
              Make a new link for {firstName(p.name)}?{' '}
              <span className="font-normal text-umber">
                The old link will stop working.
                {isMe && ' This is your own link: this page switches to the new one.'}
              </span>
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void rotate()} className={btnSecondary}>
                <RefreshCcw className="h-4 w-4 text-honey-dark" aria-hidden />
                {busy ? 'Making…' : 'Make new link'}
              </button>
              <button type="button" onClick={() => setConfirmLink(false)} className={btnQuiet}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
    </li>
  )
}
