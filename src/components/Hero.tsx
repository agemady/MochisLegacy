import { useState } from "react";
import {
  Dog,
  HandHeart,
  HeartHandshake,
  PawPrint,
  type LucideIcon,
} from "lucide-react";
import type { SignupKind } from "./forms/SignupModal";

interface HeroProps {
  onOpen: (kind: SignupKind) => void;
}

const NAMES = [
  "Benny",
  "Honey",
  "Bear",
  "Juni & Juni",
  "Louie",
  "Moss",
  "Buddy",
  "Jaz",
  "Mini Mochi",
  "Luna",
];

const btn =
  "group flex w-full items-center justify-center gap-2.5 rounded-full px-6 py-4 text-base font-bold sm:flex-1 sm:text-lg motion-safe:transition-all motion-safe:duration-150 motion-safe:hover:-translate-y-1 motion-safe:active:translate-y-0";

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
    className:
      "bg-[#c23a2b] text-white shadow-[0_8px_20px_-4px_rgba(194,58,43,0.45)] hover:bg-[#a83226]",
  },
  {
    kind: "volunteer",
    label: "I want to volunteer",
    Icon: HandHeart,
    className:
      "bg-pine text-white shadow-[0_8px_20px_-4px_rgba(44,94,67,0.45)] hover:bg-[#234c36]",
  },
  {
    kind: "pledge",
    label: "I want to support",
    Icon: HeartHandshake,
    className:
      "border-2 border-honey bg-white/80 text-honey-dark hover:border-honey-dark hover:bg-butter",
  },
];

export default function Hero({ onOpen }: HeroProps) {
  const [hasArt, setHasArt] = useState(true);

  return (
    <section id="top" className="relative isolate">
      <div className="mx-auto max-w-6xl px-4 py-10 text-center motion-safe:animate-fade-up sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight text-espresso sm:text-7xl md:text-8xl">
            Mochi's Legacy
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-display text-xl font-normal italic leading-relaxed text-honey-dark sm:text-2xl">
            A Boulder-area crew of volunteer dogs and handlers sharing comfort
            and joy, one visit at a time.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-umber sm:text-lg">
            One very good golden retriever showed us how much a visit from a
            dog can mean. Mochi&apos;s Legacy keeps her at work, through every
            wagging team that follows.
          </p>

          <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-2xl border-2 border-dashed border-honey/50 bg-cream-soft px-4 py-2.5 text-base font-semibold text-espresso shadow-sm sm:mt-8 sm:gap-x-3 sm:px-5 sm:py-3 sm:text-lg">
            <span className="rounded-full bg-pine px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
              Kickoff
            </span>
            <span>October 2 · Foothills Community Park, Shelter A</span>
            <span className="basis-full text-sm font-medium text-umber sm:basis-auto sm:text-base">
              · Bring your dog, meet the squad.
            </span>
          </div>
        </div>

        <figure className="mt-8 -mx-4 sm:mx-0 sm:mt-12">
          <div className="rounded-[2rem] border-2 border-sandstone p-1.5 shadow-[0_20px_50px_-15px_rgba(180,83,9,0.22)]">
            {hasArt ? (
              <img
                src="/lineup.png"
                alt="The Mochi's Legacy kickoff squad portrait."
                className="block h-auto w-full rounded-[1.6rem]"
                onError={() => setHasArt(false)}
              />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[1.6rem] border border-sandstone bg-gradient-to-b from-ground via-cream-soft to-butter sm:aspect-[16/7]">
                <p className="max-w-sm px-6 font-display text-base italic text-umber/70 sm:text-lg">
                  The full squad portrait goes here.
                </p>
              </div>
            )}
          </div>
          <ul className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {NAMES.map((name) => (
              <li
                key={name}
                className="inline-flex cursor-default items-center gap-1 rounded-full border border-sandstone bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-espresso shadow-xs motion-safe:transition-all hover:border-honey hover:bg-cream-soft motion-safe:hover:-translate-y-0.5 hover:scale-105 sm:text-sm"
              >
                <PawPrint
                  className="h-3 w-3 text-honey"
                  aria-hidden
                  strokeWidth={2.5}
                />
                {name}
              </li>
            ))}
          </ul>
          <figcaption className="mx-auto mt-3 max-w-xl text-sm text-umber/90 sm:text-base">
            We organize volunteer handler-and-dog teams to visit senior living
            communities, schools, and libraries.
          </figcaption>
        </figure>

        <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:mt-8 sm:max-w-3xl sm:flex-row sm:gap-4">
          {ACTIONS.map(({ kind, label, Icon, className }) => (
            <button
              key={kind}
              type="button"
              onClick={() => onOpen(kind)}
              className={`${btn} ${className}`}
            >
              <Icon
                className="h-6 w-6 motion-safe:transition-transform group-hover:-rotate-12"
                aria-hidden
              />
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
