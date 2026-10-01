import { useEffect, useRef, useState, type FormEvent } from "react";
import { PawPrint, X } from "lucide-react";
import {
  submitDogSignup,
  submitPledge,
  submitVolunteer,
  type PledgeInput,
  type SubmitResult,
} from "../../lib/signup";

/**
 * SignupModal — signup dialog for the single-screen landing (ruling 7).
 * One form at a time (dog / volunteer / pledge), submitted through
 * src/lib/signup.ts; a successful submit swaps the form body for a
 * thank-you card so a double-tap cannot create a duplicate row.
 * A native <dialog> provides focus trapping and Escape handling;
 * "close" (Escape, backdrop, or buttons) is the single close path.
 */

export type SignupKind = "dog" | "volunteer" | "pledge";

const KIND_META: Record<
  SignupKind,
  { label: string; blurb: string; action: string; success: string; accent: string }
> = {
  dog: {
    label: "Join with your dog",
    blurb:
      "Tell us about you and your dog. Signing up joins the Gaggle of Goldens community walks, the first step toward therapy work.",
    action: "Join with my dog",
    success: "Welcome to the squad.",
    accent:
      "bg-ember hover:bg-ember-dark shadow-[0_10px_22px_-8px_rgba(194,58,43,0.6)]",
  },
  volunteer: {
    label: "Lend a hand",
    blurb:
      "Tell us who you are and how you’d like to help. No dog and no experience needed; we’ll find you a job that fits.",
    action: "Volunteer with us",
    success: "Welcome aboard.",
    accent:
      "bg-pine hover:bg-pine-dark shadow-[0_10px_22px_-8px_rgba(44,94,67,0.55)]",
  },
  pledge: {
    label: "Back the mission",
    blurb: "Pledges help us plan the launch with confidence.",
    action: "Back the mission",
    success: "Thank you.",
    accent:
      "bg-honey-dark hover:bg-honey-deep shadow-[0_10px_22px_-8px_rgba(180,83,9,0.55)]",
  },
};

const inputCls =
  "mt-1.5 w-full rounded-2xl border border-sandstone-deep/80 bg-white px-4 py-3 text-base text-espresso shadow-xs placeholder:text-umber/60 focus:border-honey-dark focus:outline-none focus:ring-3 focus:ring-honey/30";

const labelCls = "block text-sm font-semibold text-espresso";

const focusRing =
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-espresso";

const submitBtnCls = `inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-3.5 text-base font-bold text-white motion-safe:transition-[transform,background-color] motion-safe:hover:-translate-y-0.5 sm:w-auto disabled:opacity-60 ${focusRing}`;

// Five paw prints walking up into the success headline.
function PawTrail() {
  return (
    <div className="flex items-end gap-2 text-honey" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <PawPrint
          key={i}
          style={{ animationDelay: `${120 + i * 140}ms` }}
          className={`h-5 w-5 motion-safe:animate-step ${
            i % 2 ? "-translate-y-2 rotate-12" : "-rotate-12"
          } ${i === 4 ? "h-7 w-7 text-honey-dark" : "opacity-80"}`}
        />
      ))}
    </div>
  );
}

// Error-only: successful submissions swap the form body for a SuccessCard.
function FormStatus({ result }: { result: SubmitResult | null }) {
  if (!result || result.ok) return null;
  return (
    <p
      role="status"
      className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
    >
      {result.message}
    </p>
  );
}

function SuccessCard({
  result,
  headline,
  onClose,
}: {
  result: SubmitResult;
  headline: string;
  onClose: () => void;
}) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 pb-4 pt-6 text-center">
      <PawTrail />
      <p className="mt-2 font-display text-3xl font-bold tracking-tight text-espresso sm:text-4xl">
        {headline}
      </p>
      <p className="max-w-sm text-sm leading-relaxed text-umber">{result.message}</p>
      {result.demo && (
        <p className="rounded-full bg-butter px-3 py-1 text-xs font-semibold uppercase tracking-wide text-umber">
          Demo run · nothing was saved
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className={`mt-3 rounded-full border-2 border-sandstone bg-white px-8 py-2.5 font-bold text-espresso transition-colors hover:border-honey hover:bg-butter ${focusRing}`}
      >
        Close
      </button>
    </div>
  );
}

async function runSubmit(
  send: () => Promise<SubmitResult>,
  setPending: (v: boolean) => void,
  setResult: (r: SubmitResult | null) => void,
) {
  setPending(true);
  setResult(null);
  try {
    setResult(await send());
  } catch {
    setResult({
      ok: false,
      demo: false,
      message: "Something went wrong. Please try again.",
    });
  } finally {
    setPending(false);
  }
}

function DogFields() {
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <label>
        <span className={labelCls}>Your name *</span>
        <input name="ownerName" type="text" required autoComplete="name" maxLength={120} autoFocus className={inputCls} />
      </label>
      <label>
        <span className={labelCls}>Email *</span>
        <input name="email" type="email" required autoComplete="email" maxLength={254} className={inputCls} />
      </label>
      <label>
        <span className={labelCls}>Your dog&rsquo;s name *</span>
        <input name="dogName" type="text" required maxLength={60} className={inputCls} />
      </label>
      <label className="sm:col-span-2">
        <span className={labelCls}>Anything we should know about your dog?</span>
        <textarea name="notes" rows={3} maxLength={2000} className={inputCls} />
      </label>
    </fieldset>
  );
}

