"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Calendar, BookOpenText, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api/client";
import { handlePaywallError } from "@/lib/paywall";
import type { ExamSession, ExamType } from "@/lib/api/types";
import { trackEvent } from "@/lib/analytics";

interface Props {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  /** The subject's exam level — carried into `exam_started`. */
  examType: ExamType;
  year: number;
}

/**
 * Client-side launcher card. Two reasons the Start button lives on the
 * client (not in a server action):
 *
 *   1. We need to catch 403 / 429 from POST /exams and route the user
 *      to /subscription/plans instead of surfacing Next's redacted
 *      "Server Components render error" toast. Server actions swallow
 *      the specific status code.
 *   2. `useTransition` gives us a loading state on the Start button
 *      while the exam row is being created.
 *
 * The "All years" back link uses the SUBJECT UUID (`subjectId`), not
 * the human-readable code — the code (e.g. WASSCE_PHYSICS) is not a
 * valid `/subjects/:id` param on the backend and 400s the year page.
 */
export function PastPaperLauncher({
  subjectId,
  subjectName,
  subjectCode,
  examType,
  year,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onStart = () => {
    setError(null);
    const returnTo = `/past-papers/${subjectId}/${year}`;
    startTransition(async () => {
      try {
        const exam = await api<ExamSession>("/exams", {
          method: "POST",
          body: {
            mode: "past_paper",
            subjectFilter: {
              subjectIds: [subjectId],
              years: [year],
            },
            // House-rule: every exam caps at 40 questions. When the
            // year's pool has fewer, backend returns what's there.
            questionCount: 40,
          },
        });
        trackEvent("exam_started", { mode: "past_paper", level: examType });
        router.push(`/exam/${exam.id}`);
      } catch (err) {
        if (handlePaywallError(err, (href) => router.push(href), returnTo)) {
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Couldn't start the paper. Try again.",
        );
      }
    });
  };

  return (
    <div className="max-w-[720px] mx-auto space-y-8">
      <div>
        <Link
          href={`/past-papers/${encodeURIComponent(subjectId)}`}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-mute hover:text-ink transition-colors"
        >
          <ChevronLeft size={14} /> All years
        </Link>
      </div>

      <Card className="p-6 sm:p-8">
        <div className="flex items-center gap-3 text-[12px] font-medium uppercase tracking-widest text-ink-mute">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} /> {year}
          </span>
          <span className="text-rule">·</span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpenText size={14} /> {subjectCode}
          </span>
        </div>
        <h1 className="mt-2 font-display text-[32px] sm:text-[40px] leading-tight text-ink">
          {subjectName} · {year}
        </h1>
        <p className="mt-3 text-[15px] text-ink-soft">
          Sit this past paper as a full session. Your answers are graded
          instantly, and you&apos;ll get a per-topic breakdown at the
          end.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Perk
            icon={<BookOpenText size={16} />}
            title="Every question"
            body="The paper as WAEC published it, ordered exactly."
          />
          <Perk
            icon={<Clock size={16} />}
            title="Take your time"
            body="No countdown unless you want one — this is practice."
          />
        </div>

        {error ? (
          <p className="mt-4 text-[13px] font-medium text-red-600">
            {error}
          </p>
        ) : null}

        <div className="mt-6">
          <Button block size="lg" loading={pending} onClick={onStart}>
            Start paper
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Perk({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-soft/40 border border-rule">
      <div
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-orange text-paper shrink-0"
        aria-hidden="true"
      >
        {icon}
      </div>
      <div>
        <div className="text-[14px] font-semibold text-ink">{title}</div>
        <div className="text-[12.5px] text-ink-soft mt-0.5">{body}</div>
      </div>
    </div>
  );
}
