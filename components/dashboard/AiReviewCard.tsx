"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { generateAiReview, getAiReviewQuota } from "@/lib/api/ai-review";
import { ApiError } from "@/lib/api/client";
import type { AiReviewQuota, GenerateAiReviewResult } from "@/lib/api/types";

/**
 * Dashboard "AI Study Review" card — parity port of
 * `mobile/components/home/AiReviewCard.tsx`. Four states:
 *
 *   1. Free tier         → navy upgrade CTA (no network).
 *   2. Loading quota     → slim spinner.
 *   3. Has latest review → summary + date; Read + Regenerate + N left.
 *   4. No reviews yet    → short pitch + "Generate first review".
 *
 * Pro-tier flag comes from the server-rendered dashboard so Free
 * accounts never trigger a quota round-trip. Everything else — quota
 * fetch, generation mutation — is client-side to keep the CTA snappy
 * and the counter live after regeneration.
 */
export function AiReviewCard({ pro }: { pro: boolean }) {
  const router = useRouter();
  const qc = useQueryClient();

  const quota = useQuery({
    queryKey: ["ai-review", "quota"] as const,
    queryFn: getAiReviewQuota,
    enabled: pro,
    staleTime: 60_000,
  });

  const generate = useMutation({
    mutationFn: () => generateAiReview(),
    onSuccess: (res: GenerateAiReviewResult) => {
      qc.setQueryData(["ai-review", "quota"] as const, res.quota);
      router.push(`/ai-review/${res.review.id}`);
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong.";
      toast.error("Couldn't generate review", { description: msg });
    },
  });

  // 1) Free tier: locked card. No network fires because the query is
  //    disabled when `pro` is false.
  if (!pro) {
    return (
      <Link
        href="/subscription/plans"
        className="flex items-center gap-3 rounded-2xl bg-ink p-4 text-bg transition-colors motion-reduce:transition-none hover:bg-ink/90"
      >
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange/20 text-orange">
          <Sparkles size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-nunito-bold text-[14px]">AI Study Review</div>
          <div className="mt-0.5 text-[12.5px] text-bg/70">
            Get a personalised breakdown of your strengths, weak spots and a
            step-by-step study plan.
          </div>
        </div>
        <div className="shrink-0 text-[12.5px] font-nunito-bold text-orange">
          Unlock →
        </div>
      </Link>
    );
  }

  // 2) Loading quota
  if (quota.isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-yellow-soft p-4">
        <Loader2 className="animate-spin text-orange" size={18} />
        <div className="text-[13px] font-medium text-ink">
          Loading your study review…
        </div>
      </div>
    );
  }

  // Non-quota error — hide silently on the dashboard (matches mobile).
  if (quota.isError || !quota.data) return null;

  const { latest, remaining, limit, canGenerate } = quota.data as AiReviewQuota;
  const generatedLabel = latest
    ? new Date(latest.generatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  // Backend serves a canned "bootstrap" review the first time the user
  // asks — free, doesn't count against the monthly counter. Explicit
  // label + amended remaining copy so the counter never looks broken.
  const isBootstrap = latest?.mode === "bootstrap";
  const remainingLabel = canGenerate
    ? isBootstrap
      ? `${remaining} personalised left`
      : `${remaining} left`
    : `0 of ${limit} left`;

  const onGenerate = () => {
    if (generate.isPending) return;
    generate.mutate();
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-yellow-soft p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-orange" />
        <div className="text-[13px] font-nunito-bold text-ink">
          AI study review
        </div>
        {isBootstrap ? (
          <span className="rounded-full border border-orange/40 bg-paper px-2 py-0.5 text-[10px] font-nunito-bold tracking-wider text-orange-deep">
            WARM-UP
          </span>
        ) : null}
        <div className="flex-1" />
        {generatedLabel ? (
          <div className="text-[12px] text-orange-deep">{generatedLabel}</div>
        ) : null}
      </div>

      {latest ? (
        <Link
          href={`/ai-review/${latest.id}`}
          className="block cursor-pointer text-[14px] leading-[22px] text-ink"
        >
          <span className="line-clamp-3">{latest.summary}</span>
          {isBootstrap ? (
            <span className="mt-1.5 block text-[11px] leading-[15px] text-orange-deep">
              This was a free warm-up. Your monthly quota only counts
              personalised reviews.
            </span>
          ) : null}
        </Link>
      ) : (
        <p className="text-[14px] leading-[22px] text-ink">
          Get a structured, personalised breakdown of your strengths, where
          you&apos;re losing marks, and a step-by-step study plan.
        </p>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-2">
        {latest ? (
          <Link
            href={`/ai-review/${latest.id}`}
            className="rounded-full bg-paper px-4 py-2 text-[13px] font-nunito-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-paper/80"
          >
            Read full report
          </Link>
        ) : null}
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || generate.isPending}
          className={
            "rounded-full border px-4 py-2 text-[13px] font-nunito-semibold transition-colors motion-reduce:transition-none " +
            (canGenerate && !generate.isPending
              ? "border-orange/40 bg-paper text-orange-deep hover:bg-paper/80"
              : "cursor-not-allowed border-rule bg-rule/40 text-ink-mute")
          }
        >
          <span className="inline-flex items-center gap-1.5">
            {generate.isPending ? (
              <Loader2 className="animate-spin" size={14} />
            ) : null}
            {generate.isPending
              ? "Generating…"
              : latest
                ? "Regenerate"
                : "Generate first review"}
          </span>
        </button>
        <div className="flex-1" />
        <div className="text-[11px] text-orange-deep">{remainingLabel}</div>
      </div>
    </div>
  );
}
