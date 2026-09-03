import { useEffect, useState } from "react";
import { roster, type RosterDog, type RosterTier } from "../data/roster";
import { listRosterDogs } from "../lib/schedule";
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
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg border-2 border-dashed border-[#E8CFA0] bg-[#FFF8EB] text-sm italic text-[#A98B65]">
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
      className="aspect-[4/3] w-full rounded-lg object-cover"
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
    <div className="min-h-screen bg-[#FDFBF7] text-[#29180C]">
      <main className="mx-auto max-w-5xl px-4 py-16">
        <PageTop
          title="The roster"
          lede="Gaggle of Goldens community walks are step one; from there a dog can become a therapy candidate and then a certified therapy dog."
        />
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {dogs.map((dog: RosterDog) => (
            <li
              key={dog.id}
              className="rounded-[1.25rem] border border-[#E8CFA0] bg-white/90 p-2 shadow-[0_10px_24px_-16px_rgba(180,83,9,0.45)]"
            >
              <div className="rounded-lg ring-1 ring-[#E8CFA0] ring-offset-2 ring-offset-[#FDFBF7]">
                <RosterPhoto id={dog.id} name={dog.name} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 px-1 pb-1">
                <span className="truncate font-medium text-[#29180C]">
                  {dog.name}
                </span>
                <span className="shrink-0 rounded-full border border-[#F0DCAE] bg-[#FBEED3] px-2 py-0.5 text-xs font-medium text-[#B45309]">
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
