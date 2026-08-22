import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getUserStats } from "@/lib/api/user";
import { listExamHistory } from "@/lib/api/exams";
import { StreakGrid } from "./StreakGrid";
import { HeroFlame } from "./HeroFlame";
import { TrophyWall } from "./TrophyWall";

export const metadata: Metadata = {
  title: "Streak",
  description: "Your daily study streak and 12-week activity map.",
};

/**
 * `/streak` — the dedicated streak surface. Mirrors the mobile
 * `streak/index.tsx` shape:
 *
 *   1. Hero flame with current streak + personal best.
 *   2. This week — 7-day dot row with today ringed in coral.
 *   3. Last 12 weeks — GitHub-style contribution grid built from
 *      /exams/history (last 100 completed sessions).
 *   4. Trophy wall — 7 / 14 / 30-day milestone tiles.
 *   5. How streaks work explainer.
 *
 * Server-rendered; the grid math and hero SVG are static output.
 * History is capped at 100 completed sessions — enough to cover the
 * 84-day window even for a heavy user.
 */
export default async function StreakPage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");
  const { accessToken, profile } = session;

  const [statsRes, historyRes] = await Promise.allSettled([
    getUserStats(accessToken),
    listExamHistory(accessToken, { limit: 100, status: "completed" }),
  ]);

  const stats =
    statsRes.status === "fulfilled" ? statsRes.value : null;
  const history =
    historyRes.status === "fulfilled" ? historyRes.value.items : [];

  const streakBroken = stats?.streakBroken ?? false;
  const streakDays = streakBroken
    ? 0
    : stats?.streakDays ?? profile.streakDays ?? 0;
  const longestStreak =
    stats?.longestStreak ?? profile.longestStreak ?? 0;
  const activeDaysLast7 =
    stats?.activeDaysLast7 ?? [false, false, false, false, false, false, false];
  const todayIndex = stats?.todayIndex ?? 0;

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-soft hover:text-ink transition-colors motion-reduce:transition-none"
      >
        <ArrowLeft size={14} />
        Back to profile
      </Link>

      <header>
        <h1 className="font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Streak
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          One question a day keeps it alive. Miss a day and the count
          resets — your personal best stays saved either way.
        </p>
      </header>

      <HeroFlame
        streakDays={streakDays}
        longestStreak={longestStreak}
        isBroken={streakBroken}
      />

      <ThisWeekCard
        activeDaysLast7={activeDaysLast7}
        todayIndex={todayIndex}
      />

      <StreakGrid items={history.map((row) => ({ completedAt: row.completedAt }))} />

      <TrophyWall longestStreak={longestStreak} />

      <div className="rounded-2xl bg-yellow-soft/40 border border-rule p-5 space-y-2">
        <div className="font-display text-[15px] text-ink">
          How your streak works
        </div>
        <p className="text-[13px] text-ink-soft leading-relaxed">
          Answer at least one question between midnight and midnight in
          Accra time and today counts as active. Miss a day and the
          streak resets. Your longest streak stays saved either way — a
          broken streak is a fresh start, not a reset of your record.
        </p>
      </div>
    </div>
  );
}

function ThisWeekCard({
  activeDaysLast7,
  todayIndex,
}: {
  activeDaysLast7: boolean[];
  todayIndex: number;
}) {
  const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const active = activeDaysLast7.filter(Boolean).length;
  return (
    <div className="rounded-2xl border border-rule bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-display text-[15px] text-ink">This week</div>
        <div className="text-[12px] text-ink-mute">{active}/7 active</div>
      </div>
      <div className="flex gap-2">
        {activeDaysLast7.map((on, i) => {
          const isToday = i === todayIndex;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1.5"
            >
              <div
                className={
                  "w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-semibold " +
                  (on
                    ? "bg-orange text-white"
                    : isToday
                      ? "bg-transparent border-2 border-orange text-orange"
                      : "bg-ink/5 text-ink-mute")
                }
              >
                {on ? "✓" : isToday ? "Today" : ""}
              </div>
              <div
                className={
                  "text-[10px] tracking-widest font-semibold " +
                  (isToday ? "text-orange" : "text-ink-mute")
                }
              >
                {DAYS[i]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
