import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, CalendarDays, Link2Off, LoaderCircle, PawPrint, RotateCcw, WifiOff } from "lucide-react";
import PageTop from "../PageTop";
import { forgetKey, getKey } from "../../lib/key";
import { getMe, listUpcomingWalks, type Me, type Result, type Walk } from "../../lib/schedule";
import DogRow from "./DogRow";
import WalkCard from "./WalkCard";
import { CARD, FOCUS, PRIMARY, QUIET, SECONDARY, firstName } from "./format";

type Data = {
  walks: Result<Walk[]>;
  me: Result<Me> | null;
  /** `${walkId}:${dogId}` of my dogs that moved up from the waitlist while this page was open. */
  promoted: Set<string>;
};

const rowKey = (walkId: string, dogId: string) => `${walkId}:${dogId}`;

const LEDE = "Easy-paced community walks for the dogs on our roster and their people. Come stroll with the gaggle.";

/** Which of my dogs went from waitlisted to confirmed between two fetches (sticky until they leave). */
function promotions(prev: Data | null, next: Result<Me> | null): Set<string> {
  const out = new Set<string>();
  if (!next?.ok) return out;
  const before = prev?.me?.ok ? prev.me.data.rsvps : [];
  for (const r of next.data.rsvps) {
    if (r.standing !== "confirmed") continue;
    const k = rowKey(r.walk_id, r.dog_id);
    const old = before.find((b) => b.walk_id === r.walk_id && b.dog_id === r.dog_id);
    if (old?.standing === "waitlisted" || prev?.promoted.has(k)) out.add(k);
  }
  return out;
}

function Main({ children, busy = false }: { children: ReactNode; busy?: boolean }) {
  return (
    <main aria-busy={busy} className="mx-auto w-full max-w-xl px-4 pb-16 pt-6 text-espresso sm:pt-10">
      {children}
    </main>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 mt-10 flex items-center gap-2 font-display text-xl font-semibold text-espresso">
      <CalendarDays className="h-5 w-5 text-honey" aria-hidden="true" />
      {children}
    </h2>
  );
}

function Skeleton() {
  const bar = "rounded-full bg-sandstone/50 motion-safe:animate-pulse";
  return (
    <Main busy>
      <PageTop />
      <p role="status" className="sr-only">
        Loading walks…
      </p>
      <div aria-hidden="true">
        <div className={`mt-10 h-10 w-2/3 ${bar}`} />
        <div className={`mt-4 h-5 w-11/12 ${bar}`} />
        <div className={`mt-2 h-5 w-3/5 ${bar}`} />
        {[0, 1].map((i) => (
          <div key={i} className={`${CARD} mt-6 p-5`}>
            <div className="flex gap-4">
              <div className="h-[4.25rem] w-14 rounded-2xl bg-butter motion-safe:animate-pulse" />
              <div className="flex-1 space-y-2.5 pt-1">
                <div className={`h-3 w-1/4 ${bar}`} />
                <div className={`h-5 w-3/4 ${bar}`} />
                <div className={`h-3.5 w-1/2 ${bar}`} />
              </div>
            </div>
            <div className={`mt-5 h-6 w-36 ${bar}`} />
            <div className={`mt-4 h-4 w-4/5 ${bar}`} />
          </div>
        ))}
      </div>
    </Main>
  );
}

