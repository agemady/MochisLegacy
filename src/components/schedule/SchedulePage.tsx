import { useCallback, useEffect, useState } from 'react'
import { getMyDogs, getMyRsvps, getUpcomingWalk, optOut, rsvp, type Dog, type Walk, type WalkRsvp } from '../../lib/schedule'
import { formatWalkWindow } from '../../lib/time'

/** /schedule — RSVP for the upcoming Gaggle walk (slice S-rsvp-ui). */
export default function SchedulePage() {
  const [walk, setWalk] = useState<Walk | null>(null)
  const [dogs, setDogs] = useState<Dog[]>([])
  const [rows, setRows] = useState<WalkRsvp[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [dogId, setDogId] = useState('')
  const [waiver, setWaiver] = useState(false)
  const [photo, setPhoto] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waitlistPos, setWaitlistPos] = useState(0)

  const load = useCallback(async () => {
    const w = await getUpcomingWalk()
    if (!w.ok || !w.data) {
      setLoadError(w.ok ? null : w.message)
      setWalk(w.data ?? null)
      return
    }
    setWalk(w.data)
    const [d, r] = await Promise.all([getMyDogs(), getMyRsvps(w.data.id)])
    if (d.ok && d.data) setDogs(d.data)
    if (r.ok && r.data) setRows(r.data)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const active = rows.filter((r) => !r.opted_out_at)
  const spotsOpen = walk ? Math.max(0, walk.cap - active.length) : 0
  const mine = active[0]

  async function handleRsvp() {
    if (!walk || !dogId || !waiver || pending) return
    setPending(true)
    setError(null)
    const result = await rsvp(walk.id, dogId, { waiverSigned: waiver, photoConsent: photo })
    setPending(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    const m = /#(\d+)/.exec(result.message)
    setWaitlistPos(m ? Number(m[1]) : 0)
    await load()
  }

  async function handleOptOut() {
    if (!walk || !mine || pending) return
    setPending(true)
    const result = await optOut(walk.id, mine.dog_id)
    setPending(false)
    if (!result.ok) setError(result.message)
    setDogId('')
    setWaiver(false)
    setPhoto(false)
    await load()
  }

  if (loadError || !walk) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center text-stone-600" role={loadError ? 'alert' : undefined}>
        {loadError ?? 'No walks scheduled yet — check back soon.'}
      </main>
    )
  }

  const card = 'rounded-2xl border border-amber-200/80 bg-white/70 p-6 shadow-sm sm:p-8'

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-10 text-stone-800">
      <header className="text-center">
        <h1 className="text-2xl font-semibold">Gaggle of Goldens walk</h1>
        <p className="mt-2 text-lg text-stone-700">{formatWalkWindow(walk.starts_at, walk.ends_at)} · {walk.meeting_spot}</p>
        <p className={`mt-3 inline-block rounded-full px-4 py-1 text-sm font-medium ${spotsOpen > 0 ? 'bg-amber-100 text-amber-900' : 'bg-stone-200 text-stone-700'}`}>
          {spotsOpen > 0 ? `${spotsOpen} of ${walk.cap} spots open` : 'Walk is full — waitlist open'}
        </p>
      </header>

      {mine ? (
        <section className={`${card} text-center`} aria-live="polite">
          {spotsOpen > 0 || waitlistPos === 0 ? (
            <p className="text-xl font-semibold text-amber-900">
              You and {dogs.find((d) => d.id === mine.dog_id)?.name ?? 'your dog'} are walking! 🐾
            </p>
          ) : (
            <p className="text-lg font-semibold text-stone-800">You're on the waitlist (#{waitlistPos})</p>
          )}
          <p className="mt-2 text-sm text-stone-600">{formatWalkWindow(walk.starts_at, walk.ends_at)} · {walk.meeting_spot}</p>
          <button
            type="button"
            onClick={handleOptOut}
            disabled={pending}
            className="mt-6 w-full rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white hover:bg-red-700 disabled:opacity-40"
          >            Opt out of this walk
          </button>
        </section>
      ) : (
        <section className={card}>
          <h2 className="text-lg font-semibold text-stone-800">RSVP your dog</h2>
          <label className="mt-4 block text-sm font-medium text-stone-700">
            Your dog
            <select value={dogId} onChange={(e) => setDogId(e.target.value)} className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2">
              <option value="">Choose a dog…</option>
              {dogs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 flex items-start gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={waiver} onChange={(e) => setWaiver(e.target.checked)} className="mt-0.5" />
            I've read and signed the liability waiver (required).
          </label>
          <label className="mt-2 flex items-start gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={photo} onChange={(e) => setPhoto(e.target.checked)} className="mt-0.5" />
            OK to use photos of my dog on the site and socials.
          </label>
          {error && (
            <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleRsvp}
            disabled={!dogId || !waiver || pending}
            className="mt-4 w-full rounded-xl bg-amber-600 px-4 py-3 text-base font-semibold text-white disabled:opacity-40"
          >
            {spotsOpen > 0 ? 'RSVP — save my spot' : 'Join the waitlist'}
          </button>
        </section>
      )}
    </main>
  )
}
