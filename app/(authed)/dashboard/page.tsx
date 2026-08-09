import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame, ArrowUpRight, Target, BookOpenText, Clock } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { getUserStats, getSelectedSubjectIds } from "@/lib/api/user";
import { listSubjects } from "@/lib/api/subjects";
import { StreakDots } from "./StreakDots";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Bondzi home — pick up where you left off.",
};

/**
 * The dashboard. First real content Phase 2 delivers. Server-rendered
 * so the initial paint has actual stats, not skeletons.
 *
 * Data fetched in parallel:
 *   - user profile (already on the session — no round-trip)
 *   - stats (streak, XP, daily goal, questions this week)
 *   - subjects filtered by the user's examType
 *   - selected-subject IDs so we can highlight the user's favourites
 *
 * All four are best-effort — if any fails we render zero'd tiles
 * rather than blocking the page. A dashboard with "0 streak" and
 * "no subjects loaded" is more useful than a full-screen error for a
 * transient 503.
 */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) {
    redirect("/login");
  }
  const { accessToken, profile } = session;

  const [statsRes, subjectsRes, selectedRes] = await Promise.allSettled([
    getUserStats(accessToken),
    listSubjects(accessToken, profile.examType),
    getSelectedSubjectIds(accessToken),
  ]);

  const stats = statsRes.status === "fulfilled" ? statsRes.value : null;
  const subjects = subjectsRes.status === "fulfilled" ? subjectsRes.value : [];
  const selectedIds =
    selectedRes.status === "fulfilled" ? new Set(selectedRes.value) : new Set<string>();

  const firstName = profile.fullName?.split(" ")[0] ?? "there";
  const streakDays = stats?.streakDays ?? profile.streakDays ?? 0;
  const level = stats?.level ?? profile.currentLevel ?? 1;
  const levelXp = stats?.xp ?? profile.levelXp ?? 0;
  const xpToNextLevel = stats?.xpToNextLevel ?? 0;
  const xpTotal = levelXp + xpToNextLevel;
  const xpFraction = xpTotal > 0 ? levelXp / xpTotal : 0;
  const dailyGoal = stats?.dailyGoal ?? 20;
  const dailyProgress = stats?.dailyGoalProgress ?? 0;
  const dailyFraction = dailyGoal > 0 ? Math.min(1, dailyProgress / dailyGoal) : 0;

  // Sort so favourite subjects come first, then everything else
  // alphabetically. On a fresh account with no favourites this is
  // just alphabetical.
  const orderedSubjects = subjects.slice().sort((a, b) => {
    const aFav = selectedIds.has(a.id) ? 0 : 1;
    const bFav = selectedIds.has(b.id) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Greeting + streak hero */}
      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
            {formatToday()}
          </p>
          <h1 className="mt-1.5 font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
            Hi {firstName}, ready to study?
          </h1>
          <p className="mt-2 text-[15px] text-ink-soft max-w-[52ch]">
            Preparing for{" "}
            <span className="font-semibold text-ink uppercase">
              {profile.examType}
            </span>
            {profile.formLevel
              ? ` · ${profile.examType === "bece" ? "JHS" : "SHS"} Form ${profile.formLevel}`
              : ""}
            .
          </p>
        </div>
        <div className="hidden sm:block">
          <Button href="/practice" size="lg" rightIcon={<ArrowUpRight size={16} />}>
            Start practising
          </Button>
        </div>
      </section>

      {/* Stat tiles */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Streak */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
                Streak
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-[42px] leading-none text-ink">
                  {streakDays}
                </span>
                <span className="text-[14px] text-ink-soft">
                  {streakDays === 1 ? "day" : "days"}
                </span>
              </div>
            </div>
            <div
              className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${
                stats?.streakBroken
                  ? "bg-rule text-ink-mute"
                  : "bg-orange text-paper"
              }`}
              aria-hidden="true"
            >
              <Flame size={22} />
            </div>
          </div>
          <div className="mt-4">
            <StreakDots
              active={stats?.activeDaysLast7 ?? [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
              ]}
              todayIndex={stats?.todayIndex ?? 0}
            />
          </div>
          {stats?.streakAtRisk ? (
            <p className="mt-3 text-[12.5px] font-medium text-orange-deep">
              Answer one question today to keep it alive.
            </p>
          ) : stats?.streakBroken ? (
            <p className="mt-3 text-[12.5px] text-ink-mute">
              Start a new streak today.
            </p>
          ) : (
            <p className="mt-3 text-[12.5px] text-ink-mute">
              Longest ever: {stats?.longestStreak ?? profile.longestStreak ?? 0}{" "}
              days.
            </p>
          )}
        </Card>

        {/* XP + level */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <ProgressRing value={xpFraction} size={92} label="Progress to next level">
              <div className="text-center">
                <div className="font-display text-[24px] leading-none text-ink">
                  {level}
                </div>
                <div className="text-[10.5px] font-medium uppercase tracking-widest text-ink-mute mt-1">
                  Level
                </div>
              </div>
            </ProgressRing>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
                XP
              </div>
              <div className="mt-1 font-display text-[28px] leading-none text-ink truncate">
                {levelXp.toLocaleString()}
              </div>
              <div className="mt-1 text-[12.5px] text-ink-soft">
                {xpToNextLevel > 0
                  ? `${xpToNextLevel.toLocaleString()} to level ${level + 1}`
                  : "Max level"}
              </div>
            </div>
          </div>
        </Card>

        {/* Daily goal */}
        <Card className="p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4">
            <ProgressRing
              value={dailyFraction}
              size={92}
              label="Today's questions vs goal"
              color="var(--yellow)"
            >
              <div className="text-center">
                <div className="font-display text-[24px] leading-none text-ink">
                  {dailyProgress}
                </div>
                <div className="text-[10.5px] font-medium uppercase tracking-widest text-ink-mute mt-1">
                  of {dailyGoal}
                </div>
              </div>
            </ProgressRing>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
                Daily goal
              </div>
              <div className="mt-1 font-display text-[20px] leading-tight text-ink">
                {dailyProgress >= dailyGoal
                  ? "Nice — you're done for today"
                  : `${dailyGoal - dailyProgress} to go`}
              </div>
              <div className="mt-1 text-[12.5px] text-ink-soft inline-flex items-center gap-1">
                <Clock size={12} />
                {stats?.studyMinutesToday ?? 0} min today
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Subjects list */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-[22px] sm:text-[26px] text-ink">
            Your subjects
          </h2>
          <Link
            href="/subjects"
            className="text-[13px] font-semibold text-orange hover:text-orange-deep transition-colors"
          >
            See all
          </Link>
        </div>
        {orderedSubjects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orderedSubjects.slice(0, 6).map((subject) => (
              <Link
                key={subject.id}
                href={`/subjects/${subject.id}`}
                className="group"
              >
                <Card
                  interactive
                  className="p-5 h-full flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-3">
                      <div
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-soft text-orange shrink-0"
                        aria-hidden="true"
                      >
                        <BookOpenText size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-[18px] leading-tight text-ink group-hover:text-orange-deep transition-colors truncate">
                          {subject.name}
                        </div>
                        <div className="text-[12px] text-ink-mute mt-0.5">
                          {subject.code}
                        </div>
                      </div>
                    </div>
                    {subject.category ? (
                      <div className="mt-3 inline-flex items-center px-2 h-6 rounded-full bg-rule/50 text-[11px] font-medium text-ink-soft uppercase tracking-wider">
                        {subject.category}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[12px] text-ink-mute">
                    <span>
                      {(subject.topicCount ?? 0).toLocaleString()} topics
                    </span>
                    <span>
                      {(subject.questionCount ?? 0).toLocaleString()} questions
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="grid gap-3 sm:grid-cols-3">
        <QuickAction
          href="/past-papers"
          title="Past papers"
          body="Nine years of WAEC papers"
          icon={<BookOpenText size={18} />}
        />
        <QuickAction
          href="/practice"
          title="Practice"
          body="Focused topic drills"
          icon={<Target size={18} />}
        />
        <QuickAction
          href="/quiz"
          title="Quiz"
          body="Fresh AI questions"
          icon={<Flame size={18} />}
        />
      </section>

      {/* Sticky mobile CTA */}
      <div className="sm:hidden">
        <Button href="/practice" size="lg" block rightIcon={<ArrowUpRight size={16} />}>
          Start practising
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-soft text-orange mb-3">
        <BookOpenText size={22} />
      </div>
      <p className="font-display text-[18px] text-ink">
        Subjects load in a moment
      </p>
      <p className="mt-1.5 text-[13.5px] text-ink-soft max-w-[42ch] mx-auto">
        We couldn&apos;t reach the subject list right now. Refresh the page
        in a moment.
      </p>
    </Card>
  );
}

function QuickAction({
  href,
  title,
  body,
  icon,
}: {
  href: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="group">
      <Card
        interactive
        className="p-4 h-full flex items-center gap-3.5"
      >
        <div
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-soft text-orange shrink-0"
          aria-hidden="true"
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-ink group-hover:text-orange-deep transition-colors">
            {title}
          </div>
          <div className="text-[12.5px] text-ink-mute truncate">{body}</div>
        </div>
        <ArrowUpRight
          size={16}
          className="text-ink-mute group-hover:text-orange transition-colors shrink-0"
        />
      </Card>
    </Link>
  );
}

/**
 * Server-side "today" formatted for the greeting kicker. Kept minimal —
 * date-fns is overkill for one line.
 */
function formatToday(): string {
  const now = new Date();
  // Format explicitly in en-GH to keep the day/month order consistent
  // with Ghanaian date conventions.
  return now.toLocaleDateString("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
