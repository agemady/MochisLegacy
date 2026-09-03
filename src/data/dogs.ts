/**
 * The kickoff dog squad — call names only (AGENT-COORDINATION.md, ruling 4).
 *
 * Eleven founding dogs, including two Junis: the founder's portraits
 * disambiguate them, so the UI renders two identical "Juni" cards keyed by
 * id (juni-1 / juni-2).
 *
 * Content discipline: call names ONLY. No aliases, no superpowers, no
 * backstories, no breed/age facts — none of that is attested; the founder's
 * art and copy will tell each dog's real story.
 *
 * Art slots: founder-authored portraits will land per `id` (naming/dir to be
 * decided with the founder). Until then DogSquad renders a reserved
 * placeholder slot keyed by `id`.
 */

export interface SquadDog {
  /** stable slug — list keys and the future founder-art slot */
  id: string;
  /** call name, exactly as printed on the card */
  name: string;
}

export const squadDogs: SquadDog[] = [
  { id: "benny", name: "Benny" },
  { id: "honey", name: "Honey" },
  { id: "bear", name: "Bear" },
  { id: "juni-1", name: "Juni" },
  { id: "juni-2", name: "Juni" },
  { id: "louie", name: "Louie" },
  { id: "moss", name: "Moss" },
  { id: "buddy", name: "Buddy" },
  { id: "jaz", name: "Jaz" },
  { id: "mini-mochi", name: "Mini Mochi" },
  { id: "luna", name: "Luna" },
];
