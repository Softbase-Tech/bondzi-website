"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Clock,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions } from "@/components/ui/Dialog";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import {
  abandonExam,
  completeExam,
  submitAnswer,
} from "@/lib/api/exams";
import type { ExamSession, Question } from "@/lib/api/types";
import { scoreBand, trackEvent } from "@/lib/analytics";
import { QuestionRenderer } from "./QuestionRenderer";
import { ExplanationSheet } from "./ExplanationSheet";
import { ReportQuestionDialog } from "./ReportQuestionDialog";

interface Props {
  session: ExamSession;
}

interface LocalAnswer {
  questionId: string;
  selectedOptionId: string | null;
  submittedAt: number;
  submitting: boolean;
  /** Set after a successful submit — used by the review nav map. */
  finalised: boolean;
  /**
   * `POST /exams/:id/answers` returns `{ isCorrect, correctOptionId }`
   * so we can reveal correct/wrong feedback inline the moment the
   * student picks — same as mobile. Populated on successful submit
   * only; failed submits leave these undefined and the runner falls
   * back to a plain "selected" tile without correctness colouring.
   */
  isCorrect?: boolean;
  correctOptionId?: string | null;
}

/**
 * The heart of Phase 3. Runs an exam session interactively.
 *
 * Contract with the server:
 *   - Every option-tap fires POST /exams/:id/answers immediately (with
 *     an Idempotency-Key so a retry crossed the wire twice can't
 *     double-count). Server is the source of truth; local state is
 *     just cache. If the user closes the tab, no answers are lost —
 *     the ones they submitted are already on the server.
 *   - Submit-all fires POST /exams/:id/complete and routes to the
 *     result page.
 *   - Abandon fires POST /exams/:id/abandon and routes home.
 *
 * Client-only state:
 *   - currentIndex — which question is on screen
 *   - marksForReview — a Set<string> of questionIds the student flagged
 *   - timer — countdown for timed exams, submits automatically on expiry
 *   - local answer cache — the selected option per question, so
 *     re-visiting a question shows the pick without a re-fetch
 *
 * Layout is deliberately compact on mobile (one question, one nav
 * strip, one big submit) and expands to a side-by-side nav map on lg+.
 */
