import { useState } from "react";
import { PawPrint } from "lucide-react";

/**
 * LineupPlaceholder — hero-photo frame for the founder's lineup portrait.
 * Renders /lineup.png when present; otherwise a dashed slot. Caption copy
 * stays the ruling-8 fallback until the design review lands new words.
 */
export default function LineupPlaceholder() {
  const [hasArt, setHasArt] = useState(true);

  return (
    <figure>
      <div className="relative aspect-[16/7] w-full overflow-hidden rounded-3xl shadow-[0_12px_40px_-12px_rgba(120,53,15,0.28)] ring-1 ring-amber-200/80">
        {hasArt ? (
          <img
            src="/lineup.png"
            alt="The Mochi's Legacy kickoff dog squad, drawn as a superhero team lineup"
            className="h-full w-full object-cover"
            onError={() => setHasArt(false)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center border-2 border-dashed border-amber-300 bg-amber-50/70">
            <PawPrint className="h-8 w-8 text-amber-400" aria-hidden />
          </div>
        )}
      </div>
      <figcaption className="mt-2 text-sm text-stone-500">
        The full squad portrait goes here.
      </figcaption>
    </figure>
  );
}
