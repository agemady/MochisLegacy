import { Dog, HandHeart, HeartHandshake } from "lucide-react";
import LineupPlaceholder from "./LineupPlaceholder";
import type { SignupKind } from "./forms/SignupModal";

interface HeroProps {
  /** Opens p4's SignupModal with the chosen form kind. */
  onOpen: (kind: SignupKind) => void;
}

/** Shared height so solid + outline buttons match (border-2 on all three). */
const btn =
  "flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 px-6 text-base font-semibold transition-colors";

export default function Hero({ onOpen }: HeroProps) {
  return (
    <section id="top">
      {/* Compact mobile padding so photo top + first button clear a 390px tall-phone fold. */}
      <div className="mx-auto max-w-3xl px-4 py-6 text-center sm:px-6 sm:py-16">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-stone-800 sm:text-5xl">
          Mochi's Legacy
        </h1>

        <p className="mx-auto mt-2 max-w-prose text-base leading-snug text-stone-600 sm:mt-4 sm:text-lg sm:leading-relaxed">
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
