/**
 * Dog roster (pane w2:p1) — unlisted page at /roster.
 * Call names only, no invented facts; photos live at /roster/<id>.jpg
 * (absent files fall back to a dashed "photo coming" slot in Roster.tsx).
 */
export type RosterTier = "gaggle" | "candidate" | "therapy";

export interface RosterDog {
  id: string;
  name: string;
  tier: RosterTier;
}

/** The 11 kickoff dogs, as of the October 2 kickoff. */
export const roster: RosterDog[] = [
  { id: "benny", name: "Benny", tier: "gaggle" },
  { id: "honey", name: "Honey", tier: "gaggle" },
  { id: "bear", name: "Bear", tier: "gaggle" },
  { id: "juni-1", name: "Juni", tier: "gaggle" },
  { id: "juni-2", name: "Juni", tier: "gaggle" },
  { id: "louie", name: "Louie", tier: "gaggle" },
  { id: "moss", name: "Moss", tier: "gaggle" },
  { id: "buddy", name: "Buddy", tier: "gaggle" },
  { id: "jaz", name: "Jaz", tier: "gaggle" },
  { id: "mini-mochi", name: "Mini Mochi", tier: "gaggle" },
  { id: "luna", name: "Luna", tier: "gaggle" },
];
