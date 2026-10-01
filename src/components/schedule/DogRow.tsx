import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Check, Clock, LoaderCircle, RotateCcw } from "lucide-react";
import { optOut, rsvp, spotsLeft, type MyDog, type MyRsvp, type Walk } from "../../lib/schedule";
import { FOCUS, PRIMARY, QUIET, SECONDARY, hasStarted, shortDate } from "./format";

type Tone = "yes" | "wait" | "calm";
/** A result message, shown only while the dog's standing is still the one it describes. */
type Note = { tone: Tone; text: string; at: string };
type Failure = { action: "rsvp" | "out"; text: string };

const standingKey = (r?: { standing: string; waitlist_position: number | null } | null) =>
  r ? `${r.standing}:${r.waitlist_position ?? ""}` : "none";

function Spinner() {
  return <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />;
}

function Failed({ text, onRetry, pending }: { text: string; onRetry?: () => void; pending?: boolean }) {
  return (
    <div role="alert" className="mt-3 rounded-2xl bg-[#fdf1e9] px-4 py-3 text-sm text-[#8a3a12] ring-1 ring-[#f0cdb6]">
      <p className="font-semibold">{text}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} disabled={pending} className={`${QUIET} mt-1 !text-[#8a3a12]`}>
          {pending ? <Spinner /> : <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
          {pending ? "Saving…" : "Try again"}
        </button>
      )}
    </div>
  );
}

