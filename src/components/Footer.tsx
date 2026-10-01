import { useState, type FormEvent } from "react";
import { LoaderCircle, PawPrint } from "lucide-react";
import { subscribe, type SubmitResult } from "../lib/signup";

// Founder's-note slot (ruling 19): renders nothing until the founder supplies
// the sentence. Never fill this with an invented quote.
const FOUNDER_NOTE: { text: string; by: string } | null = null;

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

  const note = FOUNDER_NOTE as { text: string; by: string } | null;

  return (
    <footer>
      {note && (
        <figure className="mx-auto max-w-2xl px-4 pb-10 text-center sm:px-6">
          <blockquote className="font-display text-xl italic leading-snug text-espresso sm:text-2xl">
            “{note.text}”
          </blockquote>
          <figcaption className="mt-2 text-sm text-umber">{note.by}</figcaption>
        </figure>
      )}

      <div className="mx-auto max-w-xl px-4 pb-12 text-center sm:px-6 sm:pb-16">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label
            htmlFor="newsletter-email"
            className="font-display text-xl font-semibold text-espresso sm:text-2xl"
          >
            Kickoff details and squad news.
          </label>
          <div className="flex gap-2 rounded-full border border-sandstone bg-white p-1.5 shadow-[0_8px_22px_-14px_rgba(120,60,10,0.45)] focus-within:border-honey focus-within:ring-3 focus-within:ring-honey/25">
            <input
              id="newsletter-email"
              type="email"
              name="email"
              required
              placeholder="you@email.com"
              autoComplete="email"
              className="min-w-0 flex-1 rounded-full bg-transparent px-3.5 text-base text-espresso outline-none placeholder:text-umber/60"
            />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-pine px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pine-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-espresso disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:text-base"
            >
              {pending ? (
                <LoaderCircle
                  className="h-5 w-5 motion-safe:animate-spin"
                  aria-label="Sending"
                />
              ) : (
                "Keep me posted"
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

      <div className="border-t-2 border-sandstone/80 bg-cream-soft/80 px-4 py-7 text-center">
        <p className="inline-flex items-center gap-2 font-display text-lg italic text-espresso">
          <PawPrint className="h-4 w-4 text-honey" aria-hidden />
          In memory of Mochi
        </p>
        <p className="mt-1 text-xs text-umber">
          Not yet a 501(c)(3), so pledges are not tax-deductible.
        </p>
      </div>
    </footer>
  );
}
