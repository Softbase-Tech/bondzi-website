"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ListChecks } from "lucide-react";
import { api } from "@/lib/api/client";
import type { ExamSession, SyllabusTopic } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PaywallDialog } from "@/components/exam/PaywallDialog";
import { cn } from "@/lib/utils";

const COUNTS = [10, 20, 30] as const;

interface Props {
  subjectId: string;
  subjectName: string;
  formLevel: 1 | 2 | 3;
  topics: SyllabusTopic[];
  pro: boolean;
}

/**
 * Client-side Level Test setup. Two decisions to make:
 *   1. Which syllabus topics have we covered in class? (multi-select
 *      chips, defaults to none)
 *   2. How long a test? (10 / 20 / 30 questions)
 *
 * Server API accepts syllabusTopicIds on POST /exams with mode
 * 'pm_test' (the level-test experience is a pm_test scoped to
 * specific syllabus topics). Backend adjusts pacing accordingly.
 */
export function LevelTestPicker({
  subjectId,
  subjectName,
  formLevel,
  topics,
  pro,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [count, setCount] = useState<number>(20);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const activeTopics = useMemo(
    () => topics.filter((t) => t.isActive),
    [topics],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(activeTopics.map((t) => t.id)));
  const clearAll = () => setSelected(new Set());

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
            mode: "pm_test",
            subjectFilter: {
              subjectIds: [subjectId],
              syllabusTopicIds: Array.from(selected),
            },
            questionCount: count,
            difficulty: "mixed",
          },
        });
        router.push(`/exam/${exam.id}`);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : `Couldn't start ${subjectName} level test. Try again.`,
        );
      }
    });
  };

  if (activeTopics.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-soft text-orange mb-3">
          <GraduationCap size={22} />
        </div>
        <p className="font-display text-[20px] text-ink">
          Syllabus not ready for Form {formLevel} {subjectName}
        </p>
        <p className="mt-1.5 text-[13.5px] text-ink-soft max-w-[42ch] mx-auto">
          The Bondzi team is loading the WAEC syllabus for this
          subject. Check back soon.
        </p>
      </Card>
    );
  }

  const noneSelected = selected.size === 0;

  return (
    <>
      <Card className="p-5 sm:p-6 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
              Syllabus topics
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <button
                type="button"
                onClick={selectAll}
                className="text-orange hover:text-orange-deep underline-offset-2 hover:underline"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-ink-soft hover:text-ink underline-offset-2 hover:underline"
                disabled={noneSelected}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTopics.map((t) => {
              const isOn = selected.has(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  aria-pressed={isOn}
                  className={cn(
                    "inline-flex items-center min-h-9 px-3.5 rounded-full text-[13.5px] font-medium border transition-colors motion-reduce:transition-none",
                    isOn
                      ? "border-orange bg-orange text-paper"
                      : "border-rule-strong bg-paper text-ink hover:border-ink-soft",
                  )}
                >
                  {t.title}
                </button>
              );
            })}
          </div>
          {noneSelected ? (
            <p className="mt-2 text-[12px] text-ink-mute inline-flex items-center gap-1.5">
              <ListChecks size={12} />
              Pick at least one topic — or Select all to test across the
              full Form {formLevel} syllabus.
            </p>
          ) : (
            <p className="mt-2 text-[12px] text-ink-mute">
              {selected.size} of {activeTopics.length} topics selected
            </p>
          )}
        </div>

        <div>
          <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute mb-2">
            Questions
          </div>
          <div className="flex flex-wrap gap-2">
            {COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                aria-pressed={count === n}
                className={cn(
                  "inline-flex items-center min-h-9 px-3.5 rounded-full text-[13.5px] font-medium border transition-colors motion-reduce:transition-none",
                  count === n
                    ? "border-orange bg-orange text-paper"
                    : "border-rule-strong bg-paper text-ink hover:border-ink-soft",
                )}
              >
                {n}
              </button>
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
          disabled={noneSelected && pro}
          onClick={start}
          leftIcon={<GraduationCap size={16} />}
        >
          {pro ? "Start level test" : "Unlock level tests"}
        </Button>
        {!pro ? (
          <p className="text-[12px] text-ink-mute text-center">
            Bondzi Pro unlocks graded tests across the WAEC syllabus.
          </p>
        ) : null}
      </Card>

      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        feature="level-test"
        dismissTo="/dashboard"
      />
    </>
  );
}