function VolunteerFields() {
  return (
    <fieldset className="grid gap-4">
      <label>
        <span className={labelCls}>Your name *</span>
        <input name="name" type="text" required autoComplete="name" maxLength={120} autoFocus className={inputCls} />
      </label>
      <label>
        <span className={labelCls}>Email *</span>
        <input name="email" type="email" required autoComplete="email" maxLength={254} className={inputCls} />
      </label>
      <label>
        <span className={labelCls}>How would you like to help?</span>
        <textarea name="interests" rows={3} maxLength={2000} className={inputCls} />
      </label>
    </fieldset>
  );
}

function PledgeFields() {
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <label>
        <span className={labelCls}>Your name *</span>
        <input name="name" type="text" required autoComplete="name" maxLength={120} autoFocus className={inputCls} />
      </label>
      <label>
        <span className={labelCls}>Email *</span>
        <input name="email" type="email" required autoComplete="email" maxLength={254} className={inputCls} />
      </label>
      <label>
        <span className={labelCls}>Pledge amount (USD)</span>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-umber">
            $
          </span>
          <input
            name="pledgeAmount"
            type="number"
            min={0}
            max={99999999}
            step={1}
            placeholder="25"
            className={`${inputCls} pl-7`}
          />
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-umber">
          We&rsquo;re not yet a 501(c)(3), so pledges are not tax-deductible.
        </p>
      </label>
      <label>
        <span className={labelCls}>Frequency</span>
        <select name="frequency" className={`${inputCls} h-[3.125rem]`} defaultValue="one-time">
          <option value="one-time">One-time</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>
    </fieldset>
  );
}

export default function SignupModal({
  kind,
  onClose,
}: {
  kind: SignupKind | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [shownKind, setShownKind] = useState(kind);

  // A newly opened form starts fresh (reset during render, not in an effect).
  if (kind !== shownKind) {
    setShownKind(kind);
    setResult(null);
  }

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (kind) {
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [kind]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    dlg.addEventListener("close", onClose);
    return () => dlg.removeEventListener("close", onClose);
  }, [onClose]);

  function close() {
    dialogRef.current?.close();
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!kind) return;
    const f = new FormData(e.currentTarget);
    const field = (n: string) => String(f.get(n) ?? "").trim();
    const send =
      kind === "dog"
        ? () =>
            submitDogSignup({
              ownerName: field("ownerName"),
              email: field("email"),
              dogName: field("dogName"),
              notes: field("notes") || undefined,
            })
        : kind === "volunteer"
          ? () =>
              submitVolunteer({
                name: field("name"),
                email: field("email"),
                interests: field("interests") || undefined,
              })
          : () =>
              submitPledge({
                name: field("name"),
                email: field("email"),
                pledgeAmount:
                  field("pledgeAmount") === "" ? undefined : Number(field("pledgeAmount")),
                frequency: field("frequency") as PledgeInput["frequency"],
              });
    void runSubmit(send, setPending, setResult);
  }

  const meta = kind ? KIND_META[kind] : null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="signup-modal-title"
      onMouseDown={(e) => {
        if (e.target === dialogRef.current) close();
      }}
      aria-describedby={result?.ok ? undefined : "signup-modal-blurb"}
      className="open:flex mb-0 mt-auto h-fit max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-[1.75rem] bg-cream-soft shadow-[0_-12px_50px_-12px_rgba(41,24,12,0.4)] ring-1 ring-sandstone backdrop:bg-espresso/55 backdrop:backdrop-blur-[2px] motion-safe:animate-sheet-up motion-safe:backdrop:animate-fade-in sm:m-auto sm:max-h-[90vh] sm:rounded-[1.75rem] sm:shadow-[0_25px_70px_-15px_rgba(41,24,12,0.4)] sm:motion-safe:animate-pop-in"
    >
      <span
        className="mx-auto mt-2.5 block h-1.5 w-10 shrink-0 rounded-full bg-sandstone-deep/35 sm:hidden"
        aria-hidden
      />
      <div className="flex shrink-0 items-start justify-between gap-3 px-6 pt-4 sm:px-10 sm:pt-9">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-butter text-honey ring-1 ring-sandstone">
            <PawPrint className="h-5 w-5" aria-hidden />
          </span>
          <h2
            id="signup-modal-title"
            className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-espresso sm:text-3xl"
          >
            {meta?.label}
          </h2>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className={`-mr-2 rounded-full p-2.5 text-umber transition-colors hover:bg-butter hover:text-espresso ${focusRing}`}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-initial overflow-y-auto px-6 pb-7 pt-3 sm:px-10 sm:pb-10 sm:pt-4">
        {meta && !result?.ok && (
          <p id="signup-modal-blurb" className="mb-5 text-[0.95rem] leading-relaxed text-umber">
            {meta.blurb}
          </p>
        )}

        {result?.ok ? (
          <SuccessCard result={result} headline={meta?.success ?? "Thank you."} onClose={close} />
        ) : (
          <form onSubmit={handleSubmit}>
            {kind === "dog" && <DogFields />}
            {kind === "volunteer" && <VolunteerFields />}
            {kind === "pledge" && <PledgeFields />}

            <div className="mt-6 flex flex-col items-start gap-3">
              <button type="submit" disabled={pending} className={`${submitBtnCls} ${meta?.accent ?? ""}`}>
                {pending ? "Sending…" : meta?.action}
              </button>
              <FormStatus result={result} />
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
