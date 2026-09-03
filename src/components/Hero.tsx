import { useState } from "react";
import { Dog, HandHeart, HeartHandshake, PawPrint, type LucideIcon } from "lucide-react";
import type { SignupKind } from "./forms/SignupModal";

interface HeroProps {
  onOpen: (kind: SignupKind) => void;
}

const btn =
  "flex h-12 w-full items-center justify-center gap-2.5 rounded-full border-2 px-6 text-base font-semibold motion-safe:transition-[transform,box-shadow,background-color] motion-safe:duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md";

const ACTIONS: {
  kind: SignupKind;
  label: string;
  Icon: LucideIcon;
  className: string;
}[] = [
  {
    kind: "dog",
    label: "I have a dog",
    Icon: Dog,
    className: "border-transparent bg-amber-600 text-white shadow-sm hover:bg-amber-700",
  },
  {
    kind: "volunteer",
    label: "I want to volunteer",
    Icon: HandHeart,
    className: "border-amber-600 bg-transparent text-amber-800 hover:bg-amber-100",
  },
  {
    kind: "pledge",
    label: "I want to support",
    Icon: HeartHandshake,
    className: "border-amber-600 bg-transparent text-amber-800 hover:bg-amber-100",
  },
];

export default function Hero({ onOpen }: HeroProps) {
  const [hasArt, setHasArt] = useState(true);

  return (
    <section id="top" className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.16),transparent_58%)]"
      />
      <div className="mx-auto max-w-3xl px-4 py-6 text-center motion-safe:animate-fade-up sm:px-6 sm:py-16">
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-stone-800 sm:text-6xl md:text-7xl">
          Mochi's Legacy
        </h1>

        <div className="relative">
          <PawPrint
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 -rotate-[18deg] text-amber-900 opacity-5"
          />
          <p className="relative mx-auto mt-3 max-w-prose text-base leading-snug text-stone-600 sm:mt-5 sm:text-lg sm:leading-relaxed">
            A Boulder-area crew of volunteer dogs and handlers sharing comfort
            and joy, one visit at a time.
          </p>
          <p className="relative mx-auto mt-3 max-w-prose text-base leading-snug text-stone-600 sm:text-lg sm:leading-relaxed">
            One very good golden retriever showed us how much a visit from a
            dog can mean. Mochi&apos;s Legacy keeps her at work, through every
            wagging team that follows.
          </p>
          <p className="relative mx-auto mt-3 max-w-prose text-sm leading-snug text-stone-600 sm:text-base">
            We organize volunteer handler-and-dog teams to visit senior living
            communities, schools, and libraries.
          </p>
        </div>

        <p className="mt-4 text-sm text-stone-700 sm:mt-6">
          Kickoff · <span className="font-semibold">October 2</span> ·
          Foothills Community Park, Shelter A — bring your dog, meet the squad.
        </p>

        <figure className="mt-4 sm:mt-8">
          <div className="relative aspect-[16/7] w-full overflow-hidden rounded-3xl shadow-[0_12px_40px_-12px_rgba(120,53,15,0.28)] ring-1 ring-amber-200/80">
            {hasArt ? (
              <img
                src="/lineup.png"
                alt="The Mochi's Legacy kickoff squad portrait."
                className="h-full w-full object-cover"
                onError={() => setHasArt(false)}
              />
            ) : (
              <div className="group flex h-full w-full items-center justify-center border-2 border-dashed border-amber-300 bg-amber-50/70">
                <PawPrint
                  aria-hidden
                  className="h-8 w-8 text-amber-400 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:rotate-12"
                />
              </div>
            )}
          </div>
          <figcaption className="mt-2 text-sm text-stone-500">
            The kickoff squad — come meet them October 2.
          </figcaption>
        </figure>

        <div className="mx-auto mt-4 flex max-w-md flex-col gap-2.5 sm:mt-8 sm:gap-3">
          {ACTIONS.map(({ kind, label, Icon, className }) => (
            <button
              key={kind}
              type="button"
              onClick={() => onOpen(kind)}
              className={`${btn} ${className}`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
