"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions } from "@/components/ui/Dialog";
import { updateExamType, type ExamType } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { SafeUser } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const OPTIONS: {
  key: ExamType;
  title: string;
  subtitle: string;
  needsForm: boolean;
}[] = [
  {
    key: "wassce",
    title: "WASSCE",
    subtitle: "Senior High School (SHS) — West African Senior School Cert.",
    needsForm: true,
  },
  {
    key: "bece",
    title: "BECE",
    subtitle: "Junior High School (JHS) — Basic Education Cert. Exam.",
    needsForm: true,
  },
  {
    key: "novdec",
    title: "Nov/Dec",
    subtitle: "Private WASSCE resit — no form level.",
    needsForm: false,
  },
];

const FORM_LEVELS = [1, 2, 3] as const;

interface Props {
  profile: SafeUser;
}

/**
 * Exam-type switch. Two dimensions:
 *   - `examType` — WASSCE / BECE / Nov/Dec
 *   - `formLevel` — 1..3 for BECE/WASSCE, null for Nov/Dec
 *
 * `examType` changes rotate the JWT (backend bakes it in); we merge
 * the new token pair into the NextAuth session via
 * `useSession().update()` and invalidate every cached subscription-
 * scoped query so the app repaints against the new level. `formLevel`-
 * only changes return `tokens: null` — no rotation needed, just a
 * profile refresh.
 */
export function ExamTypeForm({ profile }: Props) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const qc = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [examType, setExamType] = useState<ExamType>(profile.examType);
  const [formLevel, setFormLevel] = useState<1 | 2 | 3 | null>(
    profile.formLevel ?? (profile.examType === "novdec" ? null : 3),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const needsForm = examType !== "novdec";
  const changed =
    examType !== profile.examType || (formLevel ?? null) !== (profile.formLevel ?? null);
  const canSubmit =
    changed && (!needsForm || (formLevel !== null && formLevel !== undefined));

  const attemptSave = () => {
    if (!canSubmit) return;
    // examType changes have real consequences (subjects wipe,
    // leaderboard reset); require a confirmation. formLevel-only
    // tweaks save directly.
    if (examType !== profile.examType) {
      setConfirmOpen(true);
    } else {
      doSave();
    }
  };

  const doSave = () => {
    startTransition(async () => {
      try {
        const res = await updateExamType({
          examType,
          formLevel: needsForm ? formLevel : null,
        });
        // If tokens were rotated (examType actually changed), merge
        // them into the NextAuth session immediately so subsequent
        // requests carry the new JWT.
        if (res.tokens) {
          await updateSession({
            accessToken: res.tokens.accessToken,
            refreshToken: res.tokens.refreshToken,
            accessExpiresAt: res.tokens.accessExpiresAt,
            refreshExpiresAt: res.tokens.refreshExpiresAt,
            profile: res.user,
          });
        } else {
          await updateSession({ profile: res.user });
        }
        // Wipe every level-scoped cache so paywalls, subject grids,
        // leaderboards etc. re-fetch against the new level.
        await Promise.all([
          qc.invalidateQueries({ queryKey: ["subscription"] }),
          qc.invalidateQueries({ queryKey: ["leaderboard"] }),
          qc.invalidateQueries({ queryKey: ["winners"] }),
          qc.invalidateQueries({ queryKey: ["notifications"] }),
        ]);
        setConfirmOpen(false);
        toast.success("Exam type updated");
        router.refresh();
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) {
          toast.error(
            "You've changed exam type too many times in the last hour. Try again later.",
          );
          return;
        }
        toast.error(
          err instanceof Error ? err.message : "Couldn't update exam type.",
        );
      }
    });
  };

  return (
    <>
      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const active = examType === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                setExamType(opt.key);
                if (opt.key === "novdec") setFormLevel(null);
                else if (!formLevel) setFormLevel(3);
              }}
              aria-pressed={active}
              className={cn(
                "w-full text-left p-4 rounded-2xl border-2 transition-colors motion-reduce:transition-none",
                active
                  ? "border-orange bg-yellow-soft/60"
                  : "border-rule-strong bg-paper hover:border-ink-soft",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[18px] leading-tight text-ink">
                    {opt.title}
                  </div>
                  <div className="mt-0.5 text-[13px] text-ink-soft">
                    {opt.subtitle}
                  </div>
                </div>
                <div
                  className={cn(
                    "shrink-0 mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full",
                    active ? "bg-orange text-paper" : "bg-yellow-soft text-orange",
                  )}
                  aria-hidden="true"
                >
                  {active ? "✓" : ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {needsForm ? (
        <Card className="p-4">
          <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute mb-3">
            Form level
          </div>
          <div className="flex flex-wrap gap-2">
            {FORM_LEVELS.map((n) => {
              const active = formLevel === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFormLevel(n)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center min-h-9 px-4 rounded-full text-[13.5px] font-medium border transition-colors motion-reduce:transition-none",
                    active
                      ? "border-orange bg-orange text-paper"
                      : "border-rule-strong bg-paper text-ink hover:border-ink-soft",
                  )}
                >
                  Form {n}
                </button>
              );
            })}
          </div>
        </Card>
      ) : null}

      <div className="pt-2">
        <Button
          block
          size="lg"
          loading={pending}
          disabled={!canSubmit}
          onClick={attemptSave}
          leftIcon={<GraduationCap size={16} />}
        >
          Save changes
        </Button>
      </div>

      {/* Subject picks are kept per level and restored when you switch
          back, so this no longer warns about losing them. */}
      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Switch to a new exam type?"
        description={`Your ${profile.examType.toUpperCase()} leaderboard entries are reset. Subject picks, XP, streak and past attempts all stay — your ${profile.examType.toUpperCase()} subjects come back when you switch back. Continue?`}
      >
        <DialogActions>
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button loading={pending} onClick={doSave}>
            Switch exam type
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
