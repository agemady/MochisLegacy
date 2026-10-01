import { useState, type PointerEvent } from "react";
import {
  ArrowRight,
  Camera,
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

// Call names only (ruling 4). Two different dogs are both named Juni.
const SQUAD = [
  "Benny",
  "Honey",
  "Bear",
  "Juni",
  "Juni",
  "Louie",
  "Moss",
  "Buddy",
  "Jaz",
  "Mini Mochi",
  "Luna",
];

// October 2, 2026 in Boulder. Never print a weekday (ruling 15).
const KICKOFF_UTC = Date.UTC(2026, 9, 2);

function kickoffCountdown(now = new Date()): string | null {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const part = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  const days = Math.round(
    (KICKOFF_UTC - Date.UTC(part("year"), part("month") - 1, part("day"))) /
      86_400_000,
  );
  if (days < 0) return null;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

const focusRing =
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-espresso";

const btn = `group flex w-full items-center justify-center gap-2.5 rounded-full px-6 py-4 text-base font-bold sm:text-lg lg:flex-1 motion-safe:transition-[transform,background-color,box-shadow] motion-safe:duration-200 motion-safe:hover:-translate-y-1 motion-safe:active:translate-y-0 ${focusRing}`;

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
      "btn-lit bg-ember text-white shadow-[0_10px_24px_-8px_rgba(194,58,43,0.6)] hover:bg-ember-dark hover:shadow-[0_14px_28px_-8px_rgba(194,58,43,0.6)]",
  },
  {
    kind: "volunteer",
    label: "I want to volunteer",
    Icon: HandHeart,
    className:
      "bg-pine text-white shadow-[0_10px_24px_-8px_rgba(44,94,67,0.55)] hover:bg-pine-dark",
  },
  {
    kind: "pledge",
    label: "I want to support",
    Icon: HeartHandshake,
    className:
      "border-2 border-honey bg-white/85 text-honey-dark hover:border-honey-dark hover:bg-butter",
  },
];

function trackPointer(e: PointerEvent<HTMLButtonElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

function resetPointer(e: PointerEvent<HTMLButtonElement>) {
  e.currentTarget.style.removeProperty("--mx");
  e.currentTarget.style.removeProperty("--my");
}

function KickoffTicket() {
  const soon = kickoffCountdown();
  return (
    <div className="mx-auto mt-8 max-w-md sm:mt-10 sm:max-w-lg lg:max-w-[54rem]">
      <div className="ticket flex flex-col rounded-3xl border-2 border-dashed border-honey/60 bg-gradient-to-br from-white to-cream-soft text-left lg:flex-row">
        <div className="min-w-0 flex-1 px-5 pb-4 pt-4 sm:px-6 lg:px-8 lg:py-6">
          <p className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-pine px-2.5 py-1 text-[0.7rem] font-bold uppercase leading-none tracking-[0.12em] text-white">
              Kickoff walk
            </span>
            {soon && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ember-soft px-2.5 py-1 text-[0.7rem] font-bold uppercase leading-none tracking-[0.12em] text-ember-dark">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-ember motion-safe:animate-pulse"
                  aria-hidden
                />
                {soon}
              </span>
            )}
          </p>
          <p className="mt-2.5 font-display text-[1.65rem] font-semibold leading-[1.15] tracking-tight text-espresso lg:text-2xl">
            <span className="block lg:inline">October 2</span>
            <span className="hidden lg:inline"> · </span>
            <span className="block text-lg leading-snug lg:inline lg:text-2xl">
              Foothills Community Park, Shelter A
            </span>
          </p>
          <p className="mt-1.5 text-[0.95rem] text-umber lg:text-base">
            Bring your dog, or just come meet the squad.
          </p>
        </div>
        <a
          href="/schedule"
          className={`group/stub flex h-[3.25rem] shrink-0 items-center justify-between gap-2 rounded-b-[1.4rem] border-t-2 border-dashed border-honey/55 px-5 text-sm font-bold text-pine transition-colors hover:bg-butter sm:px-6 lg:h-auto lg:w-44 lg:gap-3 lg:rounded-none lg:rounded-r-[1.4rem] lg:border-l-2 lg:border-t-0 lg:px-6 lg:text-base focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-espresso`}
        >
          <span className="lg:leading-snug">
            Squad walk <span className="whitespace-nowrap">sign-ups</span>
          </span>
          <ArrowRight
            className="h-4 w-4 shrink-0 motion-safe:transition-transform group-hover/stub:translate-x-1 lg:h-5 lg:w-5"
            aria-hidden
          />
        </a>
      </div>
    </div>
  );
}

