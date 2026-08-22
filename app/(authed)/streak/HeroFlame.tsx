import { Trophy } from "lucide-react";

/**
 * Hero flame card. Coral gradient when the streak is alive, cool navy
 * when broken. Pure server component — SVG is static.
 */
export function HeroFlame({
  streakDays,
  longestStreak,
  isBroken,
}: {
  streakDays: number;
  longestStreak: number;
  isBroken: boolean;
}) {
  const t = Math.max(0, Math.min(1, streakDays / 30));
  const gradient = isBroken
    ? "from-[#1E293B] to-[#0F172A]"
    : "from-[#FF6B35] via-[#E55A26] to-[#B23A0C]";
  const subtitle = isBroken
    ? "Streak broken — start today to rekindle it"
    : streakDays === 1
      ? "Day one · make it two"
      : `Day ${streakDays} · keep it alive today`;
  return (
    <div
      className={
        "relative overflow-hidden rounded-3xl px-6 py-10 text-center bg-gradient-to-b " +
        gradient
      }
    >
      <div
        className="absolute left-1/2 top-8 -translate-x-1/2 rounded-full opacity-40"
        style={{
          width: 220,
          height: 220,
          background: isBroken
            ? "radial-gradient(closest-side, rgba(255,255,255,0.06), transparent)"
            : "radial-gradient(closest-side, rgba(255,255,255,0.18), transparent)",
        }}
        aria-hidden
      />
      <FlameSvg intensity={t} muted={isBroken} />
      <div
        className="font-display text-white leading-none mt-3"
        style={{ fontSize: 68, letterSpacing: -1 }}
      >
        {streakDays}
      </div>
      <div className="text-white/85 text-[14px] font-semibold tracking-wide mt-2">
        {subtitle}
      </div>
      {longestStreak > 0 ? (
        <div className="inline-flex items-center gap-2 mt-4 bg-white/10 px-3 py-1.5 rounded-full">
          <Trophy size={12} className="text-white" />
          <span className="text-[12px] font-semibold text-white">
            Personal best {longestStreak}{" "}
            {longestStreak === 1 ? "day" : "days"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function FlameSvg({
  intensity,
  muted,
}: {
  intensity: number;
  muted: boolean;
}) {
  return (
    <svg
      width={110}
      height={130}
      viewBox="0 0 100 120"
      className="mx-auto relative"
      aria-hidden
    >
      <defs>
        <linearGradient id="flameOuter" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor={muted ? "#64748B" : "#FFF3EC"} />
          <stop offset="0.55" stopColor={muted ? "#334155" : "#FFB89A"} />
          <stop offset="1" stopColor={muted ? "#0F172A" : "#7A2500"} />
        </linearGradient>
        <linearGradient id="flameInner" x1="0.5" y1="0.2" x2="0.5" y2="1">
          <stop offset="0" stopColor={muted ? "#94A3B8" : "#FFFFFF"} />
          <stop offset="1" stopColor={muted ? "#475569" : "#FFDAB0"} />
        </linearGradient>
      </defs>
      <path
        d="M50 6c6 20-11 27-10 47 1 12 12 15 12 30 0 20-18 32-32 32-15 0-23-14-23-30 0-16 9-28 20-38 4-4 5-9 3-15-1-5-1-11 4-16 6-6 13-4 20 0 3 2 5 1 6-2 0-3 0-6 0-8z"
        fill="url(#flameOuter)"
        opacity={0.85 + intensity * 0.15}
      />
      <path
        d="M52 34c-2 12-14 20-15 34 0 12 8 17 8 30 0 10-6 18-15 18-10 0-16-9-16-22 0-13 7-22 15-30 5-5 4-10 3-15-2-6 0-13 5-17 8 0 15 2 15 2z"
        fill="url(#flameInner)"
        opacity={0.9}
      />
    </svg>
  );
}
