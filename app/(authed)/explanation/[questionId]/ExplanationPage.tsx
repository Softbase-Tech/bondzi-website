"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, User, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { PaywallDialog } from "@/components/exam/PaywallDialog";
import { QuestionRenderer } from "@/components/exam/QuestionRenderer";
import { getExplanation } from "@/lib/api/explanations";
import { getQuestionDetail } from "@/lib/api/questions";
import { ApiError } from "@/lib/api/client";
import type { Explanation, Question } from "@/lib/api/types";
import { trackEvent } from "@/lib/analytics";

interface Props {
  questionId: string;
}

/**
 * Standalone explanation viewer for the /explanation/[questionId]
 * deep-link. Fetches question + explanation in parallel; on 402
 * (Pro-only), routes into the PaywallDialog with a dismiss target
 * back to /dashboard per the "soft paywall + public alternative"
 * pattern chosen at Phase 0.
 */
export function ExplanationPage({ questionId }: Props) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [qRes, eRes] = await Promise.allSettled([
        getQuestionDetail(questionId),
        getExplanation(questionId),
      ]);
      if (cancelled) return;
      if (qRes.status === "fulfilled") setQuestion(qRes.value);
      if (eRes.status === "fulfilled") {
        trackEvent("explanation_opened", { source: "deeplink" });
        setExplanation(eRes.value);
      } else if (
        eRes.reason instanceof ApiError &&
        eRes.reason.status === 402
      ) {
        setPaywallOpen(true);
      } else if (eRes.reason instanceof ApiError) {
        toast.error("Couldn't load explanation", {
          description: eRes.reason.message,
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [questionId]);

  return (
    <div className="max-w-[880px] mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-mute hover:text-ink transition-colors"
        >
          <ChevronLeft size={14} /> Dashboard
        </Link>
      </div>

      <div>
        <p className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
          Explanation
        </p>
        <h1 className="mt-1 font-display text-[28px] sm:text-[36px] leading-[1.1] text-ink">
          {question ? "Here's how it's solved" : "Loading explanation…"}
        </h1>
      </div>

      {question ? (
        <Card className="p-5 sm:p-6">
          <QuestionRenderer question={question} readOnly framed={false} />
        </Card>
      ) : (
        <Card className="p-5 sm:p-6 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </Card>
      )}

      <Card className="p-5 sm:p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : explanation ? (
          <div className="space-y-4">
            <SourceBadge source={explanation.source} />
            {explanation.contentHtml ? (
              <div
                className="prose-bondzi max-w-none text-[15.5px] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: explanation.contentHtml }}
              />
            ) : (
              <div className="prose-bondzi max-w-none text-[15.5px] leading-relaxed whitespace-pre-wrap">
                {explanation.markdown}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[14px] text-ink-soft">
            No explanation available for this question yet.
          </p>
        )}
      </Card>

      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        feature="explanation"
        dismissTo="/dashboard"
      />
    </div>
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