export default function Hero({ onOpen }: HeroProps) {
  const [hasArt, setHasArt] = useState(true);

  return (
    <section id="top" className="relative isolate">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-11 text-center sm:px-6 sm:pb-16 sm:pt-16">
        <div className="mx-auto max-w-5xl motion-safe:animate-fade-up">
          <h1 className="font-display text-5xl font-bold leading-none tracking-tight text-espresso sm:text-7xl md:text-8xl">
            Mochi’s Legacy
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-display text-xl italic leading-snug text-honey-deep sm:mt-5 sm:text-2xl">
            A Boulder-area crew of volunteer dogs and handlers sharing comfort
            and joy, one visit at a time.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-umber sm:text-lg">
            Mochi was one very good golden retriever who showed us how much a
            visit from a dog can mean. Every wagging team that follows keeps
            her work going.
          </p>
        </div>

        <div className="motion-safe:animate-fade-up motion-safe:[animation-delay:120ms]">
          <KickoffTicket />
        </div>

        <figure className="mt-10 motion-safe:animate-fade-up motion-safe:[animation-delay:220ms] sm:mt-14">
          <div className="rounded-[1.75rem] border-2 border-sandstone bg-white/70 p-1.5 shadow-[0_22px_48px_-24px_rgba(120,60,10,0.35)]">
            {hasArt ? (
              <img
                src="/lineup.png"
                alt="The Mochi’s Legacy kickoff squad."
                className="block h-auto w-full rounded-[1.35rem]"
                onError={() => setHasArt(false)}
              />
            ) : (
              <div className="flex aspect-[2/1] w-full flex-col items-center justify-center gap-2.5 rounded-[1.35rem] bg-gradient-to-b from-cream-soft to-butter sm:aspect-[3/1] lg:aspect-[7/2]">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-honey shadow-xs ring-1 ring-sandstone sm:h-12 sm:w-12">
                  <Camera className="h-5 w-5" aria-hidden />
                </span>
                <p className="px-6 font-display text-base italic text-umber sm:text-lg">
                  The full squad portrait goes here.
                </p>
              </div>
            )}
          </div>
          <figcaption className="mt-6 sm:mt-7">
            <p className="text-balance font-display text-lg italic text-espresso sm:text-xl">
              Meet the kickoff squad: eleven dogs, two of them Juni.
            </p>
            <ul className="mx-auto mt-3.5 flex max-w-sm flex-wrap justify-center gap-1.5 sm:max-w-2xl lg:max-w-none lg:flex-nowrap xl:gap-2">
              {SQUAD.map((name, i) => (
                <li
                  key={`${name}-${i}`}
                  style={{ animationDelay: `${450 + i * 55}ms` }}
                  className="group/chip inline-flex cursor-default items-center gap-1.5 whitespace-nowrap rounded-full border border-sandstone bg-white/90 px-3 py-1.5 text-[0.8rem] font-semibold text-espresso shadow-xs motion-safe:animate-chip-in motion-safe:transition-[transform,border-color,background-color] hover:border-honey hover:bg-cream-soft motion-safe:hover:-translate-y-0.5 xl:px-3.5 xl:text-sm"
                >
                  <PawPrint
                    className="h-3.5 w-3.5 text-honey motion-safe:group-hover/chip:animate-wag"
                    aria-hidden
                    strokeWidth={2.25}
                  />
                  {name}
                </li>
              ))}
            </ul>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-umber sm:max-w-xl sm:text-base">
              We organize volunteer handler-and-dog teams to visit senior
              living communities, schools, and libraries.
            </p>
          </figcaption>
        </figure>

        <div className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:mt-11 lg:max-w-3xl lg:flex-row lg:gap-4">
          {ACTIONS.map(({ kind, label, Icon, className }) => (
            <button
              key={kind}
              type="button"
              onClick={() => onOpen(kind)}
              onPointerMove={kind === "dog" ? trackPointer : undefined}
              onPointerLeave={kind === "dog" ? resetPointer : undefined}
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
