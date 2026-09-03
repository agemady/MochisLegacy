import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getMyDogs, getMyRsvps, getUpcomingWalk, optOut, rsvp,
  type Dog, type Walk, type WalkRsvp,
} from '../../lib/schedule'
import { signInWithOtp, useSession } from '../../lib/auth'
import { getSupabase } from '../../lib/supabase'
import { formatWalkWindow } from '../../lib/time'
import PageTop from '../PageTop'

const CARD = 'rounded-[2rem] border-2 border-[#F3D9A2] bg-white p-6 shadow-[0_16px_40px_-12px_rgba(180,83,9,0.18)]'
const INPUT = 'w-full rounded-2xl border border-[#E6CCA0] bg-[#FFFDF9] px-4 py-3.5 text-base font-medium text-[#29180C]'
const PRIMARY =
  'w-full rounded-full bg-gradient-to-r from-[#D97706] to-[#B45309] py-4 text-lg font-bold text-white shadow-[0_8px_20px_-4px_rgba(217,119,6,0.45)] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40'
const QUIET_DANGER =
  'rounded-full border border-stone-300 bg-white/80 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-red-50 hover:text-red-700'

const longDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', month: 'long', day: 'numeric' }).format(new Date(iso))

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 bg-[#FDFBF7] px-4 py-8 text-[#29180C] sm:py-12">
      <PageTop />
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#29180C] sm:text-4xl">Walk with us</h1>
        <p className="mt-2 text-[#6B5545]">One upcoming walk at a time. Pick your dog, sign the waiver, and you're in.</p>
      </header>
      {children}
    </main>
  )
}

