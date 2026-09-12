"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { generateExamBreakdown } from "@/lib/api/exams";
import { ApiError } from "@/lib/api/client";
import type { ExamAiBreakdown } from "@/lib/api/types";

/**
 * Post-exam AI Breakdown card. Mirrors mobile's `PostExamBreakdown`
 * so the two clients converge on the same four states:
 *
 *   1. Free tier             → navy upgrade CTA (no network).
 *   2. Pro, no breakdown yet → coral "Generate" CTA.
 *   3. Pro, generating       → coral loader.
 *   4. Pro, has breakdown    → narrative + recommendation deep-links.
 *
 * The server has already answered "does a breakdown exist" via the
 * `aiBreakdown` field in the result payload — no speculative POST is
 * fired on render. Generation is idempotent server-side, so a
 * duplicate tap doesn't double-charge the entitlement.
 */
export function PostExamBreakdown({
  examId,
  initialBreakdown,
  pro,
}: {
  examId: string;
  initialBreakdown: ExamAiBreakdown | null;
  pro: boolean;
}) {
  const [breakdown, setBreakdown] = useState<ExamAiBreakdown | null>(
    initialBreakdown,
  );

  const generate = useMutation({
    mutationFn: () => generateExamBreakdown(examId),
    onSuccess: (res) => {
      setBreakdown({
        narrative: res.breakdown,
        recommendations: res.recommendations,
        generatedAt: res.generatedAt,
        model: res.model,
      });
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong.";
      toast.error("Couldn't generate breakdown", { description: msg });
    },
  });

  // 1) Free tier: locked. Never fires the mutation.
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
          <div className="font-nunito-bold text-[14px]">
            AI post-exam breakdown
          </div>
          <div className="mt-0.5 text-[12.5px] text-bg/70">
            Get a personalised recap of what you got wrong and exactly
            what to review next — unlock with Pro.
          </div>
        </div>
        <div className="shrink-0 text-[12.5px] font-nunito-bold text-orange">
          Unlock →
        </div>
      </Link>
    );
  }

  // 4) Has a breakdown — narrative + recommendations rail.
  if (breakdown) {
    const generatedLabel = new Date(breakdown.generatedAt).toLocaleDateString(
      undefined,
      { month: "short", day: "numeric" },
    );
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-yellow-soft p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-orange" />
          <div className="text-[13px] font-nunito-bold text-ink">
            AI post-exam breakdown
          </div>
          <div className="flex-1" />
          <div className="text-[12px] text-orange-deep">{generatedLabel}</div>
        </div>
        <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink">
          {breakdown.narrative}
        </p>
        <RecommendationRail recommendations={breakdown.recommendations} />
      </div>
    );
  }

  // 2 + 3) Pro, no breakdown — CTA (idle) or loader (pending).
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-yellow-soft p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-orange" />
        <div className="text-[13px] font-nunito-bold text-ink">
          AI post-exam breakdown
        </div>
      </div>
      <p className="text-[14px] leading-[22px] text-ink">
        Get a personalised recap of what you got wrong on this paper and
        exactly what to work on next.
      </p>
      <button
        type="button"
        onClick={() => {
          if (!generate.isPending) generate.mutate();
        }}
        disabled={generate.isPending}
        className={
          "self-start rounded-full border px-4 py-2 text-[13px] font-nunito-semibold transition-colors motion-reduce:transition-none " +
          (generate.isPending
            ? "cursor-not-allowed border-rule bg-rule/40 text-ink-mute"
            : "border-orange/40 bg-paper text-orange-deep hover:bg-paper/80")
        }
      >
        <span className="inline-flex items-center gap-1.5">
          {generate.isPending ? (
            <Loader2 className="animate-spin" size={14} />
          ) : null}
          {generate.isPending ? "Generating…" : "Generate breakdown"}
        </span>
      </button>
    </div>
  );
}

/**
 * Renders each recommendation as a tappable pill. Shape from the
 * backend prompt is loose (v1) — we pick `label`, `href`, and
 * optional `kind` ("read" | "practice") and skip anything we can't
 * route on.
 */
function RecommendationRail({
  recommendations,
}: {
  recommendations: Record<string, unknown>[];
}) {
  if (!recommendations || recommendations.length === 0) return null;
  const items = recommendations
    .map((r) => ({
      label: typeof r.label === "string" ? r.label : null,
      href: typeof r.href === "string" ? r.href : null,
      kind: typeof r.kind === "string" ? r.kind : null,
    }))
    .filter((r): r is { label: string; href: string; kind: string | null } =>
      Boolean(r.label && r.href),
    );
  if (items.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {items.map((r, i) => (
        <Link
          key={i}
          href={r.href}
          className="rounded-full border border-orange/30 bg-paper px-3 py-1.5 text-[12px] font-nunito-semibold text-ink transition-colors motion-reduce:transition-none hover:bg-paper/80"
        >
          {r.kind === "practice" ? "Practice · " : "Read · "}
          {r.label}
        </Link>
      ))}
    </div>
  );
}
