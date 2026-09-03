import { useState } from "react";
import { PawPrint } from "lucide-react";

/**
 * LineupPlaceholder — hero-photo frame for the founder's lineup portrait.
 * Renders /lineup.png when present; otherwise a dashed slot. Empty-slot paw
 * tilts on hover (motion-safe); deletes itself once the portrait lands.
 */
export default function LineupPlaceholder() {
  const [hasArt, setHasArt] = useState(true);

  return (
    <figure>
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
  );
}
