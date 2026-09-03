import { useState, type FormEvent } from "react";
import { isSupabaseConfigured } from "../lib/supabase";
import { signInWithOtp } from "../lib/auth";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || pending) return;
    setPending(true);
    setSuccess(null);
    setError(null);
    const { error: message } = await signInWithOtp(email.trim());
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    setSuccess("Check your email for a sign-in link.");
    setEmail("");
  }

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-white/70 p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold text-stone-800">Sign in</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        Enter your email and we&rsquo;ll send a one-time sign-in link.
      </p>
      {!isSupabaseConfigured && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          Demo mode — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to send a
          real sign-in link. Submissions are not sent.
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <label className="block text-sm font-medium text-stone-700">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-800 shadow-sm placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </label>
        <button
          type="submit"
          disabled={pending || !isSupabaseConfigured}
          className="inline-flex items-center justify-center rounded-full bg-amber-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send me a sign-in link"}
        </button>
      </form>
      {success && (
        <p
          role="status"
          className="mt-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900"
        >
          {success}
        </p>
      )}
      {error && (
        <p
          role="status"
          className="mt-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {error}
        </p>
      )}
    </div>
  );
}
