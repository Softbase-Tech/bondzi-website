"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Target, ChevronRight, Lock } from "lucide-react";
import { getWeakness, getWeaknessNarrative } from "@/lib/api/weakness";
import { ApiError } from "@/lib/api/client";
import type { WeaknessBySource } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

const STALE_MS = 60_000;

interface UnifiedTopic {
  key: string;
  title: string;
  subjectId: string;
  subjectName: string;
  accuracy: number; // 0..1
  answered: number;
  href: string; // where to go to drill it
}

function pct(a: number): number {
  return Math.round(a * 100);
}

function accuracyTone(a: number): string {
  if (a < 0.4) return "bg-orange";
  if (a < 0.7) return "bg-yellow";
  return "bg-rule-strong";
}

export function WeaknessView({ initial }: { initial: WeaknessBySource }) {
  const [insightRequested, setInsightRequested] = useState(false);

  const weakness = useQuery({
    queryKey: ["weakness", "all"] as const,
    queryFn: () => getWeakness(),
    initialData: initial,
    staleTime: STALE_MS,
  });

  const narrative = useQuery({
    queryKey: ["weakness", "narrative", "all"] as const,
    queryFn: () => getWeaknessNarrative(),
    enabled: insightRequested,
    staleTime: 4 * 60 * 60_000, // narratives are canonical for the day
    retry: false,
  });

  const topics: UnifiedTopic[] = useMemo(() => {
    const data = weakness.data ?? initial;
    const pp: UnifiedTopic[] = data.pastPaperWeakTopics.map((t) => ({
      key: `pp-${t.topicId}`,
      title: t.title,
      subjectId: t.subjectId,
      subjectName: t.subjectName,
      accuracy: t.accuracy,
      answered: t.answered,
      href: `/past-papers/${t.subjectId}`,
    }));
    const syl: UnifiedTopic[] = data.syllabusWeakTopics.map((t) => ({
      key: `syl-${t.syllabusTopicId}`,
      title: t.title,
      subjectId: t.subjectId,
      subjectName: t.subjectName,
      accuracy: t.accuracy,
      answered: t.answered,
      href: `/level-tests/${t.subjectId}`,
    }));
    return [...pp, ...syl].sort((a, b) => a.accuracy - b.accuracy);
  }, [weakness.data, initial]);

  const narrativeError = narrative.error;
  const narrativeLocked =
    narrativeError instanceof ApiError && narrativeError.status === 403;
  const narrativeSpent =
    narrativeError instanceof ApiError && narrativeError.status === 429;

  return (
    <div className="space-y-6">
      {/* AI insight card — manual trigger so a Plus user doesn't spend their
          daily allowance just by landing here. */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-orange" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
            AI insight
          </span>
        </div>
        {narrative.isFetching ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : narrativeLocked ? (
          <div className="mt-2">
            <p className="text-[14px] text-ink-soft">
              A personalised read on why you&apos;re losing marks and what to do
              about it — available on Plus and Pro.
            </p>
            <Button
              href="/subscription/plans"
              size="sm"
              className="mt-3"
              leftIcon={<Lock size={14} />}
            >
              See plans
            </Button>
          </div>
        ) : narrativeSpent ? (
          <p className="mt-2 text-[14px] text-ink-soft">
            You&apos;ve used today&apos;s AI insight. Try again tomorrow, or
            upgrade to Pro for unlimited insights.
          </p>
        ) : narrative.data?.narrative ? (
          <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-ink">
            {narrative.data.narrative}
          </p>
        ) : narrative.isError ? (
          <button
            type="button"
            onClick={() => narrative.refetch()}
            className="mt-2 text-[14px] text-orange hover:underline"
          >
            Couldn&apos;t load insight — tap to retry.
          </button>
        ) : (
          <div className="mt-2">
            <p className="text-[14px] text-ink-soft">
              Get today&apos;s AI read on your recent answers.
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => setInsightRequested(true)}
            >
              Get insight
            </Button>
          </div>
        )}
      </Card>

      {/* Weak topics list */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
          Where to focus next
        </h2>
        {weakness.isLoading && topics.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-8 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-yellow-soft text-orange">
              <Target size={20} />
            </span>
            <p className="font-display text-[17px] text-ink">
              No weak spots yet
            </p>
            <p className="max-w-sm text-[13.5px] text-ink-soft">
              Answer at least 3 questions in a topic and we&apos;ll start
              surfacing where you&apos;re losing marks here.
            </p>
            <Button href="/past-papers" size="sm" className="mt-1">
              Start practising
            </Button>
          </Card>
        ) : (
          <ul className="space-y-2">
            {topics.map((t, i) => (
              <li key={t.key}>
                <Link
                  href={t.href}
                  className="flex items-center gap-4 rounded-2xl border border-rule bg-paper p-4 transition-colors hover:border-rule-strong motion-reduce:transition-none"
                >
                  <span className="w-6 shrink-0 text-center font-mono text-[13px] text-ink-mute">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-medium text-ink">
                        {t.title}
                      </p>
                      <span className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-mute">
                        {t.subjectName}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-rule">
                        <div
                          className={`h-full rounded-full ${accuracyTone(t.accuracy)}`}
                          style={{ width: `${Math.max(6, pct(t.accuracy))}%` }}
                        />
                      </div>
                      <span className="text-[12px] text-ink-mute">
                        {pct(t.accuracy)}% · {t.answered} answered
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-ink-mute" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
