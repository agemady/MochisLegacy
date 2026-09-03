import { useEffect, useState } from "react";
import { roster, type RosterDog, type RosterTier } from "../data/roster";
import { listRosterDogs } from "../lib/schedule";
import Footer from "./Footer";

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
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 text-sm text-stone-400">
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
      className="aspect-[4/3] w-full rounded-xl object-cover"
    />
  );
}

export default function Roster() {
  const [dogs, setDogs] = useState<RosterDog[]>(roster);

  useEffect(() => {
    void listRosterDogs().then((r) => {
      if (r.ok && r.data?.length) setDogs(r.data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-amber-50 text-stone-800">
      <main className="mx-auto max-w-5xl px-4 py-16">
        <a
          href="/"
          className="text-sm font-medium text-amber-700 hover:text-amber-800"
        >
          ← Back to home
        </a>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-stone-800">
        The roster
      </h1>
        <p className="mt-2 max-w-2xl text-stone-600">
        Gaggle of Goldens community walks are step one; from there a dog can
        become a therapy candidate and then a certified therapy dog.
      </p>
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {dogs.map((dog: RosterDog) => (
            <li
              key={dog.id}
              className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-amber-100"
            >
              <RosterPhoto id={dog.id} name={dog.name} />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate font-medium text-stone-800">
                  {dog.name}
                </span>
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
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
