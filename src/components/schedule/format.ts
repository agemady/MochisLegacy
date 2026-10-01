// Small display helpers for /schedule. Times are always Mountain Time.
import { denverDay } from "../../lib/time";

const TZ = "America/Denver";

/** "Oct 2" */
export const shortDate = (iso: string): string =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric" }).format(new Date(iso));

/** { month: "OCT", day: "2" } for the calendar tile. */
export function dateTile(iso: string): { month: string; day: string } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric" }).formatToParts(
    new Date(iso),
  );
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { month: get("month").toUpperCase(), day: get("day") };
}

/** "Today" / "Tomorrow" / "In 8 days" / "Happening now", counted in Mountain Time days. */
export function whenLabel(startISO: string, endISO: string, now: Date = new Date()): string {
  const t = now.getTime();
  if (Date.parse(startISO) <= t && t < Date.parse(endISO)) return "Happening now";
  const days = Math.round((Date.parse(denverDay(startISO)) - Date.parse(denverDay(now))) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export const hasStarted = (iso: string, now: Date = new Date()): boolean => Date.parse(iso) <= now.getTime();

export const mapsUrl = (spot: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot)}`;

export const firstName = (name: string): string => name.trim().split(/\s+/)[0] || name;

/** Shared class strings (Direction A tokens from src/index.css). */
export const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-honey-dark";

export const CARD =
  "rounded-[2rem] border border-sandstone bg-white/95 shadow-[0_18px_44px_-24px_rgba(180,83,9,0.45)]";

export const PRIMARY = `inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-honey-dark px-6 py-3 text-base font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_12px_24px_-12px_rgba(180,83,9,0.9)] hover:bg-[#9a4508] disabled:cursor-wait disabled:opacity-70 motion-safe:transition-colors ${FOCUS}`;

export const SECONDARY = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border-2 border-honey bg-white px-4 text-sm font-bold text-honey-dark hover:border-honey-dark hover:bg-butter disabled:opacity-60 motion-safe:transition-colors ${FOCUS}`;

export const QUIET = `inline-flex min-h-11 items-center gap-1.5 rounded-full text-sm font-semibold text-umber underline decoration-sandstone decoration-2 underline-offset-4 hover:text-espresso hover:decoration-honey disabled:opacity-60 ${FOCUS}`;
