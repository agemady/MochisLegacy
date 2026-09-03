import { PawPrint } from "lucide-react";
import { squadDogs } from "../data/dogs";

/**
 * DogSquad — the kickoff lineup (pane w2:p4).
 *
 * Superhero card framing per coordination ruling 4: bold comic-print cards
 * with reserved art slots for the founder's portraits. The squad section
 * carries the comic styling; the rest of the page stays warm amber/stone.
 *
 * Content discipline: call names only — no aliases, powers, or backstories
 * anywhere in this file. The two Junis render as two identical cards; the
 * founder's art disambiguates them.
 */
export default function DogSquad() {
  return (
    <section id="squad" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-700">
          The kickoff squad
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-800 sm:text-4xl">
          Eleven very good dogs report for duty.
        </h2>
        <p className="mt-4 leading-relaxed text-stone-600">
          The founding lineup of Mochi&rsquo;s Legacy — gathered in the spirit
          of one golden retriever who started it all. Capes are still in the
          wash; the hearts came fully charged.
        </p>
        <p className="mt-3 text-sm text-stone-500">
          Portraits by the founder are on the way — every frame is reserved
          and ready.
        </p>
      </div>

      <ul className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {squadDogs.map((dog, i) => (
          <li
            key={dog.id}
            className={i % 2 === 0 ? "sm:-rotate-1" : "sm:rotate-1"}
          >
            <article className="flex h-full flex-col overflow-hidden rounded-xl border-2 border-stone-800 bg-white shadow-[4px_4px_0_0_rgba(41,37,36,0.85)] transition duration-200 hover:-translate-y-1 hover:rotate-0 hover:shadow-[6px_6px_0_0_rgba(41,37,36,0.85)]">
              {/* reserved art slot — founder portrait lands here, keyed by dog.id */}
              <div
                aria-hidden
                className="relative flex aspect-square items-center justify-center border-b-2 border-stone-800 bg-amber-100/50"
              >
                <span className="absolute left-3 top-2 text-xs font-bold tracking-wider text-stone-400">
                  #{i + 1}
                </span>
                <div className="flex flex-col items-center gap-2">
                  <PawPrint className="h-10 w-10 text-amber-600/50" />
                  <span className="px-2 text-center text-[11px] font-medium uppercase tracking-widest text-stone-400">
                    Portrait coming soon
                  </span>
                </div>
              </div>

              {/* nameplate */}
              <div className="flex items-center justify-center bg-amber-400 px-3 py-2.5">
                <h3 className="text-center text-base font-bold uppercase tracking-wide text-stone-900">
                  {dog.name}
                </h3>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-stone-500">
        Superhero framing, real dogs: these are the eleven founding squad
        members, by call name only until their portraits — and their stories,
        told by the founder — arrive.
      </p>
    </section>
  );
}