export function ExamRunner({ session }: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({});
  const [marksForReview, setMarksForReview] = useState<Set<string>>(
    () => new Set(),
  );
  const [submittingComplete, setSubmittingComplete] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [confirmAbandonOpen, setConfirmAbandonOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false); // mobile-only "jump to" sheet
  const [explanationQuestionId, setExplanationQuestionId] = useState<
    string | null
  >(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    session.durationSeconds ?? null,
  );

  const questions = session.questions;
  const total = questions.length;
  const currentQuestion: Question | undefined = questions[currentIndex];

  // Prompt on tab close / refresh / URL-bar navigation. Fires the
  // native browser "Leave site?" dialog while the exam is in
  // progress. This does NOT fire on Next.js in-app Link clicks —
  // those navigate normally; every submitted answer is already
  // persisted server-side per pick, so a mid-exam nav is only a
  // "you might not finish" situation, not "you'll lose progress".
  // The Leave button below still shows an explicit abandon confirm.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      // Once the student has submitted the exam we don't need to
      // gate the tab close; the result page can be reopened later.
      if (submittingComplete) return;
      e.preventDefault();
      // Setting returnValue is what most browsers actually check.
      // Modern Chrome/Firefox ignore the string content and show
      // their own generic copy — the important thing is a truthy
      // returnValue.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [submittingComplete]);

  // Countdown timer (guarded: only ticks for timed exams). Auto-submits
  // when time hits zero.
  const submitAutoRef = useRef(false);
  useEffect(() => {
    if (timeLeft == null) return;
    if (timeLeft <= 0) {
      if (submitAutoRef.current) return;
      submitAutoRef.current = true;
      void handleComplete("timeout");
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => (t == null ? null : t - 1)), 1000);
    return () => clearTimeout(id);
    // handleComplete's identity changes on every render — that's fine,
    // the guard flag prevents duplicate fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((a) => a.finalised).length,
    [answers],
  );

  const handleSelect = useCallback(
    async (optionId: string) => {
      if (!currentQuestion) return;
      const qid = currentQuestion.id;
      // Guard against a double-tap while the previous submit is still
      // in flight — the option tiles are already disabled, but a
      // programmatic call could still fire.
      if (answers[qid]?.submitting) return;
      const idempotencyKey =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${qid}-${Date.now()}`;

      setAnswers((prev) => ({
        ...prev,
        [qid]: {
          questionId: qid,
          selectedOptionId: optionId,
          submittedAt: Date.now(),
          submitting: true,
          finalised: false,
        },
      }));

      try {
        const res = await submitAnswer(session.id, {
          questionId: qid,
          selectedOptionId: optionId,
          idempotencyKey,
        });
        setAnswers((prev) => ({
          ...prev,
          [qid]: {
            ...(prev[qid] ?? {
              questionId: qid,
              selectedOptionId: optionId,
              submittedAt: Date.now(),
              submitting: false,
              finalised: true,
            }),
            submitting: false,
            finalised: true,
            isCorrect: res.isCorrect,
            correctOptionId: res.correctOptionId,
          },
        }));
      } catch (err) {
        // Roll back the finalised flag so the nav map shows the
        // question as "not answered". Local selection stays so the
        // user can re-tap the same option to retry.
        setAnswers((prev) => ({
          ...prev,
          [qid]: {
            ...(prev[qid] ?? {
              questionId: qid,
              selectedOptionId: optionId,
              submittedAt: Date.now(),
              submitting: false,
              finalised: false,
            }),
            submitting: false,
            finalised: false,
          },
        }));
        const message =
          err instanceof ApiError
            ? err.message
            : "Answer didn't send — tap again to retry.";
        toast.error("Couldn't submit answer", { description: message });
      }
    },
    [currentQuestion, session.id, answers],
  );

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);
  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(total - 1, i + 1));
  }, [total]);
  const jumpTo = useCallback((idx: number) => {
    setCurrentIndex(idx);
    setNavOpen(false);
  }, []);
  /**
   * Called by ReportQuestionDialog after a successful POST to
   * /questions/:id/flag. Marks the question client-side so the nav
   * grid pin lights up — a visual confirmation that the flag went
   * through, tied to the same button the student pressed.
   */
  const onQuestionFlagged = useCallback((qid: string) => {
    setMarksForReview((prev) => {
      if (prev.has(qid)) return prev;
      const next = new Set(prev);
      next.add(qid);
      return next;
    });
  }, []);

  async function handleComplete(reason: "manual" | "timeout") {
    if (submittingComplete) return;
    setSubmittingComplete(true);
    setConfirmSubmitOpen(false);
    if (reason === "timeout") {
      toast.info("Time's up", { description: "Submitting your exam." });
    }
    try {
      const result = await completeExam(session.id);
      // `score` is a 0..1 ratio from the backend serialiser. Banded
      // rather than sent raw: the exact percentage is one bucket per
      // student, the band is a distribution you can actually read.
      trackEvent("exam_completed", {
        mode: session.mode,
        scoreBand: scoreBand(result.score),
        reason,
      });
      router.replace(`/exam/${session.id}/result`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Please check your connection and try again.";
      toast.error("Couldn't submit exam", { description: message });
      setSubmittingComplete(false);
    }
  }

  async function handleAbandon() {
    setConfirmAbandonOpen(false);
    trackEvent("exam_abandoned", { mode: session.mode });
    try {
      await abandonExam(session.id);
    } catch {
      // Best-effort — the server may have already marked it complete
      // or the network dropped. Either way route the user out of the
      // half-finished session.
    }
    router.replace("/dashboard");
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-16">
        <p className="text-[15px] text-ink-soft">
          This exam has no questions.
        </p>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion.id] ?? null;
  const isMarked = marksForReview.has(currentQuestion.id);
  const isTimed = timeLeft != null;

  return (
    <div className="max-w-[880px] mx-auto">
      {/* Top strip: back, timer, progress */}
      <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
        <button
          type="button"
          onClick={() => setConfirmAbandonOpen(true)}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-mute hover:text-ink transition-colors motion-reduce:transition-none"
        >
          <ChevronLeft size={14} />
          Leave
        </button>
        <div className="flex items-center gap-4 text-[13px]">
          {isTimed ? (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-full font-mono font-semibold",
                timeLeft != null && timeLeft <= 60
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-soft text-ink",
              )}
              aria-live="polite"
              aria-atomic="true"
            >
              <Clock size={13} />
              {formatDuration(timeLeft ?? 0)}
            </div>
          ) : null}
          <span className="text-ink-soft">
            <span className="font-semibold text-ink">{answeredCount}</span> of{" "}
            {total} answered
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 rounded-full bg-rule overflow-hidden mb-6"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={currentIndex + 1}
        aria-label="Exam progress"
      >
        <div
          className="h-full bg-orange transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* The question. While a submit is in flight all options are
          non-interactive, the tapped option shows a spinner in place
          of its letter chip, and the others fade. Once the server
          responds we reveal correct/wrong inline via
          `correctOptionId` — same as mobile. Options stay tap-able
          after the reveal so the student can change their mind. */}
      <QuestionRenderer
        question={currentQuestion}
        kicker={`Question ${currentIndex + 1} of ${total}`}
        selectedOptionId={currentAnswer?.selectedOptionId ?? null}
        correctOptionId={
          currentAnswer?.finalised
            ? (currentAnswer.correctOptionId ?? null)
            : null
        }
        submitting={currentAnswer?.submitting ?? false}
        onSelect={handleSelect}
      />

      {/* Submit-in-flight banner: reassures the student the tap
          registered and the network is doing its thing. Sonner toasts
          are too heavy for something that happens every question. */}
      {currentAnswer?.submitting ? (
        <div
          className="mt-4 rounded-xl px-4 py-3 text-[13.5px] font-medium bg-yellow-soft/70 border border-orange/30 text-ink inline-flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <Loader2 size={14} className="animate-spin text-orange" />
          Checking your answer…
        </div>
      ) : null}

      {/* Correct / wrong reveal. Only renders once the submit
          resolved with a real isCorrect flag from the server. */}
      {currentAnswer?.finalised && currentAnswer.isCorrect != null ? (
        <div
          className={cn(
            "mt-4 rounded-xl px-4 py-3 text-[13.5px] font-medium flex items-start gap-3 flex-wrap",
            currentAnswer.isCorrect
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200",
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex-1 min-w-0">
            {currentAnswer.isCorrect
              ? "Correct — nice."
              : "Not this one. The correct answer is highlighted in green."}
          </div>
          {/* Explain button surfaces after a wrong pick — the
              ExplanationSheet handles paywall gating on 402/403/429
              so free-tier students get the upgrade prompt instead of
              a confusing error. */}
          {!currentAnswer.isCorrect ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sparkles size={14} />}
              onClick={() => {
                trackEvent("explanation_opened", { source: "exam" });
                setExplanationQuestionId(currentQuestion.id);
              }}
            >
              Explain this
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Bottom action row */}
      <div className="mt-8 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={goPrev}
            disabled={currentIndex === 0}
            leftIcon={<ChevronLeft size={16} />}
          >
            Prev
          </Button>
          <Button
            variant={isMarked ? "primary" : "outline"}
            size="md"
            onClick={() => setReportOpen(true)}
            leftIcon={<Flag size={15} />}
            title={
              isMarked
                ? "This question was flagged for admin review. Tap to add another note."
                : "Flag this question — an admin will review it and fix any problems."
            }
            aria-label={
              isMarked
                ? "This question has been flagged. Tap to flag again."
                : "Flag this question for admin review"
            }
          >
            {isMarked ? "Flagged" : "Flag for review"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => setNavOpen(true)}
            className="lg:hidden"
          >
            All questions
          </Button>
          {currentIndex === total - 1 ? (
            <Button
              size="md"
              onClick={() => setConfirmSubmitOpen(true)}
              loading={submittingComplete}
              rightIcon={<Check size={16} />}
            >
              Submit exam
            </Button>
          ) : (
            <Button
              size="md"
              onClick={goNext}
              rightIcon={<ChevronRight size={16} />}
            >
              Next
            </Button>
          )}
        </div>
      </div>

      {/* Desktop nav map */}
      <NavMap
        questions={questions}
        answers={answers}
        marksForReview={marksForReview}
        currentIndex={currentIndex}
        onJump={jumpTo}
        className="hidden lg:grid mt-10"
      />

      {/* Mobile nav sheet — same map inside a bottom sheet */}
      <Sheet
        open={navOpen}
        onOpenChange={setNavOpen}
        title="All questions"
        description="Jump to any question, or review the ones you marked."
      >
        <NavMap
          questions={questions}
          answers={answers}
          marksForReview={marksForReview}
          currentIndex={currentIndex}
          onJump={jumpTo}
        />
        <div className="mt-6">
          <Button
            block
            size="lg"
            onClick={() => {
              setNavOpen(false);
              setConfirmSubmitOpen(true);
            }}
          >
            Submit exam
          </Button>
        </div>
      </Sheet>

      {/* Submit confirm */}
      <Dialog
        open={confirmSubmitOpen}
        onOpenChange={setConfirmSubmitOpen}
        title="Submit exam?"
        description={
          answeredCount < total
            ? `You've answered ${answeredCount} of ${total}. Any unanswered questions will be marked skipped.`
            : "You've answered every question. Ready to see your result?"
        }
      >
        <DialogActions>
          <Button
            variant="outline"
            onClick={() => setConfirmSubmitOpen(false)}
          >
            Keep working
          </Button>
          <Button
            onClick={() => handleComplete("manual")}
            loading={submittingComplete}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Abandon confirm. Three real options, spelled out clearly
          so a student doesn't lose work by accident:
            - "Keep working" — dismiss the dialog and stay put.
            - "Submit now" — finalise everything answered so far and
              route to the result screen.
            - "Discard session" — mark abandoned; no result, no XP. */}
      <Dialog
        open={confirmAbandonOpen}
        onOpenChange={setConfirmAbandonOpen}
        title="Leave this exam?"
        description="Every answer you've picked is already saved. You can submit now to see your result, or discard this session and start over later."
      >
        <DialogActions>
          <Button
            variant="outline"
            onClick={() => setConfirmAbandonOpen(false)}
          >
            Keep working
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmAbandonOpen(false);
              setConfirmSubmitOpen(true);
            }}
          >
            Submit now
          </Button>
          <Button variant="destructive" onClick={handleAbandon}>
            Discard session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Explanation sheet — lazy-loads the AI explanation. Handles
          the paywall gate internally for free-tier students. */}
      <ExplanationSheet
        questionId={explanationQuestionId}
        open={explanationQuestionId != null}
        onOpenChange={(open) => {
          if (!open) setExplanationQuestionId(null);
        }}
      />

      {/* Flag-for-review dialog. Hits POST /questions/:id/flag with
          the picked reason + note. On success the runner mirrors the
          flag into `marksForReview` so the nav grid pin lights up. */}
      <ReportQuestionDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        questionId={currentQuestion.id}
        questionNumber={currentIndex + 1}
        onReported={onQuestionFlagged}
      />
    </div>
  );
}

