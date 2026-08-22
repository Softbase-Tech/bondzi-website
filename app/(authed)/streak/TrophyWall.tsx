import { Trophy } from "lucide-react";

/**
 * Streak trophy wall — three tiles that unlock as `longestStreak`
 * crosses 7 / 14 / 30. Kept small so it doesn't dominate the hero.
 */
export function TrophyWall({ longestStreak }: { longestStreak: number }) {
  const trophies = [
    { days: 7, label: "Week runner", unlocked: longestStreak >= 7 },
    { days: 14, label: "Fortnight fire", unlocked: longestStreak >= 14 },
    { days: 30, label: "Month master", unlocked: longestStreak >= 30 },
  ];
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
        Streak trophies
      </div>
      <div className="grid grid-cols-3 gap-3">
        {trophies.map((t) => (
          <div
            key={t.days}
            className={
              "rounded-2xl px-3 py-4 flex flex-col items-center gap-2 " +
              (t.unlocked
                ? "bg-gradient-to-br from-[#FFB020] to-[#E48908] text-white"
                : "bg-ink/5 text-ink-mute")
            }
          >
            <Trophy
              size={22}
              className={t.unlocked ? "text-white" : "text-ink-mute"}
            />
            <div
              className={
                "font-display leading-none text-[22px] " +
                (t.unlocked ? "text-white" : "text-ink-soft")
              }
            >
              {t.days}
            </div>
            <div
              className={
                "text-[10px] font-semibold text-center tracking-wide " +
                (t.unlocked ? "text-white/85" : "text-ink-mute")
              }
            >
              {t.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
