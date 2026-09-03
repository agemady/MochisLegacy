import { Dog, HandHeart, HeartHandshake, PawPrint } from "lucide-react";
import LineupPlaceholder from "./LineupPlaceholder";
import type { SignupKind } from "./forms/SignupModal";

interface HeroProps {
  /** Opens p4's SignupModal with the chosen form kind. */
  onOpen: (kind: SignupKind) => void;
}

/** Equal height; lift is motion-safe only. Primary stays solid amber. */
const btn =
  "flex h-12 w-full items-center justify-center gap-2.5 rounded-full border-2 px-6 text-base font-semibold motion-safe:transition-[transform,box-shadow,background-color] motion-safe:duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md";

export default function Hero({ onOpen }: HeroProps) {
  return (
    <section id="top" className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.16),transparent_58%)]"
      />
      <div className="mx-auto max-w-3xl px-4 py-6 text-center motion-safe:animate-fade-up sm:px-6 sm:py-16">
        <PawPrint
          aria-hidden
          className="mx-auto mb-2 h-6 w-6 -rotate-[18deg] text-amber-500/80"
        />
        <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-stone-800 sm:text-6xl md:text-7xl">
          Mochi's Legacy
        </h1>

        <p className="mx-auto mt-3 max-w-prose text-base leading-snug text-stone-600 sm:mt-5 sm:text-lg sm:leading-relaxed">
          A Boulder-area crew of volunteer dogs and handlers sharing comfort
          and joy, one visit at a time.
        </p>

        <p className="mt-3 text-sm font-medium text-stone-700 sm:mt-5">
          October 2 · Foothills Community Park, Shelter A
        </p>

        <div className="mt-4 sm:mt-8">
          <LineupPlaceholder />
        </div>

        <div className="mx-auto mt-4 flex max-w-md flex-col gap-2.5 sm:mt-8 sm:gap-3">
          <button
            type="button"
            onClick={() => onOpen("dog")}
            className={`${btn} border-transparent bg-amber-600 text-white shadow-sm hover:bg-amber-700`}
          >
            <Dog className="h-5 w-5" aria-hidden />
            I have a dog
          </button>
          <button
            type="button"
            onClick={() => onOpen("volunteer")}
            className={`${btn} border-amber-600 bg-transparent text-amber-800 hover:bg-amber-100`}
          >
            <HandHeart className="h-5 w-5" aria-hidden />
            I want to volunteer
          </button>
          <button
            type="button"
            onClick={() => onOpen("pledge")}
            className={`${btn} border-amber-600 bg-transparent text-amber-800 hover:bg-amber-100`}
          >
            <HeartHandshake className="h-5 w-5" aria-hidden />
            I want to support
          </button>
        </div>
      </div>
    </section>
  );
}
