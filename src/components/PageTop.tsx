/**
 * STUB by roster-restyle (w2:p7, branch scheduling) — p1 owns the real shared
 * PageTop. When p1's component lands, replace this file and keep the props
 * contract used by Roster.tsx: { title, lede, backHref }. SchedulePage also
 * renders <PageTop /> with no props (its own header follows), so every prop is
 * optional here.
 */
export default function PageTop({
  title,
  lede,
  backHref = "/",
}: {
  title?: string;
  lede?: string;
  backHref?: string;
}) {
  return (
    <header>
      <a
        href={backHref}
        className="text-sm font-medium text-[#B45309] underline-offset-4 hover:underline"
      >
        ← Back to home
      </a>
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-[#29180C] sm:text-5xl">
        {title}
      </h1>
      {lede && (
        <p className="mt-3 max-w-2xl font-display text-lg italic text-[#B45309]">
          {lede}
        </p>
      )}
    </header>
  );
}
