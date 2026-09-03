import { useState, type FormEvent } from "react";
import { Dog, HandHeart, HeartHandshake, Info } from "lucide-react";
import {
  submitDogSignup,
  submitPledge,
  submitVolunteer,
  type SubmitResult,
} from "../../lib/signup";
import Newsletter from "./Newsletter";

/**
 * SignupTabs — the #signup section: three tabbed forms (pane w2:p4).
 *
 * Dog owner / Volunteer / Pledge, each calling p7's src/lib/signup.ts
 * RPC wrappers. Field names map 1:1 to DogSignupInput / VolunteerInput /
 * PledgeInput; result messaging renders SubmitResult.message verbatim
 * (demo mode explains itself). Copy discipline: volunteer skills are
 * generic; visit requests stay within the Track B ceiling (senior
 * living / nursing / community events — no hospitals, no hospice); the
 * pledge tab carries the not-yet-501(c)(3) notice.
 */

type TabId = "dog" | "volunteer" | "pledge";

const TABS: { id: TabId; label: string; blurb: string }[] = [
  {
    id: "dog",
    label: "Register a dog",
    blurb: "Tell us about you and your dog — we’ll reach out about next steps.",
  },
  {
    id: "volunteer",
    label: "Volunteer",
    blurb: "Lend a hand at events and visits — no experience required.",
  },
  {
    id: "pledge",
    label: "Pledge support",
    blurb: "Back the mission — every pledge helps us plan with confidence.",
  },
];

const SKILL_OPTIONS = [
  "Event help",
  "Dog handling",
  "Photography",
  "Community outreach",
  "Fundraising",
  "Other",
];

const AVAILABILITY_OPTIONS = ["Weekdays", "Weekends", "Evenings", "Flexible"];

const inputCls =
  "mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-800 shadow-sm placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30";

const labelCls = "block text-sm font-medium text-stone-700";

const submitBtnCls =
  "inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60";

