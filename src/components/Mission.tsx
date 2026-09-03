import { Heart, ShieldCheck, Users } from "lucide-react";

/**
 * Mission — what Mochi's Legacy is and how it shows up (pane w2:p4).
 *
 * Canonical language per CONTEXT.md: the org "gathers vetted dog-and-handler
 * pairs and brings them to the Boulder community", in memory of Mochi.
 * Track A = open community events (no certification required). Track B =
 * visits by registry-certified Teams, clinical ceiling senior living/nursing.
 * Track C is research-only and omitted from the public site. Roster noun is
 * "dog" (not pet/animal); no hospital or hospice copy anywhere.
 */
export default function Mission() {
  return (
    <section id="mission" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-700">
          Our mission
        </p>
        <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-stone-800 sm:text-4xl">
          Mochi&rsquo;s Legacy gathers vetted dog-and-handler pairs and brings
          them to the Boulder community.
        </h2>
        <p className="mt-5 leading-relaxed text-stone-600">
          We continue the work one very good golden retriever started: showing
          up for people. Mochi&rsquo;s Legacy carries that spirit forward —
          connecting carefully vetted Teams with neighbors across Boulder
          County, one visit and one event at a time.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6">
        <div className="rounded-2xl border border-amber-200/80 bg-white/70 p-6 shadow-sm sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-300">
            <Users className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-stone-800">
            Track A — Community events
          </h3>
          <p className="mt-3 leading-relaxed text-stone-600">
            Open gatherings for dogs, handlers, and neighbors — no
            certification needed. Come meet the squad, make friends, and find
            out what the Legacy is building.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-white/70 p-6 shadow-sm sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-300">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-stone-800">
            Track B — Certified Team visits
          </h3>
          <p className="mt-3 leading-relaxed text-stone-600">
            Vetted dog-and-handler Teams, certified together through our
            registry, visit senior living and nursing communities — bringing
            comfort, connection, and a little joy where it matters most.
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <a
          href="#signup"
          className="flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
        >
          <Heart className="h-4 w-4" aria-hidden />
          Join the kickoff
        </a>
        <p className="text-sm text-stone-500">
          Dogs, handlers, and volunteers — there&rsquo;s a place on the squad
          for you.
        </p>
      </div>
    </section>
  );
}
