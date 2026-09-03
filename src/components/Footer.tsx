import Newsletter from "./forms/Newsletter";

/**
 * Footer — one line + newsletter (pane w2:p1, ruling 7).
 * Newsletter is p4's component, composed here as the email-capture slot.
 * The tax line reflects locked decision 3A: no deductible claims until the
 * 501(c)(3) determination letter.
 */
export default function Footer() {
  return (
    <footer className="border-t border-amber-200/70 bg-amber-50">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Newsletter />
        <p className="mt-8 text-center text-sm text-stone-500">
          In memory of Mochi &middot; Not yet a 501(c)(3); pledges are not
          tax-deductible.
        </p>
      </div>
    </footer>
  );
}
