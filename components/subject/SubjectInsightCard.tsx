"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import { getWeaknessNarrative } from "@/lib/api/weakness";
import { ApiError } from "@/lib/api/client";

/**
 * Subject-scoped AI insight — parity port of
 * `mobile/components/home/SubjectInsightCard.tsx`. Mounted on
 * /subjects/[id], /past-papers/[subjectId], /level-tests/[subjectId].
 *
 * Manual trigger, not auto-fetch. Two reasons — same as mobile:
 *   1. A Plus user with 1/day quota shouldn't burn their
 *      scope='<subject>' point just by landing on a subject page.
 *   2. If the student's about to tap Start, the narrative is just
 *      extra latency they didn't ask for.
 */
export function SubjectInsightCard({
  subjectId,
  pro,
}: {
  subjectId: string;
  pro: boolean;
}) {
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const narrative = useQuery({
    queryKey: ["weakness", "narrative", subjectId] as const,
    queryFn: () => getWeaknessNarrative(subjectId),
    enabled: fetchEnabled && pro,
    staleTime: 4 * 60 * 60_000, // canonical for the day
    retry: false, // 403/429 shouldn't be retried
  });

  // 1) Free tier: locked prompt. Query never fires.
  if (!pro) {
    return (
      <Link
        href="/subscription/plans"
        className="flex items-center gap-2 rounded-xl border border-ink bg-ink px-3 py-2.5 text-bg transition-colors motion-reduce:transition-none hover:bg-ink/90"
      >
        <Sparkles size={14} className="text-orange" />
        <span className="flex-1 text-[12px] font-nunito-bold">
          Get an AI insight for this subject
        </span>
        <span className="text-[12px] font-nunito-bold text-orange">
          Upgrade →
        </span>
      </Link>
    );
  }

  // 2) Not fetched yet — the "Get insight" affordance.
  if (!fetchEnabled) {
    return (
      <button
        type="button"
        onClick={() => setFetchEnabled(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-orange bg-yellow-soft px-3 py-2.5 text-left transition-colors motion-reduce:transition-none hover:bg-yellow-soft/80"
      >
        <Sparkles size={14} className="text-orange" />
        <span className="flex-1 text-[12px] font-nunito-bold text-ink">
          Get today&apos;s AI insight for this subject
        </span>
        <span className="text-[12px] font-nunito-bold text-orange">Go</span>
      </button>
    );
  }

  // 3) Loading
  if (narrative.isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-orange bg-yellow-soft px-3 py-2.5">
        <Loader2 size={14} className="animate-spin text-orange" />
        <span className="flex-1 text-[12px] font-nunito-semibold text-ink">
          Analysing your recent answers…
        </span>
      </div>
    );
  }

  // 4) Error paths — quota spent (429) vs. anything else.
  if (narrative.isError) {
    const status =
      narrative.error instanceof ApiError ? narrative.error.status : null;
    if (status === 429) {
      return (
        <div className="rounded-xl border border-rule bg-rule/40 px-3 py-2.5">
          <p className="text-[12px] font-nunito-semibold text-ink-mute">
            You&apos;ve used today&apos;s AI insight. Try again tomorrow, or
            upgrade to Pro for unlimited insights.
          </p>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => narrative.refetch()}
        className="w-full rounded-xl border border-rule bg-rule/40 px-3 py-2.5 text-left transition-colors motion-reduce:transition-none hover:bg-rule/60"
      >
        <p className="text-[12px] font-nunito-semibold text-ink-mute">
          Couldn&apos;t load insight — tap to retry.
        </p>
      </button>
    );
  }

  if (!narrative.data?.narrative) return null;

  return (
    <div className="rounded-xl border border-orange bg-yellow-soft p-3">
      <div className="flex items-center gap-2">
        <Sparkles size={12} className="text-orange" />
        <span className="text-[11px] font-nunito-bold uppercase tracking-wider text-ink">
          AI insight
        </span>
      </div>
      <p className="mt-1 text-[13px] leading-[19px] text-ink">
        {narrative.data.narrative}
      </p>
    </div>
  );
}
