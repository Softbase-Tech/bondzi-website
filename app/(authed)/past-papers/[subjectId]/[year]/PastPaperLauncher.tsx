"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, Calendar, BookOpenText, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Props {
  subjectName: string;
  subjectCode: string;
  year: number;
  onStart: () => Promise<void>;
}

/**
 * Client-side launcher card. Shows the paper's headline info and a
 * primary Start button. Uses `useTransition` around the server action
 * so the Start button can show a loading state while the exam row is
 * being created — non-trivial when the backend fans out subject +
 * question fetches on that endpoint.
 */
export function PastPaperLauncher({
  subjectName,
  subjectCode,
  year,
  onStart,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="max-w-[720px] mx-auto space-y-8">
      <div>
        <Link
          href={`/past-papers/${encodeURIComponent(subjectCode)}`}
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
          <Button
            block
            size="lg"
            loading={pending}
            onClick={() => {
              setError(null);
              // Server actions can't throw a caught error client-side
              // in a normal try/catch — Next-15+ wraps rejections in a
              // synthetic error. Best-effort: capture and surface if
              // the action calls back into client via a Promise
              // rejection.
              startTransition(async () => {
                try {
                  await onStart();
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Couldn't start the exam. Try again.",
                  );
                }
              });
            }}
          >
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
