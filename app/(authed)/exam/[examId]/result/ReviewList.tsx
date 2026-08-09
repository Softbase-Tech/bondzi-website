"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QuestionRenderer } from "@/components/exam/QuestionRenderer";
import { ExplanationSheet } from "@/components/exam/ExplanationSheet";
import { renderMarkdown } from "@/lib/markdown";
import type { ExamResult, Question } from "@/lib/api/types";

interface Props {
  result: ExamResult;
  questions: Question[];
}

/**
 * Wrong-answer review.
 *
 * Two render paths — the rich one (full QuestionRenderer with all
 * options colour-coded) requires the question to be resolvable from
 * the session payload; the compact one is a self-contained card
 * that only uses `result.wrongAnswers` fields (questionText,
 * yourAnswer, correctAnswer). We fall back to the compact card on a
 * per-row basis when the session lookup misses — that way a stale /
 * partial session doesn't hide the whole review section behind a
 * misleading "nothing to review" empty state.
 */
export function ReviewList({ result, questions }: Props) {
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);

  const byId = useMemo(() => {
    const m = new Map<string, Question>();
    for (const q of questions) m.set(q.id, q);
    return m;
  }, [questions]);

  const rows = result.wrongAnswers;

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
        {rows.map((row, index) => {
          const question = byId.get(row.questionId);
          return (
            <li key={row.questionId}>
              <Card className="p-5 sm:p-6">
                {question ? (
                  <QuestionRenderer
                    question={question}
                    readOnly
                    kicker={`Wrong answer ${index + 1}`}
                    selectedOptionId={
                      row.yourAnswer
                        ? (question.options.find(
                            (o) => o.text === row.yourAnswer,
                          )?.id ?? null)
                        : null
                    }
                    correctOptionId={
                      question.options.find((o) => o.text === row.correctAnswer)
                        ?.id ?? null
                    }
                  />
                ) : (
                  <CompactWrongRow row={row} index={index} />
                )}
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

/**
 * Self-contained wrong-answer row. Renders when the runtime question
 * payload isn't available (session fetch failed, backend didn't join
 * options, etc.) — uses only the fields the backend result contract
 * guarantees.
 */
function CompactWrongRow({
  row,
  index,
}: {
  row: ExamResult["wrongAnswers"][number];
  index: number;
}) {
  return (
    <div>
      <div className="text-[12px] font-semibold uppercase tracking-widest text-ink-mute mb-2">
        Wrong answer {index + 1}
      </div>
      <div
        className="prose-bondzi max-w-none text-[15.5px] leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: renderMarkdown(row.questionText),
        }}
      />
      <div className="mt-3 grid gap-2 text-[13px]">
        <div className="inline-flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <span className="text-red-700 font-semibold shrink-0">Your answer:</span>
          {row.yourAnswer ? (
            <div
              className="prose-bondzi max-w-none text-red-700"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(row.yourAnswer),
              }}
            />
          ) : (
            <span className="text-red-700 italic">Skipped</span>
          )}
        </div>
        <div className="inline-flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <span className="text-emerald-800 font-semibold shrink-0">
            Correct answer:
          </span>
          <div
            className="prose-bondzi max-w-none text-emerald-800"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(row.correctAnswer),
            }}
          />
        </div>
      </div>
    </div>
  );
}
