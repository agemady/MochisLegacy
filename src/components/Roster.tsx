import { useState } from "react";
import { roster, type RosterDog, type RosterTier } from "../data/roster";
import Footer from "./Footer";
import PageTop from "./PageTop";

const tierLabel: Record<RosterTier, string> = {
  gaggle: "Gaggle",
  candidate: "Candidate",
  therapy: "Therapy dog",
};

/** /roster/<id>.jpg with a dashed fallback when the photo isn't up yet. */
function RosterPhoto({ id, name }: { id: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border-2 border-dashed border-honey/40 bg-[#FFF8EB]/70 text-sm italic text-umber/60">
        photo coming
      </div>
    );
  }
  return (
    <img
      src={`/roster/${id}.jpg`}
      alt={`Photo of ${name}`}
      onError={() => setFailed(true)}
      loading="lazy"
      className="aspect-[4/3] w-full rounded-2xl object-cover"
    />
  );
}

export default function Roster() {
  return (
    <div className="min-h-screen bg-ground text-espresso">
      <main className="mx-auto max-w-5xl px-4 py-16">
        <PageTop
          title="The roster"
          lede="Gaggle of Goldens community walks are step one; from there a dog can become a therapy candidate and then a certified therapy dog."
        />
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {roster.map((dog: RosterDog) => (
            <li
              key={dog.id}
              className="rounded-3xl bg-[#FAF3E6] p-3 ring-1 ring-sandstone shadow-[0_10px_30px_-18px_rgba(41,24,12,0.35)]"
            >
              <RosterPhoto id={dog.id} name={dog.name} />
              <div className="mt-2 flex items-center justify-between gap-2 px-1 pb-1">
                <span className="truncate font-medium text-espresso">
                  {dog.name}
                </span>
                <span className="shrink-0 rounded-full bg-[#FFF8EB] px-2 py-0.5 text-xs font-medium text-espresso">
                  {tierLabel[dog.tier]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
