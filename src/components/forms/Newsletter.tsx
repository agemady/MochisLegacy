import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { subscribe, type SubmitResult } from "../../lib/signup";

/**
 * Newsletter — standalone email-capture card (pane w2:p4).
 *
 * Calls p7's subscribe() from src/lib/signup.ts. Result messaging is
 * rendered verbatim from SubmitResult.message so demo/real modes both
 * read correctly. Exported for direct use (e.g. footer slot) and also
 * composed at the bottom of SignupTabs.
 */
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setResult(null);
    try {
      const r = await subscribe({ email: email.trim() });
      setResult(r);
      if (r.ok) setEmail("");
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

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-white/70 p-6 shadow-sm sm:p-8">
      <h3 className="text-lg font-semibold text-stone-800">Stay in the loop</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        Squad news, event dates, and ways to help — a short note when
        there&rsquo;s something worth sharing. No spam, ever.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-full border border-stone-300 bg-white px-4 py-2.5 text-stone-800 shadow-sm placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" aria-hidden />
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      {result && (
        <p
          role="status"
          className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
            result.ok
              ? "border-green-300 bg-green-50 text-green-900"
              : "border-red-300 bg-red-50 text-red-900"
          }`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
