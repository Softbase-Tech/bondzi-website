"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QuestionRenderer } from "@/components/exam/QuestionRenderer";
import { ExplanationSheet } from "@/components/exam/ExplanationSheet";
import type { ExamResult, Question } from "@/lib/api/types";

interface Props {
  result: ExamResult;
  questions: Question[];
}

/**
 * Client-side wrong-answer review. Renders the actual question via
 * QuestionRenderer with `readOnly` + `correctOptionId` so wrong picks
 * paint red and the correct option paints green.
 *
 * The "Explain" button on each row opens the ExplanationSheet — which
 * lazy-fetches the explanation and surfaces the paywall dialog for
 * free-tier users hitting a 402. Only one sheet is mounted at a
 * time; opening a different question swaps the current question id.
 */
export function ReviewList({ result, questions }: Props) {
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);

  // Index questions by id so we can look them up per wrongAnswer row.
  // The result payload's wrongAnswers is authoritative for "which
  // questions to review", but questions.find would be O(n²) across
  // long papers.
  const byId = useMemo(() => {
    const m = new Map<string, Question>();
    for (const q of questions) m.set(q.id, q);
    return m;
  }, [questions]);

  const rows = result.wrongAnswers
    .map((row) => ({ row, question: byId.get(row.questionId) }))
    .filter((entry): entry is { row: ExamResult["wrongAnswers"][number]; question: Question } =>
      Boolean(entry.question),
    );

  if (rows.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-display text-[20px] text-ink">
          Nothing to review — you nailed it 🎯
        </p>
        <p className="mt-1.5 text-[13.5px] text-ink-soft">
          Every question you attempted was correct.
        </p>
      </Card>
    );
  }

  return (
    <>
      <ul className="space-y-4">
        {rows.map(({ row, question }, index) => {
          const correctOption = question.options.find(
            (o) => o.body === row.correctAnswer,
          );
          const yourOption = row.yourAnswer
            ? question.options.find((o) => o.body === row.yourAnswer)
            : null;
          return (
            <li key={row.questionId}>
              <Card className="p-5 sm:p-6">
                <QuestionRenderer
                  question={question}
                  readOnly
                  kicker={`Wrong answer ${index + 1}`}
                  selectedOptionId={yourOption?.id ?? null}
                  correctOptionId={correctOption?.id ?? null}
                />
                <div className="mt-5">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Sparkles size={14} />}
                    onClick={() => setOpenQuestionId(row.questionId)}
                  >
                    Explain
                  </Button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <ExplanationSheet
        questionId={openQuestionId}
        open={openQuestionId != null}
        onOpenChange={(open) => {
          if (!open) setOpenQuestionId(null);
        }}
      />
    </>
  );
}
