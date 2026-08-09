"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";
import type { Subject, Topic } from "@/lib/api/types";

type Difficulty = "easy" | "medium" | "hard" | "mixed";
const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
  { key: "mixed", label: "Mixed" },
];
const COUNTS = [10, 20, 30, 50] as const;

interface Props {
  subjects: Subject[];
  initialSubjectId: string | null;
  initialTopicId: string | null;
  onStart: (input: {
    subjectId: string;
    topicId?: string;
    difficulty: Difficulty;
    questionCount: number;
  }) => Promise<void>;
}

/**
 * Client-side setup form. Fetches topics on-demand when the student
 * picks a subject — no reason to prefetch every subject's topics.
 *
 * Deliberately keeps things few: subject, topic (optional),
 * difficulty, count. Anything more (time limit, focus-weak, exclude
 * seen, etc.) belongs on a later "advanced" panel and would clutter
 * this first-pass surface.
 */
export function PracticeSetup({
  subjects,
  initialSubjectId,
  initialTopicId,
  onStart,
}: Props) {
  const [subjectId, setSubjectId] = useState<string | null>(initialSubjectId);
  const [topicId, setTopicId] = useState<string | null>(initialTopicId);
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [count, setCount] = useState<number>(20);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const sortedSubjects = useMemo(
    () => subjects.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [subjects],
  );

  // Fetch topics whenever the subject changes. Topics live on
  // `/subjects/:id/topics`; we hit the client-side API here rather
  // than server-fetching in the parent, because subject choice is
  // interactive.
  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      return;
    }
    let cancelled = false;
    setTopicsLoading(true);
    (async () => {
      try {
        // `api()` reads the current NextAuth session's access token
        // via getSession() internally — no header threading required.
        const data = await api<Topic[]>(
          `/subjects/${encodeURIComponent(subjectId)}/topics`,
        );
        if (!cancelled) setTopics(data ?? []);
      } catch {
        if (!cancelled) setTopics([]);
      } finally {
        if (!cancelled) setTopicsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  const canStart = subjectId != null && !pending;

  return (
    <Card className="p-5 sm:p-6 space-y-5">
      {/* Subject */}
      <div>
        <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute mb-2">
          Subject
        </div>
        {sortedSubjects.length === 0 ? (
          <p className="text-[14px] text-ink-soft">
            No subjects available yet. Try again shortly.
          </p>
        ) : (
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
            {sortedSubjects.map((s) => (
              <Tile
                key={s.id}
                selected={subjectId === s.id}
                onClick={() => {
                  setSubjectId(s.id);
                  setTopicId(null);
                }}
              >
                <div className="font-medium text-[14px] leading-tight truncate">
                  {s.name}
                </div>
                <div className="text-[11px] text-ink-mute mt-0.5">
                  {s.code}
                </div>
              </Tile>
            ))}
          </div>
        )}
      </div>

      {/* Topic (optional) */}
      {subjectId ? (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
              Topic (optional)
            </div>
            {topicId ? (
              <button
                type="button"
                onClick={() => setTopicId(null)}
                className="text-[12px] font-semibold text-orange hover:text-orange-deep transition-colors"
              >
                Clear
              </button>
            ) : null}
          </div>
          {topicsLoading ? (
            <p className="text-[14px] text-ink-mute">Loading topics…</p>
          ) : topics.length === 0 ? (
            <p className="text-[14px] text-ink-mute">
              No topics published for this subject yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <Chip
                  key={t.id}
                  selected={topicId === t.id}
                  onClick={() => setTopicId(t.id)}
                >
                  {t.title}
                </Chip>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Difficulty */}
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

      {/* Count */}
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

      <div>
        <Button
          block
          size="lg"
          disabled={!canStart}
          loading={pending}
          onClick={() => {
            if (!subjectId) return;
            setError(null);
            startTransition(async () => {
              try {
                await onStart({
                  subjectId,
                  topicId: topicId ?? undefined,
                  difficulty,
                  questionCount: count,
                });
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Couldn't start the session. Try again.",
                );
              }
            });
          }}
        >
          Start practice
        </Button>
      </div>
    </Card>
  );
}

// ---- small primitives -----------------------------------------------------

function Tile({
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
        "p-3 rounded-xl border-2 text-left transition-colors motion-reduce:transition-none min-h-11",
        selected
          ? "border-orange bg-yellow-soft/50"
          : "border-rule-strong bg-paper hover:border-ink-soft",
      )}
    >
      {children}
    </button>
  );
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
