"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Flag } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogActions } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { flagQuestion, type FlagReason } from "@/lib/api/questions";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  questionNumber?: number;
  /**
   * Fires after a successful `POST /questions/:id/flag` call. The
   * ExamRunner uses this to also mark the question client-side (so
   * the nav grid pin lights up) — a single flag action now covers
   * both "admin sees this" and "student's own visual reminder".
   */
  onReported?: (questionId: string, reason: FlagReason) => void;
}

const REASONS: { key: FlagReason; label: string; hint: string }[] = [
  {
    key: "wrong_answer",
    label: "Wrong answer",
    hint: "The marked correct answer isn't right.",
  },
  {
    key: "typo",
    label: "Typo",
    hint: "There's a spelling or symbol error somewhere.",
  },
  {
    key: "bad_image",
    label: "Bad image",
    hint: "An image is missing, blurry, or unrelated.",
  },
  {
    key: "outdated",
    label: "Outdated",
    hint: "The content is no longer accurate for the current syllabus.",
  },
  {
    key: "duplicate",
    label: "Duplicate",
    hint: "This question appears more than once.",
  },
  {
    key: "other",
    label: "Something else",
    hint: "Explain in the note.",
  },
];

/**
 * Flag a question for admin review via `POST /questions/:id/flag`.
 * The student picks a reason (wrong answer / typo / bad image /
 * outdated / duplicate / other) + optional note; the payload lands
 * in the admin question-review queue.
 *
 * The runner mirrors a successful flag into its own `marksForReview`
 * Set (via `onReported`) so the nav grid pin lights up — a single
 * action covers "admin sees this" AND "student's own visual
 * reminder" that they've flagged it.
 */
export function ReportQuestionDialog({
  open,
  onOpenChange,
  questionId,
  questionNumber,
  onReported,
}: Props) {
  const [reason, setReason] = useState<FlagReason | null>(null);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!reason) return;
    startTransition(async () => {
      try {
        await flagQuestion(questionId, {
          reason,
          note: note.trim() || undefined,
        });
        toast.success("Flagged for review — thanks.", {
          description: "Our team will look into this question.",
        });
        onReported?.(questionId, reason);
        setReason(null);
        setNote("");
        onOpenChange(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't send the report.",
        );
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setReason(null);
          setNote("");
        }
        onOpenChange(o);
      }}
      title={
        questionNumber
          ? `Report a problem with question ${questionNumber}`
          : "Report a problem"
      }
      description="Tell us what's wrong. An admin will review this question and fix it if needed."
    >
      <div className="space-y-3">
        <div className="text-[11.5px] font-semibold uppercase tracking-widest text-ink-mute">
          What's wrong?
        </div>
        <div className="grid gap-2">
          {REASONS.map((r) => {
            const active = reason === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setReason(r.key)}
                aria-pressed={active}
                className={cn(
                  "text-left p-3 rounded-xl border-2 transition-colors motion-reduce:transition-none",
                  active
                    ? "border-orange bg-yellow-soft/60"
                    : "border-rule-strong bg-paper hover:border-ink-soft",
                )}
              >
                <div className="font-display text-[14.5px] text-ink leading-tight">
                  {r.label}
                </div>
                <div className="mt-0.5 text-[12px] text-ink-soft">
                  {r.hint}
                </div>
              </button>
            );
          })}
        </div>

        <div>
          <label
            className="text-[11.5px] font-semibold uppercase tracking-widest text-ink-mute block mb-1.5"
            htmlFor="report-note"
          >
            More details <span className="normal-case text-ink-mute font-normal">(optional)</span>
          </label>
          <textarea
            id="report-note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            placeholder="Anything else the admin should know?"
            rows={3}
            className="w-full text-[14px] rounded-xl border border-rule-strong bg-paper p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange resize-none"
            maxLength={500}
          />
          <div className="mt-1 text-right text-[11px] text-ink-mute">
            {note.length} / 500
          </div>
        </div>

        <div className="rounded-xl bg-yellow-soft/60 border border-orange/30 p-3 text-[12.5px] text-ink inline-flex items-start gap-2">
          <AlertTriangle size={14} className="text-orange shrink-0 mt-0.5" />
          <span>
            This report goes to Bondzi admins. It won&apos;t change your
            answer or your score on this exam.
          </span>
        </div>
      </div>

      <DialogActions>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          onClick={submit}
          loading={pending}
          disabled={!reason || pending}
          leftIcon={<Flag size={14} />}
        >
          Send report
        </Button>
      </DialogActions>
    </Dialog>
  );
}