function FormStatus({ result }: { result: SubmitResult | null }) {
  if (!result) return null;
  return (
    <p
      role="status"
      className={`rounded-xl border px-4 py-3 text-sm ${
        !result.ok
          ? "border-red-300 bg-red-50 text-red-900"
          : result.demo
            ? "border-amber-300 bg-amber-50 text-amber-900"
            : "border-green-300 bg-green-50 text-green-900"
      }`}
    >
      {result.message}
    </p>
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

function DogForm() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void runSubmit(
      () =>
        submitDogSignup({
          ownerName: String(f.get("ownerName")).trim(),
          email: String(f.get("email")).trim(),
          dogName: String(f.get("dogName")).trim(),
          phone: String(f.get("phone") || "").trim() || undefined,
          breed: String(f.get("breed") || "").trim() || undefined,
          age: String(f.get("age") || "").trim() || undefined,
          city: String(f.get("city") || "").trim() || undefined,
          notes: String(f.get("notes") || "").trim() || undefined,
        }),
      setPending,
      setResult,
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={labelCls}>Your name *</span>
          <input name="ownerName" type="text" required autoComplete="name" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Email *</span>
          <input name="email" type="email" required autoComplete="email" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Your dog&rsquo;s name *</span>
          <input name="dogName" type="text" required className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Phone</span>
          <input name="phone" type="tel" autoComplete="tel" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Breed</span>
          <input name="breed" type="text" placeholder="e.g. golden retriever" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Age</span>
          <input name="age" type="text" placeholder="e.g. 4 years" className={inputCls} />
        </label>
        <label className="sm:col-span-2">
          <span className={labelCls}>City</span>
          <input name="city" type="text" autoComplete="address-level2" className={inputCls} />
        </label>
        <label className="sm:col-span-2">
          <span className={labelCls}>Anything we should know?</span>
          <textarea name="notes" rows={3} className={inputCls} />
        </label>
      </div>
      <div className="mt-5 flex flex-col items-start gap-3">
        <button type="submit" disabled={pending} className={submitBtnCls}>
          {pending ? "Sending…" : "Register your dog"}
        </button>
        <FormStatus result={result} />
      </div>
    </form>
  );
}

function VolunteerForm() {
  const [skills, setSkills] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  function toggleSkill(s: string) {
    setSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void runSubmit(
      () =>
        submitVolunteer({
          name: String(f.get("name")).trim(),
          email: String(f.get("email")).trim(),
          phone: String(f.get("phone") || "").trim() || undefined,
          skills: skills.length > 0 ? skills : undefined,
          availability: String(f.get("availability") || "") || undefined,
          interests: String(f.get("interests") || "").trim() || undefined,
        }),
      setPending,
      setResult,
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={labelCls}>Your name *</span>
          <input name="name" type="text" required autoComplete="name" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Email *</span>
          <input name="email" type="email" required autoComplete="email" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Phone</span>
          <input name="phone" type="tel" autoComplete="tel" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Availability</span>
          <select name="availability" className={inputCls} defaultValue="">
            <option value="">Select…</option>
            {AVAILABILITY_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className={labelCls}>How can you help?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SKILL_OPTIONS.map((s) => {
            const active = skills.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => toggleSkill(s)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-amber-600 bg-amber-600 text-white shadow-sm"
                    : "border-stone-300 bg-white text-stone-600 hover:border-amber-400 hover:text-amber-800"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-4 block">
        <span className={labelCls}>Tell us more</span>
        <textarea name="interests" rows={3} className={inputCls} />
      </label>

      <div className="mt-5 flex flex-col items-start gap-3">
        <button type="submit" disabled={pending} className={submitBtnCls}>
          {pending ? "Sending…" : "Volunteer with us"}
        </button>
        <FormStatus result={result} />
      </div>
    </form>
  );
}

function PledgeForm() {
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void runSubmit(
      () =>
        submitPledge({
          name: String(f.get("name")).trim(),
          email: String(f.get("email")).trim(),
          pledgeAmount: amount.trim() === "" ? undefined : Number(amount),
          frequency: (String(f.get("frequency")) || undefined) as
            | "one-time"
            | "monthly"
            | "yearly"
            | undefined,
          visitRequest: String(f.get("visitRequest") || "").trim() || undefined,
          message: String(f.get("message") || "").trim() || undefined,
        }),
      setPending,
      setResult,
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          Mochi&rsquo;s Legacy is not yet a 501(c)(3) organization — pledges
          are not tax-deductible at this time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={labelCls}>Your name *</span>
          <input name="name" type="text" required autoComplete="name" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Email *</span>
          <input name="email" type="email" required autoComplete="email" className={inputCls} />
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
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="25"
              className={`${inputCls} pl-7`}
            />
          </div>
        </label>
        <label>
          <span className={labelCls}>Frequency</span>
          <select name="frequency" className={inputCls} defaultValue="one-time">
            <option value="one-time">One-time</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className={labelCls}>Visit request</span>
          <input
            name="visitRequest"
            type="text"
            placeholder="e.g. a senior living community or community event"
            className={inputCls}
          />
        </label>
        <label className="sm:col-span-2">
          <span className={labelCls}>Anything else?</span>
          <textarea name="message" rows={3} className={inputCls} />
        </label>
      </div>

      <div className="mt-5 flex flex-col items-start gap-3">
        <button type="submit" disabled={pending} className={submitBtnCls}>
          {pending ? "Sending…" : "Pledge your support"}
        </button>
        <FormStatus result={result} />
      </div>
    </form>
  );
}

export default function SignupTabs() {
  const [tab, setTab] = useState<TabId>("dog");
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <section id="signup" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-700">
          Get involved
        </p>
        <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-stone-800 sm:text-4xl">
          Join the squad
        </h2>
        <p className="mt-5 leading-relaxed text-stone-600">
          Register your dog, lend a hand, or fuel the mission — one form,
          three ways to help Mochi&rsquo;s Legacy show up for Boulder.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Signup options"
        className="mt-8 flex flex-wrap gap-2"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors sm:px-5 ${
              tab === t.id
                ? "border-amber-600 bg-amber-600 text-white shadow-sm"
                : "border-stone-300 bg-white/70 text-stone-600 hover:border-amber-400 hover:text-amber-800"
            }`}
          >
            {t.id === "dog" && <Dog className="h-4 w-4" aria-hidden />}
            {t.id === "volunteer" && (
              <HeartHandshake className="h-4 w-4" aria-hidden />
            )}
            {t.id === "pledge" && <HandHeart className="h-4 w-4" aria-hidden />}
            {t.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${active.id}`}
        aria-labelledby={`tab-${active.id}`}
        className="mt-4 rounded-2xl border border-amber-200/80 bg-white/70 p-6 shadow-sm sm:p-8"
      >
        <p className="mb-5 text-sm leading-relaxed text-stone-600">{active.blurb}</p>
        {tab === "dog" && <DogForm />}
        {tab === "volunteer" && <VolunteerForm />}
        {tab === "pledge" && <PledgeForm />}
      </div>

      <div className="mt-6">
        <Newsletter />
      </div>
    </section>
  );
}
