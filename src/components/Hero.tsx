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
  "flex w-full items-center justify-center gap-2.5 rounded-full px-8 py-4 text-base font-bold motion-safe:transition-all motion-safe:duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0";

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
      "bg-gradient-to-r from-[#D97706] to-[#B45309] text-white shadow-[0_8px_20px_-4px_rgba(217,119,6,0.45)] hover:shadow-[0_12px_24px_-4px_rgba(217,119,6,0.55)]",
  },
  {
    kind: "volunteer",
    label: "I want to volunteer",
    Icon: HandHeart,
    className:
      "border-2 border-[#2C5E43] bg-white/80 text-[#2C5E43] shadow-sm hover:bg-[#2C5E43] hover:text-white",
  },
  {
    kind: "pledge",
    label: "I want to support",
    Icon: HeartHandshake,
    className:
      "border-2 border-[#E6CCA0] bg-white/60 font-semibold text-[#6B5545] hover:border-[#D97706] hover:bg-white hover:text-[#29180C]",
  },
];

function IllustratedSquadLineup() {
  return (
    <svg viewBox="0 0 1100 420" className="squad h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="45%" stopColor="#FFF8EB" />
          <stop offset="100%" stopColor="#FFFDF9" />
        </linearGradient>
      </defs>
      <rect width="1100" height="420" fill="url(#sky)" />
      <circle cx="550" cy="78" r="58" fill="#FBBF24" opacity=".55" />
      <circle cx="550" cy="78" r="34" fill="#F59E0B" opacity=".8" />
      <path
        fill="#E8CA93"
        d="M0 318C180 278 380 302 550 268C720 234 920 292 1100 312V420H0Z"
      />
      <path
        fill="#D4B06A"
        d="M0 348C260 318 620 308 1100 338V420H0Z"
        opacity=".45"
      />
      <g fill="#78350F">
        <ellipse cx="58" cy="250" rx="26" ry="34" />
        <ellipse cx="74" cy="228" rx="20" ry="16" />
        <circle cx="88" cy="194" r="20" />
        <ellipse cx="104" cy="200" rx="12" ry="7" />
        <path d="M72 180c-8-24 12-30 18-6" />
        <path d="M94 176c4-24 20-16 8 8" />
        <rect x="44" y="276" width="9" height="52" rx="4" />
        <rect x="62" y="278" width="9" height="50" rx="4" />
        <path d="M34 244c-16-6-18 12-4 16" />
      </g>
      <g fill="#92400E">
        <ellipse cx="168" cy="268" rx="36" ry="20" />
        <circle cx="210" cy="236" r="20" />
        <ellipse cx="228" cy="242" rx="13" ry="7" />
        <path d="M192 220c-10-26 10-30 16-6" />
        <path d="M214 216c4-26 22-18 10 10" />
        <rect x="140" y="282" width="9" height="46" rx="4" />
        <rect x="156" y="278" width="9" height="50" rx="4" />
        <rect x="176" y="278" width="9" height="50" rx="4" />
        <rect x="192" y="282" width="9" height="46" rx="4" />
        <path d="M132 262c-20-16-8-30 10-18" />
      </g>
      <g fill="#B45309">
        <ellipse cx="300" cy="292" rx="40" ry="16" />
        <ellipse cx="268" cy="304" rx="18" ry="12" />
        <circle cx="248" cy="278" r="18" />
        <ellipse cx="232" cy="284" rx="12" ry="6" />
        <path d="M258 262c-12-18 4-26 14-6" />
        <path d="M274 258c0-20 18-14 10 6" />
        <rect x="278" y="300" width="28" height="10" rx="4" />
        <rect x="318" y="292" width="12" height="36" rx="4" />
        <path d="M338 278c16-14 8-28-8-16" />
      </g>
      <g fill="#D97706">
        <ellipse cx="390" cy="300" rx="22" ry="14" />
        <ellipse cx="418" cy="268" rx="16" ry="28" />
        <circle cx="430" cy="228" r="16" />
        <ellipse cx="444" cy="234" rx="10" ry="6" />
        <path d="M416 214c-6-20 10-22 14-4" />
        <path d="M432 210c2-20 16-12 8 8" />
        <rect x="372" y="306" width="36" height="10" rx="4" />
        <rect x="408" y="292" width="10" height="36" rx="4" />
        <path d="M428 248c8-22 24-8 10 8" />
      </g>
      <g fill="#F59E0B">
        <ellipse cx="510" cy="250" rx="28" ry="18" />
        <circle cx="542" cy="220" r="18" />
        <ellipse cx="558" cy="226" rx="11" ry="6" />
        <path d="M526 204c-8-22 10-24 14-4" />
        <path d="M544 200c4-22 18-14 8 8" />
        <rect x="488" y="262" width="9" height="28" rx="4" />
        <rect x="504" y="256" width="9" height="24" rx="4" />
        <rect x="522" y="268" width="9" height="40" rx="4" />
        <rect x="538" y="272" width="9" height="36" rx="4" />
        <path d="M482 244c-16-10-6-24 10-14" />
      </g>
      <g fill="#B45309">
        <ellipse cx="620" cy="268" rx="34" ry="20" />
        <circle cx="658" cy="236" r="19" />
        <ellipse cx="676" cy="242" rx="12" ry="7" />
        <path d="M640 218c-10-26 10-28 16-6" />
        <path d="M660 214c2-24 20-16 10 10" />
        <rect x="594" y="282" width="9" height="46" rx="4" />
        <rect x="610" y="284" width="9" height="44" rx="4" />
        <rect x="628" y="284" width="9" height="44" rx="4" />
        <rect x="644" y="282" width="9" height="46" rx="4" />
        <g className="squad-tail">
          <path d="M586 258c-22-18-10-34 12-20" />
        </g>
      </g>
      <g fill="#92400E">
        <ellipse cx="742" cy="248" rx="24" ry="32" />
        <ellipse cx="758" cy="228" rx="18" ry="16" />
        <circle cx="772" cy="194" r="18" />
        <ellipse cx="786" cy="200" rx="11" ry="6" />
        <path d="M756 178c-10-22 8-28 16-6" />
        <path d="M776 174c2-24 18-14 8 10" />
        <rect x="728" y="274" width="9" height="54" rx="4" />
        <rect x="746" y="276" width="9" height="52" rx="4" />
        <path d="M718 242c-14-4-16 12-4 16" />
      </g>
      <g fill="#D97706">
        <ellipse cx="850" cy="270" rx="32" ry="18" />
        <circle cx="818" cy="242" r="18" />
        <ellipse cx="804" cy="248" rx="12" ry="6" />
        <path d="M830 226c-8-22 8-26 14-6" />
        <path d="M812 222c-4-24-20-14-8 10" />
        <rect x="830" y="282" width="9" height="46" rx="4" />
        <rect x="846" y="284" width="9" height="44" rx="4" />
        <rect x="862" y="284" width="9" height="44" rx="4" />
        <rect x="878" y="282" width="9" height="46" rx="4" />
        <path d="M882 258c16-12 8-26-8-14" />
      </g>
      <g fill="#78350F">
        <ellipse cx="900" cy="304" rx="42" ry="14" />
        <circle cx="862" cy="288" r="16" />
        <ellipse cx="848" cy="292" rx="11" ry="6" />
        <path d="M872 274c-10-16 4-22 12-6" />
        <path d="M888 272c0-16 14-12 8 4" />
        <rect x="884" y="310" width="22" height="8" rx="4" />
        <rect x="914" y="308" width="18" height="8" rx="4" />
        <path d="M940 298c12-8 16 4 6 10" />
      </g>
      <g fill="#F59E0B" transform="translate(930 40) scale(.68)">
        <ellipse cx="48" cy="250" rx="22" ry="28" />
        <ellipse cx="62" cy="232" rx="16" ry="14" />
        <circle cx="76" cy="202" r="16" />
        <ellipse cx="90" cy="208" rx="10" ry="6" />
        <path d="M62 188c-6-18 8-22 14-4" />
        <path d="M78 184c2-18 14-12 6 8" />
        <rect x="36" y="272" width="8" height="46" rx="4" />
        <rect x="52" y="274" width="8" height="44" rx="4" />
        <path d="M28 244c-12-4-14 10-4 14" />
      </g>
      <g fill="#B45309">
        <ellipse cx="1048" cy="262" rx="30" ry="16" />
        <circle cx="1020" cy="236" r="16" />
        <ellipse cx="1006" cy="232" rx="12" ry="7" />
        <path d="M1034 216c-8-18 6-22 12-4" />
        <path d="M1014 214c-6-18-16-8-6 8" />
        <rect x="1028" y="272" width="8" height="36" rx="4" />
        <rect x="1042" y="268" width="9" height="28" rx="4" />
        <rect x="1058" y="276" width="8" height="42" rx="4" />
        <rect x="1072" y="280" width="8" height="38" rx="4" />
        <path d="M1078 250c12-10 16 2 6 10" />
      </g>
    </svg>
  );
}

