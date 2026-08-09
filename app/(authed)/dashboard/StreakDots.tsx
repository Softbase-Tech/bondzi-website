import { cn } from "@/lib/utils";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const DAY_A11Y = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

interface Props {
  /** 7-length boolean array, monday..sunday of the current Accra week. */
  active: boolean[];
  /** Index into `active` for "today" — 0 = Monday. */
  todayIndex: number;
}

/**
 * Week-at-a-glance dots below the streak number. Each dot has three
 * states, mirroring mobile:
 *   - filled orange  = user answered ≥1 question that day
 *   - hollow ring    = today (regardless of whether it's answered yet)
 *   - dim rule dot   = past day with no activity
 *
 * The two-character day letter above is intentionally a `<span>` so
 * screen readers pick up the full weekday name via the visible-hidden
 * partner. That way the row reads as "Monday, active. Tuesday, no
 * activity." rather than "M, T, W…" which is meaningless.
 */
export function StreakDots({ active, todayIndex }: Props) {
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {active.map((isActive, i) => {
        const isToday = i === todayIndex;
        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider",
                isToday ? "text-orange" : "text-ink-mute",
              )}
              aria-hidden="true"
            >
              {DAY_LABELS[i]}
            </span>
            <span className="sr-only">
              {DAY_A11Y[i]}
              {isActive ? ", active" : ", no activity"}
              {isToday ? ", today" : ""}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "block w-3 h-3 rounded-full transition-colors",
                isActive
                  ? "bg-orange"
                  : isToday
                    ? "border-2 border-orange bg-paper"
                    : "bg-rule",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
