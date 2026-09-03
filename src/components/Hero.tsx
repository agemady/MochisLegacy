import { PawPrint, CalendarDays, Dog, HandHeart, HeartHandshake } from "lucide-react";
import LineupPlaceholder from "./LineupPlaceholder";
import type { SignupKind } from "./forms/SignupModal";

interface HeroProps {
  /** Opens p4's SignupModal with the chosen form kind. */
  onOpen: (kind: SignupKind) => void;
}

export default function Hero({ onOpen }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* soft gold glow accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-700">
          In loving memory of Mochi
        </p>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-stone-800 sm:text-5xl">
          Mochi's Legacy
        </h1>

        {/* one-sentence mission */}
        <p className="mx-auto mt-6 max-w-prose text-lg leading-relaxed text-stone-600">
          Continuing the work of one very good golden retriever: volunteer
          handler-and-dog Teams bringing comfort, connection, and a little joy
          to senior living communities, schools, and libraries across the
          Boulder area.
        </p>

        {/* kickoff line — founder-sourced (coordination doc, ruling 3); time TBA */}
        <p className="mt-6 inline-flex flex-wrap items-center justify-center gap-x-2 rounded-full border border-amber-300 bg-amber-100/70 px-4 py-1.5 text-sm font-medium text-stone-700">
          <CalendarDays className="h-4 w-4 text-amber-700" aria-hidden />
          <span>October 2 · Foothills Community Park, Shelter A</span>
          <span className="text-stone-500">· time TBA</span>
        </p>

        {/* squad lineup portrait — wide slot with dashed-amber fallback */}
        <div className="mt-10">
          <LineupPlaceholder />
        </div>

        {/* three big signup buttons → SignupModal kinds (dog / volunteer / pledge) */}
        <div className="mx-auto mt-10 flex max-w-md flex-col gap-3">
          <button
            type="button"
            onClick={() => onOpen("dog")}
            className="flex items-center justify-center gap-3 rounded-full bg-amber-600 px-6 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
          >
            <Dog className="h-5 w-5" aria-hidden />
            I have a dog
          </button>
          <button
            type="button"
            onClick={() => onOpen("volunteer")}
            className="flex items-center justify-center gap-3 rounded-full border-2 border-amber-600 bg-white/70 px-6 py-4 text-lg font-semibold text-amber-800 transition-colors hover:bg-amber-100"
          >
            <HandHeart className="h-5 w-5" aria-hidden />
            I want to volunteer
          </button>
          <button
            type="button"
            onClick={() => onOpen("pledge")}
            className="flex items-center justify-center gap-3 rounded-full border border-stone-300 bg-white/60 px-6 py-4 text-lg font-semibold text-stone-700 transition-colors hover:border-amber-400 hover:text-amber-800"
          >
            <HeartHandshake className="h-5 w-5" aria-hidden />
            I want to support
          </button>
        </div>

        {/* paw trail divider */}
        <div
          aria-hidden
          className="mt-16 flex items-center justify-center gap-6 text-amber-400/70"
        >
          <PawPrint className="h-4 w-4 -rotate-12" />
          <PawPrint className="h-5 w-5 rotate-6" />
          <PawPrint className="h-6 w-6 text-amber-500" />
          <PawPrint className="h-5 w-5 -rotate-6" />
          <PawPrint className="h-4 w-4 rotate-12" />
        </div>
      </div>
    </section>
  );
}