/** /schedule — "Walk with us" RSVP screen (ruling 15 brief, Direction A tokens). */
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
  const [confirmingOut, setConfirmingOut] = useState(false)
  const [optedOutMsg, setOptedOutMsg] = useState(false)
  const wasFull = useRef(false)
  const [promoted, setPromoted] = useState(false)

  // Signed-out only when a real Supabase client exists and reports no session.
  const { session, loading } = useSession()
  const [hasClient, setHasClient] = useState<boolean | null>(null)
  useEffect(() => { void getSupabase().then((c) => setHasClient(!!c)) }, [])
  const signedOut = hasClient === true && !loading && !session

  // Auth card (brief item 3).
  const [email, setEmail] = useState('')
  const [authPending, setAuthPending] = useState(false)
  const [authSent, setAuthSent] = useState(false)
  const [authError, setAuthError] = useState(false)

  const load = useCallback(async () => {
    const w = await getUpcomingWalk()
    if (!w.ok) setLoadError("Couldn't load the walk — check your connection and try again.")
    setWalk(w.data ?? null)
    if (!w.data) return
    const [d, r] = await Promise.all([getMyDogs(), getMyRsvps(w.data.id)])
    setDogs(d.ok && d.data ? d.data : [])
    setRows(r.ok && r.data ? r.data : [])
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || authPending) return
    setAuthPending(true); setAuthError(false)
    const { error: err } = await signInWithOtp(email.trim())
    setAuthPending(false)
    if (err) setAuthError(true); else setAuthSent(true)
  }

  async function handleRsvp() {
    if (!walk) return
    if (!dogId || !waiver) {
      setError('Pick your dog and agree to the waiver to save your spot.')
      return
    }
    setError(null); setPending(true)
    const result = await rsvp(walk.id, dogId, { waiverSigned: true, photoConsent: photo })
    setPending(false)
    if (!result.ok) { setError(result.message); return }
    const m = /#(\d+)/.exec(result.message)
    setWaitlistPos(m ? Number(m[1]) : 0)
    setOptedOutMsg(false)
    await load()
  }

  async function handleOptOut() {
    if (!walk || !mine) return
    if (!confirmingOut) { setConfirmingOut(true); return }
    setPending(true)
    const result = await optOut(walk.id, mine.dog_id)
    setPending(false); setConfirmingOut(false)
    if (!result.ok) { setError(result.message); return }
    setOptedOutMsg(true)
    setDogId(''); setWaiver(false); setPhoto(false); setWaitlistPos(0); setPromoted(false)
    await load()
  }

  const active = rows.filter((r) => !r.opted_out_at)
  const mine = active[0]
  const spotsLeft = walk ? Math.max(0, walk.cap - active.length) : 0
  const full = walk !== null && spotsLeft === 0
  useEffect(() => {
    if (wasFull.current && !full && mine) setPromoted(true)
    wasFull.current = full
  }, [full, mine])
  const dogName = mine ? dogs.find((d) => d.id === mine.dog_id)?.name ?? 'Your dog' : ''

  if (loadError) {
    return <Frame><p role="alert" className="text-center text-[#6B5545]">{loadError}</p></Frame>
  }
  if (!walk) {
    return <Frame><p className="text-center text-[#6B5545]">No walk scheduled yet — check back soon.</p></Frame>
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 bg-[#FDFBF7] px-4 py-8 text-[#29180C] sm:py-12">
      <PageTop />
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#29180C] sm:text-4xl">Walk with us</h1>
        <p className="mt-2 text-[#6B5545]">One upcoming walk at a time. Pick your dog, sign the waiver, and you're in.</p>
      </header>

      {!signedOut && (
        <section className={CARD}>
          <p className="text-sm font-semibold text-[#6B5545]">Gaggle walk — {longDate(walk.starts_at)}</p>
          <p className="mt-1 text-lg font-semibold">{walk.meeting_spot}</p>
          <p className="mt-1 text-sm text-[#6B5545]">{formatWalkWindow(walk.starts_at, walk.ends_at)} · About an hour, easy pace</p>
          <p className={`mt-3 inline-block rounded-full border px-3.5 py-1 text-xs font-bold ${spotsLeft > 0 ? 'border-[#2C5E43]/25 bg-[#2C5E43]/10 text-[#2C5E43]' : 'border-[#F3D9A2] bg-[#FFF8EB] text-[#B45309]'}`}>
            {spotsLeft > 0 ? `${spotsLeft} of ${walk.cap} spots left` : 'Walk is full — join the waitlist below'}
          </p>
        </section>
      )}

      {signedOut ? (
        <section className={CARD}>
          <p className="text-sm text-[#6B5545]">Enter your email — we'll send a sign-in link. No password.</p>
          {authSent ? (
            <p role="status" className="mt-4 font-semibold text-[#2C5E43]">Check your email — your link is on its way.</p>
          ) : (
            <form onSubmit={handleSignIn} className="mt-4 flex flex-col gap-3">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={INPUT} />
              {authError && <p role="alert" className="text-sm text-red-700">That link didn't work — enter your email for a fresh one.</p>}
              <button type="submit" disabled={authPending} className={PRIMARY}>{authPending ? 'Saving…' : 'Email me a link'}</button>
            </form>
          )}
        </section>
      ) : optedOutMsg ? (
        <section className={`${CARD} text-center`}>
          <p className="text-lg font-semibold">You've opted out — no worries, hope to see you next time.</p>
          <button type="button" onClick={() => setOptedOutMsg(false)} className={QUIET_DANGER + ' mt-5'}>Re-join if there's room</button>
        </section>
      ) : mine ? (
        <section className="rounded-[2.5rem] border-2 border-[#F3D9A2] bg-gradient-to-b from-[#FFFDF9] to-[#FFF3D6] p-7 text-center" aria-live="polite">
          {full && waitlistPos > 0 ? (
            <>
              <p className="font-display text-lg font-bold">Walk is full — {dogName} is #{waitlistPos} on the waitlist.</p>
              <p className="mt-2 text-sm text-[#6B5545]">We'll count you in automatically if a spot opens.</p>
            </>
          ) : (
            <>
              <p className="font-display text-xl font-bold text-[#B45309]">
                {promoted ? `A spot opened — ${dogName} is walking!` : `You're walking! ${dogName} is in for ${longDate(walk.starts_at)}.`}
              </p>
              <p className="mt-2 text-sm text-[#6B5545]">Meet at {walk.meeting_spot} — look for the amber sign.</p>
              <p className="mt-1 text-sm text-[#6B5545]">Bring: leash, water, and poop bags.</p>
            </>
          )}
          {confirmingOut ? (
            <button type="button" onClick={handleOptOut} className={QUIET_DANGER + ' mt-6'}>Tap again to confirm</button>
          ) : (
            <button type="button" onClick={handleOptOut} className={QUIET_DANGER + ' mt-6'}>Opt out</button>
          )}
        </section>
      ) : (
        <section className={CARD}>
          <h2 className="text-lg font-semibold">Which dog is walking?</h2>
          <select value={dogId} onChange={(e) => setDogId(e.target.value)} className={INPUT + ' mt-3'}>
            <option value="">Choose a dog…</option>
            {dogs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {dogs.length === 0 && (
            <p className="mt-2 text-sm text-[#6B5545]">No approved dogs on your account yet — founders add dogs in Studio after signup.</p>
          )}
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input type="checkbox" checked={waiver} onChange={(e) => setWaiver(e.target.checked)} className="mt-0.5 h-5 w-5 rounded-md accent-[#D97706]" />
            <span>I agree to the walk waiver for this outing *<span className="mt-1 block text-xs font-normal text-[#6B5545]">One signature per walk, so every outing is covered.</span></span>
          </label>
          <label className="mt-3 flex items-start gap-3 text-sm">
            <input type="checkbox" checked={photo} onChange={(e) => setPhoto(e.target.checked)} className="mt-0.5 h-5 w-5 rounded-md accent-[#D97706]" />
            It's OK to include my dog in group photos
          </label>
          {error && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          <button type="button" onClick={handleRsvp} disabled={pending} className={PRIMARY + ' mt-5'}>
            {pending ? 'Saving…' : spotsLeft > 0 ? 'Save our spot' : 'Join the waitlist'}
          </button>
        </section>
      )}
    </main>
  )
}
