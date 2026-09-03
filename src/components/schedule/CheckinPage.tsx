import { useReducer } from "react";
import { transition, type CheckinState, type CheckinEvent } from "../../lib/checkin";

/** One row of the day-of list, as produced by listRsvpsForWalk (src/lib/schedule.ts). */
export type CheckinRow = {
  dogId: string;
  dogName: string;
  ownerName: string;
  hasWaiver: boolean;
  hasPhotoConsent: boolean;
};

export type CheckinPageProps = {
  rows: CheckinRow[];
  /** Walk label, e.g. "Thu Oct 2 · 9:00–10:00 AM · Shelter A". */
  walkLabel: string;
  /** Apply the event to the backend (schedule.ts): checkIn/optOut/checkOut. */
  onEvent: (dogId: string, event: CheckinEvent) => Promise<void>;
};

type RowState = { state: CheckinState; error: string | null };
type Action =
  | { type: "apply"; dogId: string; event: CheckinEvent; at: string }
  | { type: "reset" };

function reducer(
  states: Record<string, RowState>,
  action: Action,
): Record<string, RowState> {
  if (action.type === "reset") return {};
  const current = states[action.dogId] ?? { state: "rsvpd" as CheckinState, error: null };
  const result = transition(current.state, action.event, action.at);
  return {
    ...states,
    [action.dogId]: result.ok
      ? { state: result.state, error: null }
      : { ...current, error: "That move isn't allowed now." },
  };
}

const badge = "rounded-full px-2 py-0.5 text-xs font-medium";
const ok = "bg-green-100 text-green-800";
const button =
  "rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-40";

/** Admin day-of check-in list for the upcoming walk (route /checkin). */
export default function CheckinPage({ rows, walkLabel, onEvent }: CheckinPageProps) {
  const [states, dispatch] = useReducer(reducer, {});

  const stateOf = (r: CheckinRow) => states[r.dogId]?.state ?? "rsvpd";
  const checkedIn = rows.filter((r) => stateOf(r) === "checked_in").length;
  const done = (r: CheckinRow) =>
    ["checked_out", "no_show", "opted_out"].includes(stateOf(r));

  const apply = async (dogId: string, event: CheckinEvent) => {
    dispatch({ type: "apply", dogId, event, at: new Date().toISOString() });
    await onEvent(dogId, event);
  };

  return (
    <div className="min-h-screen bg-amber-50 text-stone-800">
      <main className="mx-auto max-w-md px-4 py-10">
        <a href="/schedule" className="text-sm font-medium text-amber-700">← Back to schedule</a>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Day-of check-in</h1>
        <p className="mt-1 text-sm text-stone-600">{walkLabel}</p>
        <div className="mt-4 flex gap-2">
          <span className={`${badge} bg-amber-200 text-amber-900`}>{checkedIn} checked in</span>
          <span className={`${badge} bg-stone-200 text-stone-700`}>{rows.length} expected</span>
        </div>
        <ul className="mt-6 space-y-3">
          {rows.map((r) => {
            const s = states[r.dogId] ?? { state: "rsvpd" as CheckinState, error: null };
            return (
              <li key={r.dogId}
                className={`rounded-xl border bg-white p-4 shadow-sm ${done(r) ? "opacity-60" : ""}`}>
                <p className="font-semibold">{r.dogName}</p>
                <p className="text-sm text-stone-600">with {r.ownerName}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className={`${badge} ${r.hasWaiver ? ok : "bg-red-100 text-red-700"}`}>
                    {r.hasWaiver ? "waiver ✓" : "no waiver"}
                  </span>
                  <span className={`${badge} ${r.hasPhotoConsent ? ok : "bg-stone-100 text-stone-500"}`}>
                    {r.hasPhotoConsent ? "photo ✓" : "no photo"}
                  </span>
                  {s.state !== "rsvpd" && (
                    <span className={`${badge} bg-amber-100 text-amber-800`}>
                      {s.state.replace("_", " ")}
                    </span>
                  )}
                </div>
                {s.error && <p className="mt-2 text-sm text-red-600">{s.error}</p>}
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={s.state !== "rsvpd"}
                    onClick={() => apply(r.dogId, "check_in")}
                    className={`${button} bg-amber-600 text-white hover:bg-amber-700`}>
                    Check in
                  </button>
                  <button type="button" disabled={s.state !== "rsvpd"}
                    onClick={() => apply(r.dogId, "opted_out")}
                    className={`${button} border border-stone-300 text-stone-700 hover:bg-stone-100`}>
                    Opt out
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