export default function Hero({ onOpen }: HeroProps) {
  const [hasArt, setHasArt] = useState(true);

  return (
    <section id="top" className="relative isolate">
      <div className="mx-auto max-w-5xl px-4 py-10 text-center motion-safe:animate-fade-up sm:px-6 sm:py-16">
        <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight text-[#29180C] sm:text-7xl md:text-8xl">
          Mochi's Legacy
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-display text-xl font-normal italic leading-relaxed text-[#B45309] sm:text-2xl">
          A Boulder-area crew of volunteer dogs and handlers sharing comfort
          and joy, one visit at a time.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-[#6B5545] sm:text-lg">
          One very good golden retriever showed us how much a visit from a
          dog can mean. Mochi&apos;s Legacy keeps her at work, through every
          wagging team that follows.
        </p>
        <p className="mx-auto mt-2 max-w-xl text-base leading-relaxed text-[#6B5545] sm:text-lg">
          We organize volunteer handler-and-dog teams to visit senior living
          communities, schools, and libraries.
        </p>

        <figure className="mt-8 sm:mt-12">
          <div className="rounded-[2rem] border-2 border-[#F3D9A2] p-1.5 shadow-[0_20px_50px_-15px_rgba(180,83,9,0.22)]">
            <div className="relative aspect-[16/8] w-full overflow-hidden rounded-[1.6rem] border border-[#F3D9A2] bg-gradient-to-b from-[#FFFDF9] via-[#FFF8EB] to-[#FDE68A]/40 sm:aspect-[16/7]">
              {hasArt ? (
                <img
                  src="/lineup.png"
                  alt="The Mochi's Legacy kickoff squad portrait."
                  className="h-full w-full object-cover"
                  onError={() => setHasArt(false)}
                />
              ) : (
                <IllustratedSquadLineup />
              )}
            </div>
          </div>
          <ul className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {NAMES.map((name, i) => (
              <li
                key={`${name}-${i}`}
                className="inline-flex cursor-default items-center gap-1 rounded-full border border-[#F3D9A2] bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-[#29180C] shadow-xs motion-safe:transition-all hover:scale-105 hover:border-[#D97706] hover:bg-[#FFF8EB] sm:text-sm"
              >
                <PawPrint
                  className="h-3 w-3 text-[#D97706]"
                  aria-hidden
                  strokeWidth={2.5}
                />
                {name}
              </li>
            ))}
          </ul>
        </figure>

        <div className="mt-8 inline-flex items-center gap-2.5 rounded-2xl border border-[#F3D9A2] bg-[#FFF8EB] px-4 py-2 text-sm font-semibold text-[#29180C] shadow-sm sm:mt-10 sm:gap-3 sm:px-5 sm:py-2.5 sm:text-base">
          <span className="rounded-full bg-[#2C5E43] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
            Kickoff
          </span>
          <span>October 2 · Foothills Community Park, Shelter A</span>
          <span className="hidden text-[#6B5545] sm:inline">
            · Bring your dog!
          </span>
        </div>

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