// ---- nav map --------------------------------------------------------------

function NavMap({
  questions,
  answers,
  marksForReview,
  currentIndex,
  onJump,
  className,
}: {
  questions: Question[];
  answers: Record<string, LocalAnswer>;
  marksForReview: Set<string>;
  currentIndex: number;
  onJump: (idx: number) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-1.5 grid-cols-8 sm:grid-cols-10",
        className,
      )}
    >
      {questions.map((q, i) => {
        const a = answers[q.id];
        const answered = a?.finalised ?? false;
        const submitting = a?.submitting ?? false;
        const marked = marksForReview.has(q.id);
        const isCurrent = i === currentIndex;
        return (
          <button
            key={q.id}
            type="button"
            onClick={() => onJump(i)}
            className={cn(
              "relative h-10 rounded-lg text-[12.5px] font-semibold transition-colors motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
              isCurrent
                ? "bg-ink text-paper ring-2 ring-orange"
                : answered
                  ? "bg-orange text-paper"
                  : submitting
                    ? "bg-yellow text-ink"
                    : "bg-rule text-ink-soft hover:bg-rule-strong",
            )}
            aria-label={
              `Question ${i + 1}` +
              (answered
                ? ", answered"
                : submitting
                  ? ", submitting"
                  : ", not answered") +
              (marked ? ", marked for review" : "") +
              (isCurrent ? ", current" : "")
            }
          >
            {i + 1}
            {marked ? (
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow border-2 border-bg"
                aria-hidden="true"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
