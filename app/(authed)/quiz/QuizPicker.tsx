"use client";

import { useState, useTransition } from "react";
import { Sparkles, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PaywallDialog } from "@/components/exam/PaywallDialog";
import { cn } from "@/lib/utils";
import type { ExamType, PmTestSubjectSummary } from "@/lib/api/types";

type Difficulty = "easy" | "medium" | "hard" | "mixed";
const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
  { key: "mixed", label: "Mixed" },
];
const COUNTS = [10, 20, 30] as const;

interface Props {
  subjects: PmTestSubjectSummary[];
  pro: boolean;
  examType: ExamType;
  onStart: (input: {
    subjectId: string;
    questionCount: number;
    difficulty: Difficulty;
  }) => Promise<void>;
}

/**
 * Client-side Quiz picker + starter. Two UX modes fold together:
 *
 *   - PRO: pick a subject → count + difficulty → Start.
 *   - FREE: same visual, but the Start button pops the PaywallDialog
 *     with feature="quiz". Preview stays available so the student sees
 *     exactly what they'd unlock.
 *
 * `startTransition` around the server action gives the button a
 * loading state while the pm_test exam is being generated — this
 * can take a couple of seconds since the backend hydrates a fresh
 * pool from the AI pipeline.
 */
export function QuizPicker({ subjects, pro, examType, onStart }: Props) {
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [count, setCount] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [pending, startTransition] = useTransition();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      {subjects.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-soft text-orange mb-3">
            <Sparkles size={22} />
          </div>
          <p className="font-display text-[20px] text-ink">
            Quiz will unlock as content rolls out
          </p>
          <p className="mt-1.5 text-[13.5px] text-ink-soft max-w-[42ch] mx-auto">
            The Bondzi AI is generating {examType.toUpperCase()} question
            banks. Check back soon — the moment your subjects have active
            questions they appear here.
          </p>
        </Card>
      ) : (
        <>
          {/* Subject grid */}
          <section>
            <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute mb-3">
              Pick a subject
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((s) => {
                const selected = subjectId === s.subjectId;
                return (
                  <button
                    key={s.subjectId}
                    type="button"
                    onClick={() => setSubjectId(s.subjectId)}
                    aria-pressed={selected}
                    className={cn(
                      "text-left p-4 rounded-2xl border-2 transition-colors motion-reduce:transition-none",
                      selected
                        ? "border-orange bg-yellow-soft/60"
                        : "border-rule-strong bg-paper hover:border-ink-soft",
                    )}
                  >
                    <div className="font-display text-[19px] leading-tight text-ink">
                      {s.subjectName}
                    </div>
                    <div className="mt-2 text-[12.5px] text-ink-soft">
                      {s.activeQuestionCount.toLocaleString()} active questions
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11.5px] text-ink-mute">
                      {s.lastAttemptedAt ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} />
                          {formatRelativeTime(new Date(s.lastAttemptedAt))}
                        </span>
                      ) : (
                        <span>Not attempted yet</span>
                      )}
                      {typeof s.accuracy === "number" ? (
                        <span className="font-semibold text-ink">
                          {Math.round(s.accuracy * 100)}% accuracy
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Config + Start */}
          {subjectId ? (
            <Card className="p-5 sm:p-6 space-y-5">
              <div>
                <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute mb-2">
                  Difficulty
                </div>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map((d) => (
                    <Chip
                      key={d.key}
                      selected={difficulty === d.key}
                      onClick={() => setDifficulty(d.key)}
                    >
                      {d.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute mb-2">
                  Questions
                </div>
                <div className="flex flex-wrap gap-2">
                  {COUNTS.map((n) => (
                    <Chip
                      key={n}
                      selected={count === n}
                      onClick={() => setCount(n)}
                    >
                      {n}
                    </Chip>
                  ))}
                </div>
              </div>
              {error ? (
                <p className="text-[13px] font-medium text-red-600">{error}</p>
              ) : null}
              <Button
                block
                size="lg"
                loading={pending}
                onClick={() => {
                  if (!pro) {
                    setPaywallOpen(true);
                    return;
                  }
                  setError(null);
                  startTransition(async () => {
                    try {
                      await onStart({
                        subjectId,
                        questionCount: count,
                        difficulty,
                      });
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Couldn't start the quiz. Try again.",
                      );
                    }
                  });
                }}
                leftIcon={<Sparkles size={16} />}
              >
                {pro ? "Start quiz" : "Unlock quiz"}
              </Button>
              {!pro ? (
                <p className="text-[12px] text-ink-mute text-center">
                  Free preview shows Quiz — Pro unlocks the sessions.
                </p>
              ) : null}
            </Card>
          ) : null}
        </>
      )}

      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        feature="quiz"
        dismissTo="/dashboard"
      />
    </>
  );
}

/**
 * Cheap relative-time formatter — enough for "picked up an hour ago"
 * style subtitles. Avoids pulling in date-fns for one call site.
 */
function formatRelativeTime(date: Date): string {
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? "" : "s"} ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} mo ago`;
  return `${Math.floor(month / 12)} yr ago`;
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center min-h-9 px-3.5 rounded-full text-[13.5px] font-medium border transition-colors motion-reduce:transition-none",
        selected
          ? "border-orange bg-orange text-paper"
          : "border-rule-strong bg-paper text-ink hover:border-ink-soft",
      )}
    >
      {children}
    </button>
  );
}
