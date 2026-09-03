import { PawPrint } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-amber-200/70 bg-amber-100/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-200 text-amber-800">
                <PawPrint className="h-4 w-4" aria-hidden />
              </span>
              <span className="font-semibold tracking-tight">
                Mochi's Legacy
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              A community of volunteer handler-and-dog Teams serving the
              Boulder area, founded in memory of Mochi — a very good golden
              retriever.
            </p>
          </div>

          <nav className="grid gap-2 text-sm font-medium text-stone-600">
            <a href="#mission" className="transition-colors hover:text-amber-700">
              Our Mission
            </a>
            <a href="#squad" className="transition-colors hover:text-amber-700">
              Dog Squad
            </a>
            <a href="#signup" className="transition-colors hover:text-amber-700">
              Sign Up
            </a>
          </nav>
        </div>

        <div className="mt-10 border-t border-amber-200/70 pt-6 text-xs leading-relaxed text-stone-500">
          <p>
            Mochi's Legacy is not yet a 501(c)(3) organization; pledges made
            today are not tax-deductible. Our therapy dog Teams are certified
            volunteer visitor units — therapy dogs are not service dogs.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} Mochi's Legacy · Boulder, Colorado
          </p>
        </div>
      </div>
    </footer>
  );
}
