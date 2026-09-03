import { useEffect, useState, type FormEvent } from "react";
import { getSupabase } from "../lib/supabase";
import { signInWithOtp } from "../lib/auth";

export default function SignIn() {
  const [configured, setConfigured] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getSupabase().then((client) => setConfigured(client !== null));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!configured || pending) return;
    setPending(true);
    setError(null);
    const { error: message } = await signInWithOtp(email.trim());
    setPending(false);
    if (message) {
      setError("That link didn’t work — enter your email for a fresh one.");
      return;
    }
    setSent(true);
    setEmail("");
  }

  return (
    <div className="rounded-[2rem] border border-[#F3D9A2] bg-[#FDFBF7] p-6 shadow-[0_20px_50px_-15px_rgba(180,83,9,0.25)] sm:p-8">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-[#29180C]">
        Sign in
      </h2>
      <p className="mt-2 leading-relaxed text-[#6B5545]">
        Enter your email — we’ll send a sign-in link. No password.
      </p>
      {!configured && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-[#F3D9A2] bg-[#FFF8EB] px-4 py-3 text-sm leading-relaxed text-[#29180C]"
        >
          Demo mode — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to send a
          real sign-in link. Submissions are not sent.
        </p>
      )}
      {sent ? (
        <p
          role="status"
          className="mt-5 rounded-xl border border-[#F3D9A2] bg-[#FFF8EB] px-4 py-4 leading-relaxed text-[#29180C]"
        >
          Check your email — your link is on its way.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <label className="block text-sm font-semibold text-[#29180C]">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-xl border-[1.5px] border-[#E6CCA0] bg-white px-3.5 py-2.5 text-base text-[#29180C] placeholder:text-[#6B5545]/60 focus:border-[#D97706] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
            />
          </label>
          <button
            type="submit"
            disabled={pending || !configured}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#D97706] to-[#B45309] px-6 py-3 text-base font-bold text-white shadow-[0_8px_20px_-4px_rgba(217,119,6,0.45)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-4px_rgba(217,119,6,0.55)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            {pending ? "Sending…" : "Email me a link"}
          </button>
        </form>
      )}
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-red-300/70 bg-red-50 px-4 py-3 text-sm leading-relaxed text-[#7f1d1d]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
