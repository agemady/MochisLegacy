import { PawPrint } from "lucide-react";

/**
 * Header — minimal chrome (pane w2:p1, ruling 7): logo + name, no nav links.
 * The three signup entries live in the Hero buttons.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-amber-200/70 bg-amber-50/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-300">
            <PawPrint className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Mochi's Legacy
          </span>
        </a>
      </div>
    </header>
  );
}