/** A friendly problem card: icon, headline, the server's own words, and one action. */
function Problem({
  icon: Icon,
  title,
  message,
  action,
  onAction,
  pending = false,
  quiet = false,
}: {
  icon: typeof WifiOff;
  title: string;
  message: string;
  action: string;
  onAction: () => void;
  pending?: boolean;
  quiet?: boolean;
}) {
  return (
    <section role="alert" className={`${CARD} mt-8 p-5 text-center sm:p-6`}>
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-butter ring-1 ring-sandstone">
        <Icon className="h-5 w-5 text-honey-dark" aria-hidden="true" />
      </span>
      <h2 className="mt-3 font-display text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-umber">{message}</p>
      <button
        type="button"
        onClick={onAction}
        disabled={pending}
        className={quiet ? `${SECONDARY} mt-4 px-5` : `${PRIMARY} mt-5 sm:w-auto`}
      >
        {pending && <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
        {action}
      </button>
    </section>
  );
}

function NoWalks() {
  return (
    <div className={`${CARD} p-6 text-center`}>
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-butter ring-1 ring-sandstone">
        <CalendarDays className="h-5 w-5 text-honey-dark" aria-hidden="true" />
      </span>
      <p className="mt-3 font-display text-lg font-semibold">No walks on the calendar just yet</p>
      <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-umber">
        New walks show up here as soon as they&apos;re posted. Check back soon.
      </p>
    </div>
  );
}

/** The gaggle interest path for visitors without a personal link. */
function JoinCard() {
  return (
    <section
      aria-labelledby="join-title"
      className="mt-10 overflow-hidden rounded-[2rem] border border-sandstone bg-gradient-to-b from-cream-soft to-butter shadow-[0_18px_44px_-24px_rgba(180,83,9,0.45)]"
    >
      <div className="p-6 sm:p-7">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-sandstone">
          <PawPrint className="h-6 w-6 text-honey" aria-hidden="true" />
        </span>
        <h2 id="join-title" className="mt-4 font-display text-2xl font-semibold leading-tight">
          New here? Come walk with us.
        </h2>
        <p className="mt-2 text-base leading-relaxed text-umber">
          Walks are for dogs on our roster, and getting on it starts with a hello. Tell us a little about your pup and a
          founder will reach out.
        </p>
        <a href="/#dog" className={`${PRIMARY} mt-5 sm:w-auto sm:px-8`}>
          Tell us about your dog
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
      <div className="border-t border-sandstone bg-white/60 px-6 py-4 sm:px-7">
        <p className="text-sm leading-relaxed text-umber">
          <span className="font-semibold text-espresso">Already on the roster?</span> Open the personal link we sent
          you. It brings you straight to your sign-ups.
        </p>
      </div>
    </section>
  );
}

function PublicWalks({ walks }: { walks: Result<Walk[]> }) {
  if (!walks.ok) return null;
  return (
    <>
      <SectionTitle>Coming up</SectionTitle>
      {walks.data.length === 0 ? (
        <NoWalks />
      ) : (
        <div className="space-y-5">
          {walks.data.map((w, i) => (
            <WalkCard key={w.id} walk={w} index={i} />
          ))}
        </div>
      )}
    </>
  );
}

/** /schedule: gaggle walk sign-ups. Public walk list without a key; owner view with a personal link. */
export default function SchedulePage() {
  const [key, setKey] = useState<string | null>(() => getKey());
  const [data, setData] = useState<Data | null>(null);
  const [stale, setStale] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const seq = useRef(0);

  const load = useCallback(async (k: string | null, quiet: boolean) => {
    const n = ++seq.current;
    const [walks, me] = await Promise.all([listUpcomingWalks(), k ? getMe(k) : Promise.resolve(null)]);
    if (n !== seq.current) return;
    setData((prev) => {
      // A blip on a background refresh keeps what's on screen instead of swapping in an error.
      if (quiet && prev && !walks.ok) return prev;
      return { walks, me, promoted: promotions(prev, me) };
    });
    setStale(quiet && !walks.ok);
  }, []);

  useEffect(() => {
    void load(key, false);
  }, [key, load]);

  // Coming back to the tab (say, from the text thread with the link): pick up any changes.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void load(key, true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [key, load]);

  const refresh = useCallback(() => load(key, true), [key, load]);

  async function retry() {
    setRetrying(true);
    await load(key, false);
    setRetrying(false);
  }

  function forget() {
    forgetKey();
    setOpenRow(null);
    setData(null);
    setKey(null);
    window.scrollTo({ top: 0 });
  }

  if (!data) return <Skeleton />;

  const { walks, me } = data;

  // Nothing reachable at all: one calm retry.
  if (!walks.ok && !me?.ok) {
    return (
      <Main>
        <PageTop title="Gaggle walks" lede={LEDE} />
        <Problem
          icon={WifiOff}
          title="We couldn't load the walks"
          message={walks.message}
          action={retrying ? "Trying…" : "Try again"}
          onAction={() => void retry()}
          pending={retrying}
        />
      </Main>
    );
  }

  // Signed out, or a personal link that didn't open.
  if (!key || !me?.ok) {
    return (
      <Main>
        <PageTop title="Gaggle walks" lede={LEDE} />
        {key && me && !me.ok && (
          <Problem
            icon={Link2Off}
            title="We couldn't open your personal link"
            message={me.message}
            action="Forget this link"
            onAction={forget}
            quiet
          />
        )}
        <PublicWalks walks={walks} />
        <JoinCard />
      </Main>
    );
  }

  const { person, dogs, rsvps } = me.data;

  return (
    <Main>
      <PageTop
        title={`Hi, ${firstName(person.name)}`}
        lede={
          dogs.length > 0
            ? "Here's what's coming up. Save a spot for your pup, and if plans change, no worries."
            : "Here's what's coming up with the gaggle."
        }
      >
        {person.is_admin && (
          <a
            href="/checkin"
            className={`mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-sandstone bg-white/80 px-4 text-sm font-semibold text-honey-dark hover:bg-butter ${FOCUS}`}
          >
            Open walk-day tools →
          </a>
        )}
      </PageTop>

      {stale && (
        <p
          role="status"
          className="mt-6 flex flex-wrap items-center gap-x-3 rounded-2xl bg-butter/70 px-4 py-2 text-sm text-umber ring-1 ring-sandstone"
        >
          Couldn&apos;t refresh just now, so this may be a little out of date.
          <button type="button" onClick={() => void refresh()} className={QUIET}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
        </p>
      )}

      {dogs.length === 0 && (
        <div className={`${CARD} mt-8 flex items-start gap-4 p-5`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-butter ring-1 ring-sandstone">
            <PawPrint className="h-5 w-5 text-honey" aria-hidden="true" />
          </span>
          <p className="pt-0.5 text-sm leading-relaxed text-umber">
            <span className="block font-display text-lg font-semibold text-espresso">No dogs on your account yet</span>A
            founder will add yours. Once they do, you can sign up right here.
          </p>
        </div>
      )}

      <SectionTitle>Upcoming walks</SectionTitle>
      {!walks.ok ? (
        <Problem
          icon={WifiOff}
          title="We couldn't load the walks"
          message={walks.message}
          action={retrying ? "Trying…" : "Try again"}
          onAction={() => void retry()}
          pending={retrying}
        />
      ) : walks.data.length === 0 ? (
        <NoWalks />
      ) : (
        <div className="space-y-5">
          {walks.data.map((w, i) => {
            const mineHere = rsvps.filter((r) => r.walk_id === w.id);
            return (
              <WalkCard key={w.id} walk={w} index={i} set={mineHere.some((r) => r.standing === "confirmed")}>
                {dogs.length > 0 && (
                  <div className="mt-5 border-t border-sandstone/80 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-umber">
                      {dogs.length === 1 ? "Your dog" : "Your dogs"}
                    </h4>
                    <ul className="divide-y divide-sandstone/70">
                      {dogs.map((d) => {
                        const k = rowKey(w.id, d.id);
                        return (
                          <DogRow
                            key={k}
                            apiKey={key}
                            walk={w}
                            dog={d}
                            mine={mineHere.find((r) => r.dog_id === d.id)}
                            open={openRow === k}
                            promoted={data.promoted.has(k)}
                            onToggle={(o) => setOpenRow(o ? k : null)}
                            onChanged={refresh}
                          />
                        );
                      })}
                    </ul>
                  </div>
                )}
              </WalkCard>
            );
          })}
        </div>
      )}

      <p className="mt-12 flex flex-wrap items-center justify-center gap-x-2 text-sm text-umber">
        Not you?
        <button type="button" onClick={forget} className={QUIET}>
          Forget this device
        </button>
      </p>
    </Main>
  );
}
