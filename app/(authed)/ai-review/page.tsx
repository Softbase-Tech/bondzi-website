import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import {
  getAiReviewQuotaServer,
  listAiReviewsServer,
} from "@/lib/api/ai-review";
import type { AiReviewListItem, AiReviewQuota } from "@/lib/api/types";
import { AiReviewView } from "./AiReviewView";

export const metadata: Metadata = {
  title: "AI Study Review",
  description:
    "A personalised breakdown of your strengths, weak spots and a step-by-step study plan.",
};

export default async function AiReviewPage() {
  const session = await auth();
  if (!session?.accessToken || !session.user) redirect("/login");

  const [quotaRes, historyRes] = await Promise.allSettled([
    getAiReviewQuotaServer(session.accessToken),
    listAiReviewsServer(session.accessToken, { page: 1, limit: 50 }),
  ]);

  const initialQuota: AiReviewQuota | null =
    quotaRes.status === "fulfilled" ? quotaRes.value : null;
  const initialHistory: AiReviewListItem[] =
    historyRes.status === "fulfilled" ? historyRes.value.items : [];

  return (
    <div className="max-w-[760px] mx-auto space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
          Coaching · For you
        </p>
        <h1 className="mt-2 font-display text-[32px] sm:text-[40px] leading-tight text-ink">
          AI Study Review
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          A personalised breakdown of where you&apos;re strong, where you&apos;re
          losing marks, and exactly what to study next — built from your own
          answers.
        </p>
      </header>
      <AiReviewView
        initialQuota={initialQuota}
        initialHistory={initialHistory}
      />
    </div>
  );
}
