import Newsletter from "./forms/Newsletter";

/**
 * Footer — one memorial/tax line, then p4's Newsletter row (ruling 8).
 * Newsletter is owned by p4; this file only composes it. The tax line is
 * locked: no deductible claims until the 501(c)(3) determination letter.
 */
export default function Footer() {
  return (
    <footer className="border-t border-amber-200/70 bg-amber-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-center text-sm text-stone-500">
          In memory of Mochi · Not yet a 501(c)(3), so pledges are not
          tax-deductible.
        </p>
        <div className="mt-4">
          <Newsletter />
        </div>
      </div>
    </footer>
  );
}
