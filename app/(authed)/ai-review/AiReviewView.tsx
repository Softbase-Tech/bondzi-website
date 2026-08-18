"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, ChevronRight, Lock, RefreshCw } from "lucide-react";
import {
  generateAiReview,
  getAiReviewQuota,
  listAiReviews,
} from "@/lib/api/ai-review";
import { ApiError } from "@/lib/api/client";
import type {
  AiReviewListItem,
  AiReviewQuota,
  GenerateAiReviewResult,
} from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const STALE_MS = 60_000;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AiReviewView({
  initialQuota,
  initialHistory,
}: {
  initialQuota: AiReviewQuota | null;
  initialHistory: AiReviewListItem[];
}) {
  const router = useRouter();
  const qc = useQueryClient();

  const quota = useQuery({
    queryKey: ["ai-review", "quota"] as const,
    queryFn: getAiReviewQuota,
    initialData: initialQuota ?? undefined,
    staleTime: STALE_MS,
  });

  const history = useQuery({
    queryKey: ["ai-review", "history", 1] as const,
    queryFn: () => listAiReviews({ page: 1, limit: 50 }),
    initialData: { items: initialHistory, total: initialHistory.length },
    staleTime: STALE_MS,
  });

  const generate = useMutation({
    mutationFn: () => generateAiReview(),
    onSuccess: (res: GenerateAiReviewResult) => {
      // Prime the detail cache so the destination renders instantly, refresh
      // the quota + history, then navigate into the fresh report.
      qc.setQueryData(["ai-review", "detail", res.review.id], res.review);
      qc.setQueryData(["ai-review", "quota"], res.quota);
      void qc.invalidateQueries({ queryKey: ["ai-review", "history"] });
      router.push(`/ai-review/${res.review.id}`);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Please try again.";
      toast.error("Couldn't generate review", { description: msg });
    },
  });

  const q = quota.data;
  const isFree = q?.tier === "free";
  const rows = history.data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Generate / quota card */}
      {quota.isLoading && !q ? (
        <Card className="p-5 sm:p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </Card>
      ) : isFree ? (
        <Card emphasis className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange">
              <Lock size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[19px] text-ink">
                Unlock AI Study Review
              </h2>
              <p className="mt-1 text-[14px] text-ink-soft">
                Get a personalised breakdown of your strengths, weak spots and a
                step-by-step study plan. Available on Plus and Pro.
              </p>
              <Button href="/subscription/plans" className="mt-4" size="sm">
                See plans
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-orange" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
                Your study review
              </span>
            </div>
            {q ? (
              <span className="text-[12px] font-medium text-ink-mute">
                {q.canGenerate
                  ? `${q.remaining} of ${q.limit} left this month`
                  : `0 of ${q.limit} left — resets on the 1st`}
              </span>
            ) : null}
          </div>

          {q?.latest ? (
            <Link
              href={`/ai-review/${q.latest.id}`}
              className="mt-4 block rounded-xl border border-rule bg-bg/40 p-4 transition-colors hover:border-rule-strong motion-reduce:transition-none"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
                  Latest {q.latest.mode === "bootstrap" ? "· warm-up" : ""}
                </span>
                <span className="text-[12px] text-ink-mute">
                  {fmtDate(q.latest.generatedAt)}
                </span>
              </div>
              <p className="mt-1 line-clamp-3 text-[14px] text-ink-soft">
                {q.latest.summary}
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-orange">
                Read full report <ChevronRight size={14} />
              </span>
            </Link>
          ) : (
            <p className="mt-3 text-[14px] text-ink-soft">
              You haven&apos;t generated a review yet. Create your first one to
              see where to focus.
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <Button
              size="sm"
              loading={generate.isPending}
              disabled={!q?.canGenerate || generate.isPending}
              leftIcon={<RefreshCw size={15} />}
              onClick={() => generate.mutate()}
            >
              {q?.latest ? "Generate a new review" : "Generate first review"}
            </Button>
            {!q?.canGenerate && q ? (
              <span className="text-[12px] text-ink-mute">
                Monthly allowance used
              </span>
            ) : null}
          </div>
        </Card>
      )}

      {/* History */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
          Review history
        </h2>
        {history.isLoading && rows.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-8 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-yellow-soft text-orange">
              <Sparkles size={20} />
            </span>
            <p className="font-display text-[17px] text-ink">No reviews yet</p>
            <p className="max-w-sm text-[13.5px] text-ink-soft">
              Generate a review to get a personalised study breakdown. Every
              review you create is saved here.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/ai-review/${r.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-rule bg-paper p-4 transition-colors hover:border-rule-strong motion-reduce:transition-none"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
                        {fmtDate(r.generatedAt)}
                      </span>
                      {r.mode === "bootstrap" ? (
                        <span className="rounded-full bg-yellow-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
                          Getting started
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[14px] text-ink-soft">
                      {r.summary}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className={cn("shrink-0 text-ink-mute")}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
