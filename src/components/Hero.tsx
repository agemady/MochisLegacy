import { PawPrint, CalendarDays, ArrowRight, Heart } from "lucide-react";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* soft gold glow accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-700">
          In loving memory of Mochi
        </p>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-stone-800 sm:text-5xl">
          Every good dog leaves a legacy.
        </h1>

        <p className="mx-auto mt-6 max-w-prose text-lg leading-relaxed text-stone-600">
          Mochi's Legacy continues the work of one very good golden retriever:
          volunteer handler-and-dog Teams bringing comfort, connection, and a
          little joy to senior living communities, schools, and libraries
          across the Boulder area.
        </p>

        {/* event chip — founder-sourced kickoff (coordination doc, ruling 3); time TBA */}
        <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-amber-300 bg-amber-100/70 px-4 py-1.5 text-sm font-medium text-stone-700">
          <CalendarDays className="h-4 w-4 text-amber-700" aria-hidden />
          <span>Kickoff meetup: October 2 · Foothills Community Park, Shelter A</span>
          <span className="text-stone-500">· time TBA</span>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#signup"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 sm:w-auto"
          >
            <Heart className="h-4 w-4" aria-hidden />
            Sign up your pup
          </a>
          <a
            href="#mission"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white/60 px-6 py-3 font-semibold text-stone-700 transition-colors hover:border-amber-400 hover:text-amber-800 sm:w-auto"
          >
            Our mission
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
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
