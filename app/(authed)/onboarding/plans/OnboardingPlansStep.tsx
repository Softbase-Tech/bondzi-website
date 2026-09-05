"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ENV } from "@/lib/env";
import { openPaystackCheckout } from "@/lib/paystack";
import { trackEvent } from "@/lib/analytics";
import {
  initiateSubscription,
  verifySubscription,
} from "@/lib/api/subscription";
import type { PublicPlan } from "@/lib/api/types";

interface Props {
  studentEmail: string;
  plus: PublicPlan | null;
  pro: PublicPlan | null;
}

/**
 * The interactive half of the onboarding pricing step. Three simple
 * rows — Free (what you have), Plus, Pro — one price each, no level
 * tabs, no cadence matrix. Pro buys the monthly cadence; every other
 * cadence stays one tap away on /subscription/plans after onboarding.
 *
 * Payment is the same pipeline PlanPicker uses: initiate → Paystack
 * Inline popup → verify → /subscription/success. The analytics dims
 * match PlanPicker's so onboarding checkouts land in the same funnel.
 */
export function OnboardingPlansStep({ studentEmail, plus, pro }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<"plus" | "pro" | null>(null);

  useEffect(() => {
    trackEvent("onboarding_plans_viewed");
  }, []);

  const skip = () => {
    trackEvent("onboarding_plans_skipped");
    router.replace("/dashboard");
  };

  const ghs = (n: number) => `GHS ${n % 1 === 0 ? n : n.toFixed(2)}`;

  const buy = async (plan: PublicPlan) => {
    const isPro = plan.account === "pro";
    const dims = {
      account: plan.account === "pro" ? ("pro" as const) : ("plus" as const),
      level: plan.level,
      cadence: (isPro ? "monthly" : "lifetime") as
        | "monthly"
        | "lifetime",
    };
    if (!studentEmail) {
      toast.error(
        "Add an email to your profile before buying. Receipts need one.",
      );
      return;
    }
    if (!ENV.PAYSTACK_PUBLIC_KEY_GH) {
      toast.error("Payments not configured. Ping support and try again.");
      return;
    }
    setBusy(isPro ? "pro" : "plus");
    try {
      const { reference, authorizationUrl } = await initiateSubscription({
        planId: plan.id,
        interval: isPro ? "monthly" : undefined,
      });
      trackEvent("checkout_initiated", dims);
      const amountMinor = Math.round(plan.pricing.monthly.price * 100);
      const result = await openPaystackCheckout({
        publicKey: ENV.PAYSTACK_PUBLIC_KEY_GH,
        email: studentEmail,
        amountMinor,
        reference,
        currency: plan.currency ?? "GHS",
        metadata: {
          planId: plan.id,
          account: plan.account,
          level: plan.level,
          cadence: isPro ? "monthly" : null,
        },
      }).catch((err) => {
        // Loader failure → hosted checkout URL, same fallback as
        // PlanPicker (strict-CSP browsers, offline-during-load blips).
        // eslint-disable-next-line no-console
        console.warn("Paystack inline failed; falling back to hosted URL", err);
        window.location.href = authorizationUrl;
        return { status: "success" as const, reference };
      });

      if (result.status === "closed") {
        trackEvent("checkout_dismissed", {
          account: dims.account,
          level: dims.level,
        });
        toast("Checkout closed. You can upgrade any time from Settings.");
        setBusy(null);
        return;
      }

      startTransition(async () => {
        try {
          await verifySubscription(reference);
          trackEvent("checkout_completed", dims);
          await Promise.all([
            qc.invalidateQueries({ queryKey: ["subscription", "me"] }),
            qc.invalidateQueries({ queryKey: ["subscription", "entitlements"] }),
            qc.invalidateQueries({ queryKey: ["auth", "me"] }),
          ]);
        } catch {
          // Webhook is the fallback; success page shows resolved state.
        }
        router.push(
          `/subscription/success?reference=${encodeURIComponent(reference)}`,
        );
      });
    } catch (err) {
      trackEvent("checkout_failed", {
        account: dims.account,
        level: dims.level,
        stage: "initiate",
      });
      toast.error(
        err instanceof Error ? err.message : "Couldn't start checkout.",
      );
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Free — what they already have. No button; it's the baseline. */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[15px] font-semibold text-ink">Free</div>
            <div className="text-[13px] text-ink-soft">
              What you have now, forever
            </div>
          </div>
          <div className="font-display text-[22px] text-ink">GHS 0</div>
        </div>
        <ul className="mt-3 space-y-1.5">
          {[
            "Thirty-four years of past questions, every subject",
            "Daily review, streaks, XP and the leaderboard",
            "10 AI explanations every month",
          ].map((f) => (
            <li
              key={f}
              className="flex gap-2 text-[13.5px] text-ink-soft items-start"
            >
              <Check size={15} className="text-orange shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
      </Card>

      {plus ? (
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[15px] font-semibold text-ink">Plus</div>
              <div className="text-[13px] text-ink-soft">
                Pay once, keep it forever
              </div>
            </div>
            <div className="font-display text-[22px] text-ink">
              {ghs(plus.pricing.monthly.price)}
              <span className="text-[12px] text-ink-mute font-sans">
                {" "}
                one-time
              </span>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5">
            {[
              "Everything in Free",
              "Full AI tutor, an explanation on every wrong answer",
            ].map((f) => (
              <li
                key={f}
                className="flex gap-2 text-[13.5px] text-ink-soft items-start"
              >
                <Check size={15} className="text-orange shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <Button
            block
            className="mt-4"
            loading={busy === "plus"}
            disabled={busy !== null}
            onClick={() => buy(plus)}
          >
            Get Plus, {ghs(plus.pricing.monthly.price)} once
          </Button>
        </Card>
      ) : null}

      {pro ? (
        <Card className="p-4 sm:p-5 border-2 border-orange relative">
          <div className="absolute -top-3 left-4 inline-flex items-center gap-1 bg-orange text-on-brand text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            <Sparkles size={11} />
            Most complete
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[15px] font-semibold text-ink">Pro</div>
              <div className="text-[13px] text-ink-soft">
                The full exam campaign kit
              </div>
            </div>
            <div className="font-display text-[22px] text-ink">
              {ghs(pro.pricing.monthly.price)}
              <span className="text-[12px] text-ink-mute font-sans">
                {" "}
                / month
              </span>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5">
            {[
              "Everything in Plus",
              "AI level tests and weakness analytics",
              "Timed mock exams with post-exam breakdowns",
            ].map((f) => (
              <li
                key={f}
                className="flex gap-2 text-[13.5px] text-ink-soft items-start"
              >
                <Check size={15} className="text-orange shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <Button
            block
            className="mt-4"
            loading={busy === "pro"}
            disabled={busy !== null}
            onClick={() => buy(pro)}
          >
            Get Pro, {ghs(pro.pricing.monthly.price)}/month
          </Button>
          <p className="mt-2 text-center text-[11.5px] text-ink-mute">
            6-month and annual prices are on the plans page, any time.
          </p>
        </Card>
      ) : null}

      <button
        type="button"
        onClick={skip}
        disabled={busy !== null}
        className="block w-full text-center py-3 text-[14px] font-medium text-ink-soft hover:text-ink underline underline-offset-4"
      >
        Skip for now, continue with Free
      </button>
      <p className="text-center text-[12px] text-ink-mute -mt-2">
        Paid in cedis by MTN, Telecel, or AirtelTigo mobile money.
      </p>
    </div>
  );
}
