import { useState } from "react";
import { PawPrint } from "lucide-react";

/**
 * LineupPlaceholder (pane w2:p1, ruling 7).
 *
 * Full-width wide slot (~16:7) for the founder's hand-made superhero lineup
 * portrait. Renders /lineup.png when the file exists in public/ (image load
 * failure flips the fallback via onError); until then it shows a dashed
 * amber box. No dog cards — the squad lives entirely in the portrait.
 */
export default function LineupPlaceholder() {
  const [hasArt, setHasArt] = useState(true);

  return (
    <div className="relative aspect-[16/7] w-full overflow-hidden rounded-3xl">
      {hasArt ? (
        <img
          src="/lineup.png"
          alt="The Mochi's Legacy kickoff dog squad, drawn as a superhero team lineup"
          className="h-full w-full object-cover"
          onError={() => setHasArt(false)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-amber-300 bg-amber-50/60 px-6 text-center">
          <PawPrint className="h-8 w-8 text-amber-400" aria-hidden />
          <p className="max-w-prose text-sm font-medium text-stone-500">
            The full squad portrait goes here.
          </p>
        </div>
      )}
    </div>
  );
}
