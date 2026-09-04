import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Trophy, ArrowUpRight, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { ApiError } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { getExamResult, getExamSession } from "@/lib/api/exams";
import { PushPromptCard } from "@/components/push/PushPromptCard";
import { ReviewList } from "./ReviewList";

interface Props {
  params: Promise<{ examId: string }>;
}

export const metadata: Metadata = {
  title: "Result",
  robots: { index: false, follow: false },
};

/**
 * Result screen for a completed session. Fetches both the result
 * summary and the full session (needed to render the wrong-answer
 * review with actual question bodies + options — the result payload
 * only ships text snippets).
 *
 * The ReviewList client component owns the AI-explanation sheet so
 * clicking "Explain" on any wrong answer opens the paywall-gated
 * sheet without shipping every question's explanation up front.
 */
export default async function ExamResultPage({ params }: Props) {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");
  const { examId } = await params;

  const [resultRes, sessionRes] = await Promise.allSettled([
    getExamResult(session.accessToken, examId),
    getExamSession(session.accessToken, examId),
  ]);

  if (resultRes.status !== "fulfilled") {
    if (
      resultRes.reason instanceof ApiError &&
      resultRes.reason.status === 404
    ) {
      notFound();
    }
    throw resultRes.reason;
  }
  const result = resultRes.value;
  const examSession =
    sessionRes.status === "fulfilled" ? sessionRes.value : null;

  // Backend serialiser (`toExamResultResponse`) ships `score` as a
  // 0..1 ratio. Multiply by 100 for percentage display; use the raw
  // ratio for the ring fill.
  const scoreFraction = Math.max(0, Math.min(1, result.score));
  const scorePercent = Math.round(scoreFraction * 100);

  return (
    <div className="max-w-[960px] mx-auto space-y-8">
      {/* Hero */}
      <section className="flex flex-col-reverse sm:flex-row sm:items-center gap-6 sm:gap-8">
        <div className="flex-1">
          <p className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
            Exam complete
          </p>
          <h1 className="mt-1 font-display text-[36px] sm:text-[48px] leading-[1.05] text-ink">
            You scored {scorePercent}%
          </h1>
          <p className="mt-2 text-[15px] text-ink-soft">
            Grade{" "}
            <span className="font-semibold text-ink">{result.grade}</span>
            {result.streakMaintained ? (
              <>
                {" "}
                · streak kept alive{" "}
                <span aria-hidden="true">🔥</span>
              </>
            ) : null}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button href="/dashboard" variant="outline">
              Back to dashboard
            </Button>
            <Button href="/past-papers" rightIcon={<ArrowUpRight size={16} />}>
              Try another paper
            </Button>
          </div>
        </div>
        <div className="shrink-0">
          <ProgressRing
            value={scoreFraction}
            size={148}
            label="Overall score"
          >
            <div className="text-center">
              <div className="font-display text-[42px] leading-none text-ink">
                {scorePercent}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute mt-1">
                out of 100
              </div>
            </div>
          </ProgressRing>
        </div>
      </section>

      {/* Stat row */}
      <section className="grid gap-3 sm:grid-cols-4">
        <StatTile
          icon={<CheckCircle2 size={16} />}
          label="Correct"
          value={result.correctCount}
          tone="ok"
        />
        <StatTile
          icon={<XCircle size={16} />}
          label="Wrong"
          value={result.wrongCount}
          tone="bad"
        />
        <StatTile
          icon={<MinusCircle size={16} />}
          label="Skipped"
          value={result.skippedCount}
          tone="mute"
        />
        <StatTile
          icon={<Trophy size={16} />}
          label="XP earned"
          value={result.xpEarned}
          tone="warm"
        />
      </section>

      {/*
        Push opt-in prompt — the just-finished session is the
        "meaningful moment" (never on cold load), and both quiz and
        past-paper runs land here via ExamRunner. The card feature-
        detects, respects a 14-day dismissal snooze, and renders
        nothing once enabled/denied/unsupported.
      */}
      <PushPromptCard />

      {/* By-topic breakdown */}
      {result.byTopic.length > 0 ? (
        <section>
          <h2 className="font-display text-[22px] text-ink mb-3">
            How you did by topic
          </h2>
          <Card className="p-0 overflow-hidden">
            <ul className="divide-y divide-rule">
              {result.byTopic
                .slice()
                .sort((a, b) => a.accuracy - b.accuracy)
                .map((row) => {
                  const pct = Math.round(row.accuracy * 100);
                  return (
                    <li
                      key={row.topicId}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[14.5px] font-medium text-ink truncate">
                          {row.topicName}
                        </div>
                        <div className="text-[12px] text-ink-mute">
                          {row.correctCount} of {row.totalCount} correct
                        </div>
                      </div>
                      <div className="w-24 h-2 rounded-full bg-rule overflow-hidden">
                        <div
                          className={`h-full ${
                            pct >= 70
                              ? "bg-emerald-500"
                              : pct >= 40
                                ? "bg-yellow"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-10 text-right text-[13px] font-semibold text-ink">
                        {pct}%
                      </div>
                    </li>
                  );
                })}
            </ul>
          </Card>
        </section>
      ) : null}

      {/*
        Wrong-answer review — ReviewList handles both the rich path
        (using the session's full questions[]) and the compact
        fallback (per-row rendering when session is missing or a
        specific question wasn't returned).
      */}
      <section>
        <h2 className="font-display text-[22px] text-ink mb-3">
          Review your wrong answers
        </h2>
        <ReviewList
          result={result}
          questions={examSession?.questions ?? []}
        />
      </section>

      <section className="pt-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-[13.5px] font-medium text-ink-soft hover:text-ink transition-colors"
        >
          ← Back to dashboard
        </Link>
      </section>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "ok" | "bad" | "mute" | "warm";
}) {
  const toneClass =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "bad"
        ? "bg-red-50 text-red-700"
        : tone === "warm"
          ? "bg-yellow-soft text-orange-deep"
          : "bg-rule text-ink-mute";
  return (
    <Card className="p-4">
      <div
        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${toneClass}`}
      >
        {icon}
      </div>
      <div className="mt-2.5 font-display text-[24px] leading-none text-ink">
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-[12.5px] font-medium uppercase tracking-widest text-ink-mute">
        {label}
      </div>
    </Card>
  );
}
