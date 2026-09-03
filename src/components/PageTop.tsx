import { PawPrint } from "lucide-react";
import type { ReactNode } from "react";

/** Shared top line for secondary pages: paw + name + quiet ← Home (Direction A).
 *  Roster passes title/lede; CheckinPage may wrap children — all optional. */
export default function PageTop({ title, lede, backHref = "/", children }: { title?: string; lede?: string; backHref?: string; children?: ReactNode }) {
  return (
    <header>
      <div className="flex items-center justify-between border-b border-[#F3D9A2] pb-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-[#29180C]">
          <PawPrint className="h-4 w-4 text-[#D97706]" aria-hidden="true" />
          Mochi&apos;s Legacy
        </span>
        <a href={backHref} className="font-display text-sm font-semibold text-[#D97706] hover:text-[#B45309]">
          ← Home
        </a>
      </div>
      {title && (
        <h1 className="mt-10 font-display text-4xl font-bold tracking-tight text-[#29180C] sm:text-5xl">{title}</h1>
      )}
      {lede && <p className="mt-3 max-w-2xl font-display text-lg italic text-[#B45309]">{lede}</p>}
      {children}
    </header>
  );
}
