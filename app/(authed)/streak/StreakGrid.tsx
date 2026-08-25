/**
 * 12-week contribution grid. Cells shaded by activity count for the
 * day (0..≥4). Non-existent future days in the current week render
 * as empty spacers so the current week's day of the week lines up.
 *
 * Weeks are Mon–Sun. Grid rows are days (0=Mon..6=Sun), columns are
 * weeks with the current week last.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface GridDay {
  date: string;
  count: number;
}

function buildGrid(items: { completedAt: string | null }[]): (GridDay | null)[][] {
  const now = new Date();
  const todayIsoDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const jsDow = todayIsoDay.getUTCDay();
  const dayIdx = jsDow === 0 ? 6 : jsDow - 1;
  const start = new Date(todayIsoDay);
  start.setUTCDate(start.getUTCDate() - (11 * 7 + dayIdx));

  const daily = new Map<string, number>();
  for (const it of items) {
    if (!it.completedAt) continue;
    const d = new Date(it.completedAt);
    const key = d.toISOString().slice(0, 10);
    daily.set(key, (daily.get(key) ?? 0) + 1);
  }

  const grid: (GridDay | null)[][] = [];
  for (let w = 0; w < 12; w++) {
    const week: (GridDay | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(start);
      cell.setUTCDate(cell.getUTCDate() + w * 7 + d);
      if (cell.getTime() > todayIsoDay.getTime()) {
        week.push(null);
        continue;
      }
      const key = cell.toISOString().slice(0, 10);
      week.push({ date: key, count: daily.get(key) ?? 0 });
    }
    grid.push(week);
  }
  return grid;
}

function colorForCount(n: number): string {
  // Empty cells follow the theme rule colour — a hardcoded light grey
  // sat on the dark page looking like missing data.
  if (n <= 0) return "var(--rule)";
  if (n === 1) return "#FFDCC5";
  if (n === 2) return "#FFAF85";
  if (n === 3) return "#FF8151";
  return "#FF6B35";
}

export function StreakGrid({
  items,
}: {
  items: { completedAt: string | null }[];
}) {
  const grid = buildGrid(items);
  const totalActiveDays = grid.reduce(
    (n, w) => n + w.filter((d) => d && d.count > 0).length,
    0,
  );
  const CELL = 14;
  const GAP = 4;
  return (
    <div className="rounded-2xl border border-rule bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-display text-[15px] text-ink">Last 12 weeks</div>
        <div className="text-[12px] text-ink-mute">
          {totalActiveDays} active days
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex" style={{ gap: GAP, width: "max-content" }}>
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
              {week.map((day, di) => {
                if (!day) {
                  return (
                    <div
                      key={di}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 3,
                        background: "transparent",
                      }}
                    />
                  );
                }
                return (
                  <div
                    key={di}
                    title={`${day.date} · ${day.count} session${day.count === 1 ? "" : "s"}`}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 3,
                      background: colorForCount(day.count),
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-ink-mute">Less</span>
        {[0, 1, 2, 4].map((n) => (
          <span
            key={n}
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 3,
              background: colorForCount(n),
              display: "inline-block",
            }}
          />
        ))}
        <span className="text-[10px] font-semibold text-ink-mute">More</span>
        <span className="ml-auto text-[10px] font-semibold text-ink-mute">
          {MONTHS[new Date().getMonth()]}
        </span>
      </div>
    </div>
  );
}
