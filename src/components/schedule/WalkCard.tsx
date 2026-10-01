import { useId, type ReactNode } from "react";
import { Backpack, Check, Clock, ExternalLink, MapPin } from "lucide-react";
import { spotsLeft, type Walk } from "../../lib/schedule";
import { formatWalkWindow } from "../../lib/time";
import { CARD, FOCUS, dateTile, mapsUrl, whenLabel } from "./format";

export function SpotsPill({ walk }: { walk: Walk }) {
  const left = spotsLeft(walk);
  return left > 0 ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-pine/10 px-3 py-1 text-xs font-bold text-pine ring-1 ring-pine/20">
      <span className="h-1.5 w-1.5 rounded-full bg-pine" aria-hidden="true" />
      {left} of {walk.cap} spots open
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-butter px-3 py-1 text-xs font-bold text-honey-dark ring-1 ring-sandstone">
      <span className="h-1.5 w-1.5 rounded-full bg-honey" aria-hidden="true" />
      Full · waitlist open
    </span>
  );
}

function SpotLink({ spot }: { spot: string }) {
  // Keep the last two words ("Shelter A") and the icon together so nothing wraps onto a line alone.
  const words = spot.trim().split(/\s+/);
  const head = words.length > 2 ? `${words.slice(0, -2).join(" ")} ` : "";
  const tail = words.slice(-2).join(" ");
  return (
    <a
      href={mapsUrl(spot)}
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded-md py-3 font-semibold text-espresso underline decoration-sandstone decoration-2 underline-offset-4 hover:decoration-honey ${FOCUS}`}
    >
      {head}
      <span className="whitespace-nowrap">
        {tail}
        <ExternalLink className="ml-1 inline-block h-3.5 w-3.5 align-[-0.125em] text-honey-dark" aria-hidden="true" />
      </span>
      <span className="sr-only"> (opens Google Maps)</span>
    </a>
  );
}

/** Where to meet and what to bring. Turns into a "see you there" panel once one of your dogs is walking. */
function Logistics({ walk, set }: { walk: Walk; set: boolean }) {
  if (set) {
    return (
      <div className="mt-4 rounded-3xl bg-pine/[0.07] p-4 ring-1 ring-pine/15">
        <p className="flex items-center gap-2 font-display text-base font-semibold text-pine">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pine text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
          </span>
          You&apos;re set. See you there!
        </p>
        <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-espresso">
          <li className="flex gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pine" aria-hidden="true" />
            <span>
              <span className="sr-only">Meet at: </span>
              <SpotLink spot={walk.meeting_spot} />
            </span>
          </li>
          {walk.notes && (
            <li className="flex gap-2.5">
              <Backpack className="mt-0.5 h-4 w-4 shrink-0 text-pine" aria-hidden="true" />
              <span>
                <span className="sr-only">Good to know: </span>
                {walk.notes}
              </span>
            </li>
          )}
        </ul>
      </div>
    );
  }
  return (
    <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-espresso">
      <li className="flex gap-2.5">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-honey" aria-hidden="true" />
        <span>
          <span className="sr-only">Meet at: </span>
          <SpotLink spot={walk.meeting_spot} />
        </span>
      </li>
      {walk.notes && (
        <li className="flex gap-2.5 text-umber">
          <Backpack className="mt-0.5 h-4 w-4 shrink-0 text-honey" aria-hidden="true" />
          <span>
            <span className="sr-only">Good to know: </span>
            {walk.notes}
          </span>
        </li>
      )}
    </ul>
  );
}

/** One upcoming walk. Owners pass their dog rows as children. */
export default function WalkCard({
  walk,
  set = false,
  index = 0,
  children,
}: {
  walk: Walk;
  set?: boolean;
  index?: number;
  children?: ReactNode;
}) {
  const titleId = useId();
  const tile = dateTile(walk.starts_at);
  return (
    <article
      aria-labelledby={titleId}
      className={`${CARD} p-5 motion-safe:animate-fade-up sm:p-6`}
      style={{ animationDelay: `${Math.min(index, 4) * 70}ms` }}
    >
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex h-[4.25rem] w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-cream-soft to-butter ring-1 ring-sandstone"
        >
          <span className="text-[0.65rem] font-bold tracking-[0.18em] text-honey-dark">{tile.month}</span>
          <span className="font-display text-2xl font-bold leading-none text-espresso">{tile.day}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-honey-dark">
            {whenLabel(walk.starts_at, walk.ends_at)}
          </p>
          <h3 id={titleId} className="mt-0.5 font-display text-xl font-semibold leading-snug text-espresso sm:text-2xl">
            {walk.title}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-umber">
            <Clock className="h-3.5 w-3.5 shrink-0 text-honey" aria-hidden="true" />
            {formatWalkWindow(walk.starts_at, walk.ends_at)}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <SpotsPill walk={walk} />
      </div>
      <Logistics walk={walk} set={set} />
      {children}
    </article>
  );
}
