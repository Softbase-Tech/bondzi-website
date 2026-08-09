"use client";

import { useEffect, useState } from "react";
import { Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { getExplanation } from "@/lib/api/explanations";
import { ApiError } from "@/lib/api/client";
import type { Explanation } from "@/lib/api/types";
import { PaywallDialog } from "./PaywallDialog";

interface Props {
  questionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Bottom-sheet (mobile) / dialog (desktop) that fetches and renders an
 * AI or human explanation for a single question. Two failure modes
 * matter:
 *
 *   - 402 Payment Required — free-tier user, AI explanation gated. We
 *     swap the sheet for the paywall dialog. The sheet still closes
 *     cleanly on backdrop dismiss.
 *   - Everything else (network, 5xx, 4xx-not-402) — toast + close the
 *     sheet so the user can retry.
 *
 * Explanations are lazy-loaded — the sheet doesn't fire the fetch
 * until it's opened, so a session with 20 questions doesn't preload
 * 20 explanations the user may never look at.
 */
export function ExplanationSheet({ questionId, open, onOpenChange }: Props) {
  const [data, setData] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    if (!open || !questionId) return;
    let cancelled = false;
    setLoading(true);
    setData(null);
    (async () => {
      try {
        const explanation = await getExplanation(questionId);
        if (!cancelled) setData(explanation);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 402) {
          onOpenChange(false);
          setPaywallOpen(true);
          return;
        }
        const message =
          err instanceof ApiError
            ? err.message
            : "Please check your connection and try again.";
        toast.error("Couldn't load explanation", { description: message });
        onOpenChange(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, questionId, onOpenChange]);

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title="Explanation"
        description={
          data?.source === "ai"
            ? "AI-generated, based on the WAEC syllabus."
            : data?.source === "human"
              ? "Written by a Bondzi tutor."
              : undefined
        }
      >
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <SourceBadge source={data.source} />
            {data.contentHtml ? (
              <div
                className="prose-bondzi max-w-none text-[15px] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: data.contentHtml }}
              />
            ) : (
              <div className="prose-bondzi max-w-none text-[15px] leading-relaxed whitespace-pre-wrap">
                {data.markdown}
              </div>
            )}
          </div>
        ) : null}
      </Sheet>
      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        feature="explanation"
      />
    </>
  );
}

function SourceBadge({ source }: { source: "ai" | "human" }) {
  const isAi = source === "ai";
  return (
    <div className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-yellow-soft text-ink-soft text-[11.5px] font-semibold uppercase tracking-wider">
      {isAi ? <Sparkles size={12} /> : <User size={12} />}
      {isAi ? "AI explanation" : "Tutor written"}
    </div>
  );
}
