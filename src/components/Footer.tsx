import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
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
    <footer className="border-t border-[#F3D9A2] bg-[#FFF8EB]/60 py-10">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="font-display italic text-base text-[#29180C]">
          In memory of Mochi · Not yet a 501(c)(3), so pledges are not
          tax-deductible.
        </p>
        <div className="mt-4 flex flex-col items-center gap-2">
          <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center"
          >
            <p className="text-sm text-[#6B5545] sm:shrink-0">
              Squad news and the October kickoff.
            </p>
            <input
              type="email"
              name="email"
              required
              placeholder="you@email.com"
              aria-label="Email address"
              autoComplete="email"
              className="min-w-0 flex-1 rounded-full border border-[#E6CCA0] bg-white px-4 py-2 text-base text-[#29180C] outline-none placeholder:text-[#6B5545]/50 focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/30"
            />
            <button
              type="submit"
              disabled={pending}
              className="shrink-0 rounded-full bg-[#2C5E43] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#234c36] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                "Subscribe"
              )}
            </button>
          </form>
          {result && (
            <p
              role="status"
              className={`text-sm ${result.ok ? "text-[#2C5E43]" : "text-red-800"}`}
            >
              {result.message}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
