import { useState, type FormEvent } from "react";
import { LoaderCircle, PawPrint } from "lucide-react";
import { subscribe, type SubmitResult } from "../lib/signup";

export default function Footer() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    if (!email) return;
    setPending(true);
    setResult(null);
    void subscribe({ email })
      .then((r) => setResult(r))
      .finally(() => setPending(false));
  }

  return (
    <footer className="border-t-2 border-sandstone bg-cream-soft/60 py-12">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="font-display text-lg italic text-espresso sm:text-xl">
          <PawPrint className="mr-1.5 inline h-4 w-4 text-honey" aria-hidden />
          In memory of Mochi
        </p>
        <p className="mt-1 text-xs text-umber sm:text-sm">
          Not yet a 501(c)(3), so pledges are not tax-deductible.
        </p>
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-6 flex w-full max-w-lg flex-col gap-2"
        >
          <p className="text-sm font-semibold text-espresso">
            Squad news and the October kickoff.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              name="email"
              required
              placeholder="you@email.com"
              aria-label="Email address"
              autoComplete="email"
              className="min-w-0 flex-1 rounded-full border border-[#E6CCA0] bg-white px-4 py-2.5 text-base text-espresso outline-none placeholder:text-umber/50 focus:border-honey focus:ring-2 focus:ring-honey/30"
            />
            <button
              type="submit"
              disabled={pending}
              className="shrink-0 rounded-full bg-pine px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#234c36] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                "Subscribe"
              )}
            </button>
          </div>
          {result && (
            <p
              role="status"
              className={`text-sm ${result.ok ? "text-pine" : "text-red-800"}`}
            >
              {result.message}
            </p>
          )}
        </form>
      </div>
    </footer>
  );
}
