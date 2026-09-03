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

const KIND_META: Record<SignupKind, { label: string; blurb: string; action: string }> = {
  dog: {
    label: "Join with your dog",
    blurb:
      "Tell us about you and your dog — signing up joins the Gaggle of Goldens community walks, the first step toward therapy work.",
    action: "Join with my dog",
  },
  volunteer: {
    label: "Lend a hand",
    blurb:
      "Tell us who you are and how you’d like to help — no dog and no experience needed; we’ll find you a job that fits.",
    action: "Volunteer with us",
  },
  pledge: {
    label: "Back the mission",
    blurb: "Pledges help us plan the launch with confidence.",
    action: "Back the mission",
  },
};

const inputCls =
  "mt-1.5 w-full rounded-2xl border-[1.5px] border-[#E6CCA0] bg-white px-4 py-3 text-base text-[#29180C] shadow-xs placeholder:text-stone-400 focus:border-[#D97706] focus:outline-none focus:ring-3 focus:ring-[#D97706]/20 transition-all";

const labelCls = "block text-sm font-semibold text-[#29180C]";

const submitBtnCls =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D97706] to-[#B45309] px-8 py-3.5 font-bold text-white shadow-[0_6px_18px_-3px_rgba(217,119,6,0.45)] hover:shadow-[0_10px_22px_-3px_rgba(217,119,6,0.55)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50";

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

function SuccessCard({ result, onClose }: { result: SubmitResult; onClose: () => void }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#F3D9A2] bg-[#FFF3D6] text-[#D97706]">
        <PawPrint className="h-7 w-7" aria-hidden />
      </span>
      <p className="font-display text-3xl font-bold text-[#29180C]">You&rsquo;re in!</p>
      <p className="max-w-sm text-sm leading-relaxed text-[#6B5545]">{result.message}</p>
      {result.demo && (
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B5545]/70">
          Demo run — nothing was saved
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="mt-2 rounded-full border-2 border-[#E6CCA0] bg-white px-8 py-2.5 font-bold text-[#29180C] transition-colors hover:bg-[#FFF8EB]"
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
      message: "Something went wrong — please try again.",
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
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-stone-400">
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
        <p className="mt-1.5 text-xs leading-relaxed text-[#6B5545]">
          We&rsquo;re not yet a 501(c)(3), so pledges are not tax-deductible.
        </p>
      </label>
      <label>
        <span className={labelCls}>Frequency</span>
        <select name="frequency" className={inputCls} defaultValue="one-time">
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

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (kind) {
      setResult(null);
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
      className="m-auto flex h-[100dvh] w-full max-w-2xl flex-col border border-[#F3D9A2] bg-[#FDFBF7] shadow-[0_25px_70px_-15px_rgba(41,24,12,0.35)] backdrop:bg-[#29180C]/50 backdrop:backdrop-blur-xs sm:h-auto sm:max-h-[90vh] sm:rounded-[2rem]"
    >
      <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-6 sm:px-10 sm:pt-10">
        <div className="flex items-center gap-2.5">
          <PawPrint className="h-6 w-6 text-[#D97706]" aria-hidden />
          <h2
            id="signup-modal-title"
            className="font-display text-2xl font-bold tracking-tight text-[#29180C] sm:text-3xl"
          >
            {meta?.label}
          </h2>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="rounded-full p-2 text-[#6B5545] transition-colors hover:bg-[#FFF8EB] hover:text-[#29180C]"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-3 sm:px-10 sm:pb-10 sm:pt-4">
        {meta && (
          <p className="mb-5 text-sm leading-relaxed text-[#6B5545]">{meta.blurb}</p>
        )}

        {result?.ok ? (
          <SuccessCard result={result} onClose={close} />
        ) : (
          <form onSubmit={handleSubmit}>
            {kind === "dog" && <DogFields />}
            {kind === "volunteer" && <VolunteerFields />}
            {kind === "pledge" && <PledgeFields />}

            <div className="mt-5 flex flex-col items-start gap-3">
              <button type="submit" disabled={pending} className={submitBtnCls}>
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
