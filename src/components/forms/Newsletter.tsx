import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { subscribe, type SubmitResult } from "../../lib/signup";

/**
 * Newsletter — ruling 8: one inline row (microcopy + email + button).
 * No card, no heading, no "no spam" promise. Composed by Footer.tsx,
 * which owns the surrounding memorial/tax line.
 */
export default function Newsletter() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    if (!email) return;
    setPending(true);
    setResult(null);
    void subscribe({ email })
      .then((r) => setResult(r))
      .finally(() => setPending(false));
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center"
      >
        <p className="text-sm text-stone-600 sm:shrink-0">Squad news, occasionally.</p>
        <input
          type="email"
          name="email"
          required
          placeholder="you@email.com"
          aria-label="Email address"
          autoComplete="email"
          className="min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-4 py-2 text-base text-stone-800 outline-none placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            "Notify me"
          )}
        </button>
      </form>
      {result && (
        <p
          role="status"
          className={`text-sm ${result.ok ? "text-green-700" : "text-red-700"}`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
