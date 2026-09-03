import { useState } from "react";
import { Dog, HandHeart, HeartHandshake, type LucideIcon } from "lucide-react";
import type { SignupKind } from "./forms/SignupModal";

interface HeroProps {
  onOpen: (kind: SignupKind) => void;
}

const NAMES = [
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

const btn =
  "flex h-14 w-full items-center justify-center gap-2.5 rounded-full border-2 px-6 text-base font-semibold motion-safe:transition-[transform,box-shadow,background-color] motion-safe:duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md";

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
    className: "border-transparent bg-[#c23a2b] text-white shadow-sm hover:bg-[#a83226]",
  },
  {
    kind: "volunteer",
    label: "I want to volunteer",
    Icon: HandHeart,
    className: "border-[#c4922a] bg-transparent text-amber-950 hover:bg-[#f3e6c4]",
  },
  {
    kind: "pledge",
    label: "I want to support",
    Icon: HeartHandshake,
    className: "border-[#c4922a] bg-transparent text-amber-950 hover:bg-[#f3e6c4]",
  },
];

function SquadArt() {
  return (
    <svg viewBox="0 0 900 310" className="h-full w-full" aria-hidden>
      <rect width="900" height="310" fill="#fff6e4" />
      <path fill="#fde9c0" d="M0 0h900v90C700 130 200 40 0 110Z" />
      <ellipse cx="450" cy="278" rx="410" ry="24" fill="#7a4e12" opacity=".2" />
      <g fill="#e6c36a">
        <ellipse cx="42" cy="168" rx="22" ry="30" />
        <ellipse cx="56" cy="150" rx="18" ry="16" />
        <circle cx="72" cy="118" r="17" />
        <ellipse cx="86" cy="124" rx="11" ry="7" />
        <path d="M58 108c-6-22 10-28 16-8" />
        <path d="M76 104c2-22 18-16 10 6" />
        <rect x="32" y="190" width="8" height="48" rx="4" />
        <rect x="48" y="192" width="8" height="46" rx="4" />
        <path d="M22 160c-16-8-18 10-6 16" />
      </g>
      <g fill="#d4a24a">
        <ellipse cx="140" cy="198" rx="32" ry="18" />
        <circle cx="176" cy="172" r="18" />
        <ellipse cx="192" cy="178" rx="12" ry="7" />
        <path d="M160 158c-8-24 8-28 14-6" />
        <path d="M178 154c4-24 20-18 10 8" />
        <rect x="116" y="210" width="8" height="42" rx="4" />
        <rect x="130" y="212" width="8" height="40" rx="4" />
        <rect x="146" y="212" width="8" height="40" rx="4" />
        <rect x="160" y="210" width="8" height="42" rx="4" />
        <path d="M108 196c-18-14-8-28 8-18" />
      </g>
      <g fill="#c4892e">
        <ellipse cx="244" cy="192" rx="30" ry="20" />
        <circle cx="278" cy="168" r="17" />
        <ellipse cx="292" cy="174" rx="11" ry="6" />
        <path d="M262 154c-10-20 6-26 14-4" />
        <path d="M280 150c2-22 18-14 8 8" />
        <rect x="222" y="208" width="8" height="44" rx="4" />
        <rect x="236" y="210" width="8" height="42" rx="4" />
        <rect x="250" y="210" width="8" height="42" rx="4" />
        <rect x="264" y="208" width="8" height="44" rx="4" />
        <path d="M214 186c-14 4-12 20 2 18" />
      </g>
      <g fill="#edc56d">
        <ellipse cx="340" cy="172" rx="20" ry="28" />
        <ellipse cx="354" cy="156" rx="16" ry="14" />
        <circle cx="368" cy="126" r="16" />
        <ellipse cx="382" cy="132" rx="10" ry="6" />
        <path d="M354 114c-8-20 8-24 14-6" />
        <path d="M370 110c4-20 16-12 8 8" />
        <rect x="330" y="194" width="8" height="48" rx="4" />
        <rect x="346" y="196" width="8" height="46" rx="4" />
        <path d="M320 164c-14-6-16 12-4 16" />
      </g>
      <g fill="#b8860b">
        <ellipse cx="438" cy="186" rx="34" ry="22" />
        <circle cx="478" cy="158" r="19" />
        <ellipse cx="496" cy="164" rx="12" ry="7" />
        <path d="M460 144c-10-26 10-30 16-6" />
        <path d="M480 140c2-26 22-18 10 10" />
        <rect x="412" y="204" width="9" height="48" rx="4" />
        <rect x="428" y="206" width="9" height="46" rx="4" />
        <rect x="446" y="206" width="9" height="46" rx="4" />
        <rect x="462" y="204" width="9" height="48" rx="4" />
        <path d="M404 178c-20-8-16-28 4-20" />
      </g>
      <g fill="#daa520">
        <ellipse cx="555" cy="232" rx="44" ry="16" />
        <circle cx="512" cy="214" r="16" />
        <ellipse cx="498" cy="218" rx="11" ry="6" />
        <path d="M520 200c-12-16 2-24 12-8" />
        <path d="M536 198c0-18 16-14 10 4" />
        <rect x="536" y="240" width="22" height="8" rx="4" />
        <rect x="566" y="238" width="18" height="8" rx="4" />
        <path d="M598 228c12-10 18 2 8 10" />
      </g>
      <g fill="#e8b84a">
        <ellipse cx="640" cy="196" rx="30" ry="18" />
        <circle cx="674" cy="172" r="17" />
        <ellipse cx="690" cy="178" rx="11" ry="6" />
        <path d="M658 158c-8-22 10-24 14-4" />
        <path d="M676 154c4-22 18-14 8 8" />
        <rect x="616" y="210" width="8" height="42" rx="4" />
        <rect x="630" y="212" width="8" height="40" rx="4" />
        <rect x="646" y="212" width="8" height="40" rx="4" />
        <rect x="660" y="210" width="8" height="42" rx="4" />
        <path d="M610 188c-16-12-6-24 8-14" />
        <circle cx="702" cy="236" r="11" fill="#7a4e12" />
        <circle cx="705" cy="233" r="3.5" fill="#f3e6c4" />
      </g>
      <g fill="#c9a05a">
        <ellipse cx="722" cy="174" rx="18" ry="26" />
        <ellipse cx="734" cy="158" rx="15" ry="13" />
        <circle cx="748" cy="128" r="15" />
        <ellipse cx="760" cy="134" rx="9" ry="5" />
        <path d="M734 116c-6-18 8-20 12-4" />
        <path d="M750 112c2-18 14-12 6 6" />
        <rect x="712" y="196" width="7" height="46" rx="3" />
        <rect x="728" y="198" width="7" height="44" rx="3" />
        <path d="M704 166c-12-4-14 10-4 14" />
      </g>
      <g fill="#c4922a" transform="translate(748 48) scale(.68)">
        <ellipse cx="40" cy="70" rx="26" ry="15" />
        <circle cx="70" cy="50" r="14" />
        <ellipse cx="82" cy="55" rx="9" ry="5" />
        <path d="M58 38c-6-16 6-18 10-2" />
        <path d="M72 36c2-16 14-10 6 6" />
        <rect x="22" y="80" width="7" height="34" rx="3" />
        <rect x="34" y="82" width="7" height="32" rx="3" />
        <rect x="46" y="82" width="7" height="32" rx="3" />
        <rect x="58" y="80" width="7" height="34" rx="3" />
        <path d="M16 68c-12-8-4-18 8-10" />
      </g>
      <g fill="#d4a017">
        <ellipse cx="830" cy="200" rx="26" ry="16" />
        <circle cx="858" cy="178" r="15" />
        <ellipse cx="870" cy="184" rx="10" ry="5" />
        <path d="M844 166c-6-18 8-20 12-4" />
        <path d="M860 162c2-18 14-12 6 8" />
        <rect x="812" y="212" width="7" height="40" rx="3" />
        <rect x="824" y="214" width="7" height="38" rx="3" />
        <rect x="836" y="214" width="7" height="38" rx="3" />
        <rect x="848" y="212" width="7" height="40" rx="3" />
        <path d="M804 194c-12-8-4-18 8-10" />
      </g>
      <g fill="#f0d48a">
        <ellipse cx="872" cy="178" rx="16" ry="24" />
        <ellipse cx="882" cy="164" rx="13" ry="12" />
        <circle cx="894" cy="138" r="13" />
        <ellipse cx="904" cy="144" rx="8" ry="4" />
        <path d="M882 126c-5-16 7-18 11-4" />
        <path d="M896 122c2-16 12-10 5 6" />
        <rect x="864" y="198" width="6" height="44" rx="3" />
        <rect x="876" y="200" width="6" height="42" rx="3" />
        <path d="M856 170c-10-4-12 10-3 12" />
      </g>
    </svg>
  );
}

