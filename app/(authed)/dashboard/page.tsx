import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Flame,
  ArrowUpRight,
  Play,
  Target,
  BookOpenText,
  Clock,
} from "lucide-react";
import { auth } from "@/lib/auth/config";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { getUserStats, getSelectedSubjectIds } from "@/lib/api/user";
import { listSubjects } from "@/lib/api/subjects";
import { getResumeExam } from "@/lib/api/exams";
import { getAchievementsServer } from "@/lib/api/achievements";
import type { Achievement } from "@/lib/api/types";
import { intersectWithSelected, hasSelection } from "@/lib/subjects/selected";
import {
  NoSelectedSubjectsCta,
  AddMoreSubjectsLink,
} from "@/components/subjects/SubjectSelectionCta";
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

  const [statsRes, subjectsRes, selectedRes, resumeRes, achievementsRes] =
    await Promise.allSettled([
      getUserStats(accessToken),
      listSubjects(accessToken, profile.examType),
      getSelectedSubjectIds(accessToken),
      getResumeExam(accessToken),
      getAchievementsServer(accessToken),
    ]);

  const stats = statsRes.status === "fulfilled" ? statsRes.value : null;
  const subjects = subjectsRes.status === "fulfilled" ? subjectsRes.value : [];
  const selectedIdList =
    selectedRes.status === "fulfilled" ? selectedRes.value : [];
  const resume = resumeRes.status === "fulfilled" ? resumeRes.value : null;
  const achievements =
    achievementsRes.status === "fulfilled" ? achievementsRes.value : [];

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

  // Narrow to the student's picked subjects only. On accounts with no
  // selection we fall through to the empty-state CTA below; the grid
  // no longer renders every subject "just in case".
  const selectedSubjects = intersectWithSelected(subjects, selectedIdList)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  const studentPicked = hasSelection(selectedIdList);

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
          <Button href="/subjects" size="lg" rightIcon={<ArrowUpRight size={16} />}>
            Pick a subject
          </Button>
        </div>
      </section>

      {resume ? (
        <ContinueCard
          examId={resume.id}
          mode={resume.mode}
          questionCount={resume.questionCount}
          remaining={
            resume.questions.filter((q) => q).length ||
            resume.questionCount
          }
        />
      ) : null}

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

      {/* Subjects list — only the ones the student picked. */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-[22px] sm:text-[26px] text-ink">
            Your subjects
          </h2>
          {studentPicked ? (
            <Link
              href="/subjects"
              className="text-[13px] font-semibold text-orange hover:text-orange-deep transition-colors"
            >
              See all
            </Link>
          ) : null}
        </div>
        {!studentPicked ? (
          <NoSelectedSubjectsCta />
        ) : selectedSubjects.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedSubjects.slice(0, 6).map((subject) => (
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
            <div className="mt-4">
              <AddMoreSubjectsLink />
            </div>
          </>
        )}
      </section>

      {achievements.length > 0 ? (
        <AchievementsStrip achievements={achievements} />
      ) : null}

      {/* Quick actions */}
      <section className="grid gap-3 sm:grid-cols-3">
        <QuickAction
          href="/past-papers"
          title="Past papers"
          body="Nine years of WAEC papers"
          icon={<BookOpenText size={18} />}
        />
        <QuickAction
          href="/quiz"
          title="Quiz"
          body="Fresh AI questions daily"
          icon={<Flame size={18} />}
        />
        <QuickAction
          href="/mock-exams"
          title="Mock exam"
          body="50 questions · 3 hours"
          icon={<Target size={18} />}
        />
      </section>

      {/* Sticky mobile CTA */}
      <div className="sm:hidden">
        <Button href="/subjects" size="lg" block rightIcon={<ArrowUpRight size={16} />}>
          Pick a subject
        </Button>
      </div>
    </div>
  );
}

/**
 * Continue-where-you-left-off card. Same coral outline treatment as
 * mobile — the only screen element wearing the orange accent, since
 * a genuine resume is the strongest call to action on the home.
 */
function ContinueCard({
  examId,
  mode,
  questionCount,
  remaining,
}: {
  examId: string;
  mode: string;
  questionCount: number;
  remaining: number;
}) {
  const label =
    mode === "past_paper"
      ? "Continue past paper"
      : mode === "pm_test"
        ? "Continue quiz"
        : mode === "mock_exam"
          ? "Continue mock exam"
          : "Continue session";
  const answered = Math.max(0, questionCount - remaining);
  const detail = `Question ${answered + 1} of ${questionCount}`;
  return (
    <Link
      href={`/exam/${encodeURIComponent(examId)}`}
      className="block rounded-2xl border-2 border-orange bg-paper p-4 sm:p-5 hover:bg-yellow-soft/40 transition-colors motion-reduce:transition-none"
      aria-label={label}
    >
      <div className="flex items-center gap-4">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-yellow-soft text-orange-deep shrink-0">
          <Play size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-nunito-bold text-[17px] text-ink">{label}</div>
          <div className="text-[13px] text-ink-mute mt-0.5">{detail}</div>
        </div>
        <ArrowUpRight size={20} className="text-orange shrink-0" />
      </div>
    </Link>
  );
}

/**
 * Achievements strip — horizontal-scroll rail of milestone chips
 * (unlocked + next-to-unlock). Same catalogue mobile renders in
 * MilestonesStrip. Shows the six highest-priority items ordered by
 * (unlocked DESC within-progress) so the student sees a mix of
 * trophies + progress hints without the whole list.
 */
function AchievementsStrip({ achievements }: { achievements: Achievement[] }) {
  const sorted = achievements
    .slice()
    .sort((a, b) => {
      // Unlocked first (recent unlocks feel like a win), then rows
      // that are closest to unlocking (highest progress ratio),
      // then the rest by sortOrder.
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      const aRatio =
        a.progressTarget > 0 ? a.progressCurrent / a.progressTarget : 0;
      const bRatio =
        b.progressTarget > 0 ? b.progressCurrent / b.progressTarget : 0;
      if (aRatio !== bRatio) return bRatio - aRatio;
      return a.sortOrder - b.sortOrder;
    })
    .slice(0, 6);
  return (
    <section>
      <p className="text-[12px] font-medium uppercase tracking-widest text-ink-mute mb-3">
        Milestones
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {sorted.map((a) => (
          <AchievementChip key={a.id} a={a} />
        ))}
      </div>
    </section>
  );
}

function AchievementChip({ a }: { a: Achievement }) {
  const ratio =
    a.progressTarget > 0
      ? Math.min(1, a.progressCurrent / a.progressTarget)
      : 0;
  return (
    <div
      className={
        "shrink-0 w-40 rounded-2xl border p-4 flex flex-col gap-2 " +
        (a.unlocked
          ? "bg-yellow-soft border-orange/40"
          : "bg-paper border-rule")
      }
      style={
        a.unlocked
          ? {
              backgroundImage: `linear-gradient(135deg, ${a.gradientStart} 0%, ${a.gradientEnd} 100%)`,
            }
          : undefined
      }
    >
      <div
        className={
          "font-nunito-bold text-[14px] leading-tight " +
          (a.unlocked ? "text-paper" : "text-ink")
        }
      >
        {a.title}
      </div>
      <div
        className={
          "text-[11.5px] " +
          (a.unlocked ? "text-paper/85" : "text-ink-mute")
        }
      >
        {a.progressLabel}
      </div>
      {!a.unlocked && a.progressTarget > 0 ? (
        <div className="h-1 rounded-full bg-rule overflow-hidden mt-auto">
          <div
            className="h-full bg-orange"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      ) : null}
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