function Avatar({ name, mine }: { name: string; mine?: MyRsvp }) {
  const base = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full";
  if (mine?.standing === "confirmed") {
    return (
      <span className={`${base} bg-pine text-white shadow-[0_6px_14px_-6px_rgba(44,94,67,0.8)]`} aria-hidden="true">
        <Check className="h-5 w-5" strokeWidth={3} />
      </span>
    );
  }
  if (mine?.standing === "waitlisted") {
    return (
      <span className={`${base} bg-butter font-display text-base font-bold text-honey-dark ring-2 ring-honey/60`} aria-hidden="true">
        {mine.waitlist_position ? `#${mine.waitlist_position}` : <Clock className="h-5 w-5" />}
      </span>
    );
  }
  return (
    <span className={`${base} bg-gradient-to-b from-cream-soft to-butter font-display text-lg font-bold text-honey-dark ring-1 ring-sandstone`} aria-hidden="true">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** One of my dogs on one walk: its standing, sign-up panel, and opt-out. */
export default function DogRow({
  apiKey,
  walk,
  dog,
  mine,
  open,
  promoted,
  onToggle,
  onChanged,
}: {
  apiKey: string;
  walk: Walk;
  dog: MyDog;
  mine?: MyRsvp;
  open: boolean;
  promoted: boolean;
  onToggle: (open: boolean) => void;
  onChanged: () => Promise<void>;
}) {
  const ids = useId();
  const nameId = `${ids}-name`;
  const panelId = `${ids}-panel`;
  const waiverHelpId = `${ids}-waiver-help`;
  const waiverErrId = `${ids}-waiver-err`;

  const [waiver, setWaiver] = useState(false);
  const [photo, setPhoto] = useState(false);
  const [waiverMissing, setWaiverMissing] = useState(false);
  const [pending, setPending] = useState<"rsvp" | "out" | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [confirmingOut, setConfirmingOut] = useState(false);

  const waiverRef = useRef<HTMLInputElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const focusRow = useRef(false);

  // After an action the button that was pressed goes away; keep focus on this dog's row.
  useEffect(() => {
    if (note && focusRow.current) {
      focusRow.current = false;
      groupRef.current?.focus();
    }
  }, [note]);

  const name = dog.name;
  const started = hasStarted(walk.starts_at);
  const full = spotsLeft(walk) === 0;
  const checkedIn = Boolean(mine?.checked_in_at);

  function toggle() {
    setNote(null);
    setFailure(null);
    setWaiverMissing(false);
    onToggle(!open);
  }

  async function save(e?: FormEvent) {
    e?.preventDefault();
    if (pending) return;
    if (!waiver) {
      setWaiverMissing(true);
      waiverRef.current?.focus();
      return;
    }
    setPending("rsvp");
    setFailure(null);
    setNote(null);
    const r = await rsvp(apiKey, walk.id, dog.id, { waiverSigned: true, photoConsent: photo });
    if (!r.ok) {
      setPending(null);
      setFailure({ action: "rsvp", text: r.message });
      return;
    }
    await onChanged();
    setPending(null);
    setWaiver(false);
    setPhoto(false);
    focusRow.current = true;
    setNote(
      r.data.standing === "confirmed"
        ? { tone: "yes", at: standingKey(r.data), text: `You're walking! ${name} is in for ${shortDate(walk.starts_at)}.` }
        : {
            tone: "wait",
            at: standingKey(r.data),
            text: `${name} is ${r.data.waitlist_position ? `#${r.data.waitlist_position} ` : ""}on the waitlist. We'll move you up automatically if a spot opens.`,
          },
    );
    onToggle(false);
  }

  async function giveUp() {
    if (pending) return;
    const wasWaitlisted = mine?.standing === "waitlisted";
    setPending("out");
    setFailure(null);
    setNote(null);
    const r = await optOut(apiKey, walk.id, dog.id);
    if (!r.ok) {
      setPending(null);
      setConfirmingOut(false);
      setFailure({ action: "out", text: r.message });
      return;
    }
    await onChanged();
    setPending(null);
    setConfirmingOut(false);
    focusRow.current = true;
    setNote({
      tone: "calm",
      at: "none",
      text: wasWaitlisted
        ? `No worries, ${name} is off the waitlist. See you next time!`
        : `No worries, ${name} is off this one. See you next time!`,
    });
  }

  const tone: Record<Tone, string> = { yes: "text-pine", wait: "text-honey-dark", calm: "text-umber" };
  let line: { text: string; className: string };
  const current = note && note.at === standingKey(mine) ? note : null;
  if (current) line = { text: current.text, className: `font-semibold ${tone[current.tone]}` };
  else if (promoted && mine?.standing === "confirmed")
    line = { text: `Good news! A spot opened up and ${name} is walking.`, className: "font-semibold text-pine" };
  else if (checkedIn) line = { text: "Checked in · have a great walk!", className: "font-semibold text-pine" };
  else if (mine?.standing === "confirmed") line = { text: "Walking · spot saved", className: "font-semibold text-pine" };
  else if (mine?.standing === "waitlisted")
    line = {
      text: `Waitlist${mine.waitlist_position ? ` #${mine.waitlist_position}` : ""} · moves up automatically`,
      className: "font-semibold text-honey-dark",
    };
  else if (started) line = { text: "Sign-ups are closed", className: "text-umber" };
  else line = { text: "Not signed up yet", className: "text-umber" };

  return (
    <li className="py-4 first:pt-3 last:pb-1">
      <div ref={groupRef} tabIndex={-1} role="group" aria-labelledby={nameId} className="rounded-2xl outline-none">
        <div className="flex items-start gap-3">
          <Avatar name={name} mine={mine} />
          <div className="min-w-0 flex-1 pt-0.5">
            <p id={nameId} className="truncate text-base font-bold text-espresso">
              {name}
            </p>
            <div aria-live="polite">
              <p key={line.text} className={`text-sm leading-snug ${line.className} ${current ? "motion-safe:animate-fade-up" : ""}`}>
                {line.text}
              </p>
            </div>

            {mine && !checkedIn && (
              <div className="mt-1">
                {confirmingOut && pending !== "out" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void giveUp()}
                      className={`inline-flex min-h-11 items-center rounded-2xl border-2 border-honey-dark/70 bg-white px-4 py-2 text-left text-sm font-bold text-honey-dark hover:bg-butter ${FOCUS}`}
                    >
                      {mine.standing === "waitlisted" ? "Tap again to leave the waitlist" : `Tap again to give up ${name}'s spot`}
                    </button>
                    <p className="flex flex-wrap items-center gap-x-3 text-xs text-umber">
                      No worries, plans change.
                      <button type="button" onClick={() => setConfirmingOut(false)} className={QUIET}>
                        Keep it
                      </button>
                    </p>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingOut(true)}
                    disabled={pending !== null}
                    className={QUIET}
                  >
                    {pending === "out" ? (
                      <>
                        <Spinner /> Saving…
                      </>
                    ) : (
                      "Can't make it?"
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {!mine && !started && (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-controls={open ? panelId : undefined}
              className={`${SECONDARY} mt-0.5 shrink-0 ${open ? "!border-sandstone !text-umber" : ""}`}
            >
              {open ? "Not now" : full ? "Join waitlist" : "Sign up"}
              {!open && <span className="sr-only"> {name}</span>}
            </button>
          )}
        </div>

        {open && !mine && !started && (
          <form
            id={panelId}
            onSubmit={save}
            noValidate
            className="mt-3 rounded-3xl border border-sandstone bg-cream-soft/80 p-4 motion-safe:animate-fade-up sm:p-5"
          >
            <fieldset disabled={pending !== null} className="min-w-0">
              <legend className="sr-only">
                Sign {name} up for {walk.title}, {shortDate(walk.starts_at)}
              </legend>
              {full && (
                <p className="mb-3 text-sm leading-relaxed text-umber">
                  This walk is full right now. Join the waitlist and we&apos;ll move {name} up automatically if a spot opens.
                </p>
              )}

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 has-checked:bg-butter/50 has-checked:ring-honey ${
                  waiverMissing && !waiver ? "ring-2 ring-[#c2410c]" : "ring-sandstone"
                }`}
              >
                <input
                  ref={waiverRef}
                  type="checkbox"
                  required
                  checked={waiver}
                  onChange={(e) => {
                    setWaiver(e.target.checked);
                    if (e.target.checked) setWaiverMissing(false);
                  }}
                  aria-describedby={waiverMissing && !waiver ? `${waiverHelpId} ${waiverErrId}` : waiverHelpId}
                  aria-invalid={waiverMissing && !waiver ? true : undefined}
                  className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-honey-dark ${FOCUS}`}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug text-espresso">
                    I agree to the walk waiver for this outing
                  </span>
                  <span id={waiverHelpId} className="mt-0.5 block text-xs leading-relaxed text-umber">
                    Required. One signature per walk, so every outing is covered.
                  </span>
                </span>
              </label>
              {waiverMissing && !waiver && (
                <p id={waiverErrId} role="alert" className="mt-2 px-1 text-sm font-semibold text-[#9a3412]">
                  Please check the waiver box to save {name}&apos;s spot.
                </p>
              )}

              <label className="mt-2.5 flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-sandstone has-checked:bg-butter/50 has-checked:ring-honey">
                <input
                  type="checkbox"
                  checked={photo}
                  onChange={(e) => setPhoto(e.target.checked)}
                  className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-honey-dark ${FOCUS}`}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug text-espresso">
                    It&apos;s OK to include my dog in group photos
                  </span>
                  <span className="mt-0.5 block text-xs text-umber">Optional</span>
                </span>
              </label>

              {failure?.action === "rsvp" && <Failed text={failure.text} />}

              <button type="submit" className={`${PRIMARY} mt-4`} aria-busy={pending === "rsvp"}>
                {pending === "rsvp" ? (
                  <>
                    <Spinner /> Saving…
                  </>
                ) : failure?.action === "rsvp" ? (
                  "Try again"
                ) : full ? (
                  "Join the waitlist"
                ) : (
                  `Save ${name}'s spot`
                )}
              </button>
            </fieldset>
          </form>
        )}

        {failure?.action === "out" && (
          <Failed text={failure.text} onRetry={() => void giveUp()} pending={pending === "out"} />
        )}
      </div>
    </li>
  );
}
