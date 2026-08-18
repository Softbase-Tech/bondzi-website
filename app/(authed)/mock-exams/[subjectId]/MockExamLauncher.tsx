"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { api } from "@/lib/api/client";
import type { ExamSession } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { PaywallDialog } from "@/components/exam/PaywallDialog";
import { handlePaywallError } from "@/lib/paywall";

// Mock exams are a fixed simulation: the backend forces 50 questions and a
// 3-hour timer server-side and ignores any client count, so these are for
// display only and must match the server (createMockExamSession).
const MOCK_EXAM_DURATION_S = 3 * 60 * 60;
const MOCK_EXAM_COUNT = 50;

interface Props {
  subjectId: string;
  subjectName: string;
  pro: boolean;
}

/**
 * Big red button. Pro-gated: free-tier taps pop the paywall instead of
 * starting the exam. Uses the client `api()` helper directly (rather
 * than a server action) so we can react to a start failure without a
 * full-page navigation — students on flaky mobile data need the button
 * to fall back to an inline error, not a Next.js error boundary.
 */
export function MockExamLauncher({ subjectId, subjectName, pro }: Props) {
  const router = useRouter();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const start = () => {
    if (!pro) {
      setPaywallOpen(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const exam = await api<ExamSession>("/exams", {
          method: "POST",
          body: {
            mode: "mock_exam",
            subjectFilter: { subjectIds: [subjectId] },
            questionCount: MOCK_EXAM_COUNT,
            durationSeconds: MOCK_EXAM_DURATION_S,
            difficulty: "mixed",
          },
        });
        router.push(`/exam/${exam.id}`);
      } catch (err) {
        if (handlePaywallError(err, (href) => router.push(href), "/mock-exams")) {
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : `Couldn't start ${subjectName} mock exam. Try again.`,
        );
      }
    });
  };

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-[13px] font-medium text-red-600">{error}</p>
      ) : null}
      <Button
        block
        size="lg"
        loading={pending}
        onClick={start}
        leftIcon={<Play size={16} />}
      >
        {pro ? "Start mock exam" : "Unlock mock exams"}
      </Button>
      {!pro ? (
        <p className="text-[12px] text-ink-mute text-center">
          Bondzi Pro unlocks all timed papers.
        </p>
      ) : null}
      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        feature="mock-exam"
        dismissTo="/dashboard"
      />
    </div>
  );
}
