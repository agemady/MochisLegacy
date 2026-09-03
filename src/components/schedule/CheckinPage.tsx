import { useReducer, useState } from "react";
import { transition, type CheckinEvent, type CheckinState } from "../../lib/checkin";
import PageTop from "../PageTop";

export type CheckinRow = {
  dogId: string;
  dogName: string;
  ownerName: string;
  /** Tappable tel: link renders only when present (roster data has no phones yet). */
  ownerPhone?: string;
  hasWaiver: boolean;
  hasPhotoConsent: boolean;
};

export type CheckinPageProps = {
  rows: CheckinRow[];
  walkLabel: string;
  /** Roster failed to load upstream (p1's gate owns loading/retry). */
  loadError?: boolean;
  /** 'undo_check_in' is a local reset — terminal machine states accept no events. */
  onEvent: (dogId: string, event: CheckinEvent | "undo_check_in") => Promise<void>;
};

type RowState = { state: CheckinState; error?: string };
type Action =
  | { type: "apply"; dogId: string; event: CheckinEvent; at: string }
  | { type: "undo"; dogId: string }
  | { type: "fail"; dogId: string };

function reducer(rows: Record<string, RowState>, action: Action): Record<string, RowState> {
  const row = rows[action.dogId];
  if (!row) return rows;
  if (action.type === "undo") return { ...rows, [action.dogId]: { state: "rsvpd" } };
  if (action.type === "fail") return { ...rows, [action.dogId]: { ...row, error: "That didn't save — tap again." } };
  const next = transition(row.state, action.event, action.at);
  return next.ok
    ? { ...rows, [action.dogId]: { state: next.state } }
    : { ...rows, [action.dogId]: { ...row, error: "That didn't save — tap again." } };
}

const BTN_GREEN = "rounded-full bg-[#2C5E43] px-4 py-2 text-sm font-semibold text-white";
const BTN_RED = "rounded-full border border-[#E2B3A9] px-4 py-2 text-sm font-semibold text-[#A4432F]";
const BADGE_OK = "rounded-full bg-[#DCE9E1] px-2 py-0.5 text-xs font-medium text-[#2C5E43]";
const BADGE_WARN = "rounded-full bg-[#F3D9A2] px-2 py-0.5 text-xs font-medium text-[#7A4E12]";

export default function CheckinPage({ rows, walkLabel, loadError, onEvent }: CheckinPageProps) {
  const [rowStates, dispatch] = useReducer(reducer, {} as Record<string, RowState>);
  const [optOutId, setOptOutId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const at = () => new Date().toISOString();

  const stateOf = (r: CheckinRow): RowState => rowStates[r.dogId] ?? { state: "rsvpd" };
  const ordered = [...rows].sort((a, b) => a.dogName.localeCompare(b.dogName));
  const checkedIn = ordered.filter((r) => stateOf(r).state === "checked_in").length;

  async function apply(dogId: string, event: CheckinEvent | "undo_check_in") {
    if (event !== "undo_check_in") dispatch({ type: "apply", dogId, event, at: at() });
    else dispatch({ type: "undo", dogId });
    try {
      await onEvent(dogId, event);
    } catch {
      if (event !== "undo_check_in") dispatch({ type: "fail", dogId });
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#29180C]">
      <main className="mx-auto max-w-3xl px-4 py-16">
        <PageTop title="Check in" lede={walkLabel} />
        {loadError ? (
          <p className="text-sm text-[#A4432F]">Couldn't load the roster — retry.</p>
        ) : (
          <>
          <p className="mb-4 text-sm text-[#6B5545]">
            {checkedIn} checked in · {ordered.length} expected
          </p>
          <ul className="space-y-2">
            {ordered.map((r) => {
              const { state, error } = stateOf(r);
              const optingOut = optOutId === r.dogId;
              return (
                <li
                  key={r.dogId}
                  className={`rounded-2xl border border-[#F3D9A2] bg-white p-4 ${state === "opted_out" ? "opacity-50" : ""}`}
                >
                  {state === "checked_in" ? (
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#29180C]">
                        {r.dogName} <span className={`ml-1 ${BADGE_OK}`}>Checked in</span>
                      </span>
                      <button className={`${BTN_RED} px-3`} onClick={() => apply(r.dogId, "undo_check_in")}>
                        Undo
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-[#29180C]">{r.dogName}</p>
                          <p className="truncate text-sm text-[#6B5545]">
                            {r.ownerName}
                            {r.ownerPhone && (
                              <>
                                {" · "}
                                <a className="underline" href={`tel:${r.ownerPhone}`}>
                                  {r.ownerPhone}
                                </a>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button className={BTN_GREEN} onClick={() => apply(r.dogId, "check_in")}>
                            Check in
                          </button>
                          <button
                            className={BTN_RED}
                            onClick={() => {
                              setOptOutId(optingOut ? null : r.dogId);
                              setNote("");
                            }}
                          >
                            Opt out
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-1">
                        <span className={r.hasWaiver ? BADGE_OK : BADGE_WARN}>
                          {r.hasWaiver ? "Waiver signed" : "No waiver"}
                        </span>
                        {r.hasPhotoConsent && <span className={BADGE_OK}>Photo OK</span>}
                      </div>
                      {optingOut && (
                        <div className="mt-3 space-y-2">
                          <input
                            className="w-full rounded-xl border border-[#F3D9A2] p-2 text-sm"
                            placeholder="Optional note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              className={BTN_RED}
                              onClick={() => {
                                setOptOutId(null);
                                setNote("");
                                void apply(r.dogId, "opted_out");
                              }}
                            >
                              Confirm opt out
                            </button>
                            <button className={BTN_RED} onClick={() => setOptOutId(null)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {error && <p className="mt-2 text-sm text-[#A4432F]">{error}</p>}
                </li>
              );
            })}
          </ul>
        </>
        )}
      </main>
    </div>
  );
}
