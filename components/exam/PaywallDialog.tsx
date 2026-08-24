"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Sparkles, Check } from "lucide-react";
import { Dialog, DialogActions } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * What the paywall is guarding — shapes the copy so students see the
   * specific value they're missing rather than a generic wall.
   */
  feature:
    | "explanation"
    | "quiz"
    | "mock-exam"
    | "level-test"
    | "unlimited-past-papers";
  /**
   * Fallback route students can dismiss to. Defaults to /dashboard,
   * per the decision to show a modal + let the user return to a public
   * alternative rather than hard-redirecting.
   */
  dismissTo?: string;
}

const COPY: Record<
  Props["feature"],
  { title: string; body: string; perks: string[] }
> = {
  explanation: {
    title: "Understand every wrong answer",
    body: "AI explanations walk you through the exact step you missed — in your own language pace.",
    perks: [
      "Step-by-step reasoning for every question",
      "Ghanaian context and examples",
      "Save wrong answers for spaced review",
    ],
  },
  quiz: {
    title: "Fresh AI questions on demand",
    body: "Bondzi Pro unlocks the Quiz tab — endless practice questions generated to match your exam and your weakest topics.",
    perks: [
      "New questions every session",
      "Adaptive difficulty",
      "AI explanations on every question",
    ],
  },
  "mock-exam": {
    title: "Take timed mock exams",
    body: "Sit realistic timed papers under exam conditions, then review your work with AI feedback.",
    perks: [
      "Timed WASSCE/BECE-style papers",
      "AI explanations on every wrong answer",
      "Track your score history",
    ],
  },
  "level-test": {
    title: "Test yourself against your level",
    body: "Level tests grade you against the WAEC syllabus so you know exactly where you stand before exam day.",
    perks: [
      "Pinpoint weak topics fast",
      "Per-topic breakdown after every test",
      "Suggested practice based on results",
    ],
  },
  "unlimited-past-papers": {
    title: "All 9 years of past papers",
    body: "Free students see the most recent papers. Pro unlocks every past paper Bondzi has.",
    perks: [
      "9 years of WAEC papers",
      "AI explanations on every question",
      "Mock exam mode",
    ],
  },
};

/**
 * Soft paywall — reachable modal, not a hard redirect. Students see the
 * exact value they'd unlock and can dismiss back to a free-tier
 * alternative. Uses the Radix-backed Dialog primitive so keyboard nav,
 * focus trap, and screen-reader announcements all Just Work.
 */
export function PaywallDialog({ open, onOpenChange, feature, dismissTo }: Props) {
  const copy = COPY[feature];

  // Fire on the open transition, not on every render, and keyed by
  // `feature` so re-opening the wall for a different gate counts
  // again. This is the denominator for paywall→checkout conversion:
  // without it, `checkout_initiated` has nothing to divide by.
  useEffect(() => {
    if (!open) return;
    trackEvent("paywall_shown", { feature });
  }, [open, feature]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.body}
    >
      <ul className="mt-2 space-y-2">
        {copy.perks.map((perk) => (
          <li
            key={perk}
            className="flex items-start gap-2.5 text-[14px] text-ink-soft"
          >
            <span
              className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange text-paper shrink-0"
              aria-hidden="true"
            >
              <Check size={12} strokeWidth={3} />
            </span>
            {perk}
          </li>
        ))}
      </ul>
      <DialogActions>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          href={dismissTo}
        >
          Maybe later
        </Button>
        <Link
          href="/subscription/plans"
          onClick={() => trackEvent("paywall_upgrade_clicked", { feature })}
          className="inline-flex items-center justify-center gap-1.5 min-h-11 px-5 rounded-xl bg-orange text-paper font-medium text-[15px] hover:bg-orange-deep transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Sparkles size={16} />
          Upgrade to Pro
        </Link>
      </DialogActions>
    </Dialog>
  );
}
