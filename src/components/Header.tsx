import { PawPrint, Heart } from "lucide-react";

const links = [
  { href: "#mission", label: "Our Mission" },
  { href: "#squad", label: "Dog Squad" },
  { href: "#signup", label: "Sign Up" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-amber-200/70 bg-amber-50/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-300">
            <PawPrint className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Mochi's Legacy
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-medium text-stone-600 sm:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-amber-700"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href="#signup"
          className="flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
        >
          <Heart className="h-4 w-4" aria-hidden />
          <span className="hidden xs:inline sm:inline">Join the squad</span>
          <span className="xs:hidden sm:hidden">Join</span>
        </a>
      </div>
    </header>
  );
}