export default function Hero({ onOpen }: HeroProps) {
  const [hasArt, setHasArt] = useState(true);

  return (
    <section id="top" className="relative isolate">
      <div className="mx-auto max-w-5xl px-4 py-10 text-center motion-safe:animate-fade-up sm:px-6 sm:py-16">
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-amber-950 sm:text-6xl md:text-8xl">
          Mochi's Legacy
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-snug text-amber-950/80 sm:mt-5 sm:text-lg sm:leading-relaxed">
          A Boulder-area crew of volunteer dogs and handlers sharing comfort
          and joy, one visit at a time.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-snug text-amber-950/80 sm:text-lg sm:leading-relaxed">
          One very good golden retriever showed us how much a visit from a
          dog can mean. Mochi&apos;s Legacy keeps her at work, through every
          wagging team that follows.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-snug text-amber-950/75 sm:text-base">
          We organize volunteer handler-and-dog teams to visit senior living
          communities, schools, and libraries.
        </p>

        <figure className="mt-8 sm:mt-12">
          <div className="relative aspect-[16/6] w-full overflow-hidden rounded-3xl shadow-[0_18px_50px_-16px_rgba(61,35,20,0.45)] ring-1 ring-[#c4922a]/40">
            {hasArt ? (
              <img
                src="/lineup.png"
                alt="The Mochi's Legacy kickoff squad portrait."
                className="h-full w-full object-cover"
                onError={() => setHasArt(false)}
              />
            ) : (
              <SquadArt />
            )}
          </div>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {NAMES.map((name, i) => (
              <li
                key={`${name}-${i}`}
                className="rounded-full bg-[#f3e6c4] px-3 py-1 text-sm font-medium text-amber-950 ring-1 ring-[#c4922a]/45"
              >
                {name}
              </li>
            ))}
          </ul>
        </figure>

        <p className="mt-8 text-base text-amber-950 sm:mt-10">
          Kickoff · <span className="font-semibold">October 2</span> ·
          Foothills Community Park, Shelter A — bring your dog, meet the squad.
        </p>

        <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:mt-8">
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
