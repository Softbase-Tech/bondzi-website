"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ENV } from "@/lib/env";
import { openPaystackCheckout } from "@/lib/paystack";
import { trackEvent, type Cadence as AnalyticsCadence } from "@/lib/analytics";
import {
  initiateSubscription,
  verifySubscription,
  checkoutInProgressFrom,
} from "@/lib/api/subscription";
import type {
  BillingInterval,
  ExamType,
  PublicPlan,
  Subscription,
  SubscriptionEntitlement,
} from "@/lib/api/types";

type Cadence = BillingInterval;

const LEVELS: { key: ExamType; label: string }[] = [
  { key: "wassce", label: "WASSCE" },
  { key: "bece", label: "BECE" },
  { key: "novdec", label: "Nov/Dec" },
];

interface Props {
  studentEmail: string;
  studentExamType: ExamType;
  currentSubscription: Subscription | null;
  entitlements: SubscriptionEntitlement[];
  plans: PublicPlan[];
  preferredLevel?: string;
  returnTo?: string;
}

/**
 * Client-side plan picker + Paystack Inline checkout.
 *
 * Flow:
 *   1. Student picks level → account → (Pro only) cadence
 *   2. Buy button → initiateSubscription → { authorizationUrl, ref }
 *   3. openPaystackCheckout({ ref, amountMinor, email, ... }) →
 *      popup opens on the same page (no full-page redirect)
 *   4. On Paystack success callback → verifySubscription(ref) →
 *      route to /subscription/success?ref=... with the confirmation
 *
 * Webhook fallback: if the browser is killed between success and
 * verify, the backend's Paystack webhook activates the subscription
 * anyway. Verify is idempotent — a retry re-runs safely.
 */
export function PlanPicker({
  studentEmail,
  studentExamType,
  currentSubscription,
  entitlements,
  plans,
  preferredLevel,
  returnTo,
}: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  // Default the level tab to the student's examType, unless the caller
  // deep-linked to a specific one (?level=bece).
  const defaultLevel: ExamType =
    isExamType(preferredLevel) ? preferredLevel : studentExamType;
  const [level, setLevel] = useState<ExamType>(defaultLevel);
  const [cadence, setCadence] = useState<Cadence>("six_month");

  const levelPlans = useMemo(
    () =>
      plans
        .filter((p) => p.level === level)
        .sort((a, b) => (a.account === "plus" ? -1 : 1)),
    [plans, level],
  );

  const entitlementByLevel: Record<ExamType, SubscriptionEntitlement | null> = {
    wassce: null,
    bece: null,
    novdec: null,
  };
  for (const e of entitlements) entitlementByLevel[e.level] = e;

  const buy = async (plan: PublicPlan, chosenCadence: Cadence | null) => {
    // Every checkout event carries the same three dimensions so the
    // funnel can be sliced by tier, level, and cadence without joining
    // anything. `lifetime` stands in for Plus, which is one-time and
    // therefore has no billing interval.
    const dims = {
      account: plan.account === "pro" ? ("pro" as const) : ("plus" as const),
      level: plan.level,
      cadence: (plan.paymentKind === "one_time"
        ? "lifetime"
        : (chosenCadence ?? "monthly")) as AnalyticsCadence,
    };

    if (!studentEmail) {
      toast.error(
        "Add an email to your profile before buying — Paystack needs one for receipts.",
      );
      return;
    }
    if (!ENV.PAYSTACK_PUBLIC_KEY_GH) {
      toast.error("Payments not configured. Ping support and try again.");
      return;
    }
    setBusyPlanId(plan.id);
    try {
      const { reference, authorizationUrl } = await initiateSubscription({
        planId: plan.id,
        interval:
          plan.paymentKind === "one_time"
            ? undefined
            : (chosenCadence ?? undefined),
      });
      // Fires once the backend has a real `payment_attempts` row —
      // i.e. the student committed, not merely looked at the card.
      trackEvent("checkout_initiated", dims);
      const amountMinor = getAmountMinor(plan, chosenCadence);
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
          cadence: chosenCadence,
        },
      }).catch((err) => {
        // Loader failure → fall back to hosted checkout URL. This
        // covers strict-CSP browsers or offline-during-load blips.
        // eslint-disable-next-line no-console
        console.warn("Paystack inline failed; falling back to hosted URL", err);
        window.location.href = authorizationUrl;
        return { status: "success" as const, reference };
      });

      if (result.status === "closed") {
        // Popup dismissed without paying. The gap between
        // `checkout_initiated` and this is the abandoned-cart rate.
        trackEvent("checkout_dismissed", {
          account: dims.account,
          level: dims.level,
        });
        toast("Checkout closed. Restart it any time from this page.");
        return;
      }

      // Verify + refresh.
      startTransition(async () => {
        try {
          await verifySubscription(reference);
          trackEvent("checkout_completed", dims);
          await Promise.all([
            qc.invalidateQueries({ queryKey: ["subscription", "me"] }),
            qc.invalidateQueries({ queryKey: ["subscription", "entitlements"] }),
            qc.invalidateQueries({ queryKey: ["auth", "me"] }),
          ]);
          const dest =
            returnTo && returnTo.startsWith("/")
              ? returnTo
              : "/subscription/success";
          router.push(
            `${dest}${dest.includes("?") ? "&" : "?"}reference=${encodeURIComponent(reference)}`,
          );
        } catch (err) {
          // Webhook is the fallback — send the user to the success
          // page anyway with the reference so they can see resolved
          // state (backend will have activated by then in most cases).
          //
          // Tracked as an ops signal, not a lost sale: a rising rate
          // here means students are landing on "activating…" instead
          // of a clean success.
          trackEvent("checkout_failed", {
            account: dims.account,
            level: dims.level,
            stage: "verify",
          });
          // eslint-disable-next-line no-console
          console.warn("Verify failed — relying on webhook", err);
          router.push(
            `/subscription/success?reference=${encodeURIComponent(reference)}&pending=1`,
          );
        }
      });
    } catch (err) {
      const resume = checkoutInProgressFrom(err);
      if (resume) {
        trackEvent("checkout_resumed", {
          account: dims.account,
          level: dims.level,
        });
        toast("You already started a checkout — reopening it.");
        // Reopen with the SAME reference so backend recognises the
        // attempt.
        try {
          const amountMinor = getAmountMinor(plan, chosenCadence);
          await openPaystackCheckout({
            publicKey: ENV.PAYSTACK_PUBLIC_KEY_GH,
            email: studentEmail,
            amountMinor,
            reference: resume.reference,
            currency: plan.currency ?? "GHS",
          });
        } catch (reopenErr) {
          // eslint-disable-next-line no-console
          console.warn("Reopen failed", reopenErr);
          toast.error("Couldn't reopen the checkout. Try again in a moment.");
        }
        return;
      }
      trackEvent("checkout_failed", {
        account: dims.account,
        level: dims.level,
        stage: "initiate",
      });
      const message =
        err instanceof Error
          ? err.message
          : "Couldn't start checkout. Try again.";
      toast.error(message);
    } finally {
      setBusyPlanId(null);
    }
  };

  return (
    <section className="space-y-6">
      <LevelTabs value={level} onChange={setLevel} />

      <div className="grid gap-4 md:grid-cols-2">
        {levelPlans.length === 0 ? (
          <Card className="p-6 text-center md:col-span-2">
            <p className="text-[13.5px] text-ink-soft">
              Plans for {label(level)} aren&apos;t published yet — check
              back soon.
            </p>
          </Card>
        ) : (
          levelPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              cadence={cadence}
              onChangeCadence={setCadence}
              entitlement={entitlementByLevel[plan.level]}
              currentSubscription={currentSubscription}
              busy={busyPlanId === plan.id || pending}
              onBuy={buy}
            />
          ))
        )}
      </div>
    </section>
  );
}

function LevelTabs({
  value,
  onChange,
}: {
  value: ExamType;
  onChange: (v: ExamType) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex p-1 rounded-full bg-yellow-soft/70 border border-rule w-full sm:w-auto"
    >
      {LEVELS.map(({ key, label: l }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn(
              "flex-1 sm:flex-none h-9 px-4 rounded-full text-[13.5px] font-medium transition-colors motion-reduce:transition-none",
              active
                ? "bg-paper text-ink shadow-sm"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

function PlanCard({
  plan,
  cadence,
  onChangeCadence,
  entitlement,
  currentSubscription,
  busy,
  onBuy,
}: {
  plan: PublicPlan;
  cadence: Cadence;
  onChangeCadence: (c: Cadence) => void;
  entitlement: SubscriptionEntitlement | null;
  currentSubscription: Subscription | null;
  busy: boolean;
  onBuy: (plan: PublicPlan, cadence: Cadence | null) => void | Promise<void>;
}) {
  const isPlus = plan.account === "plus";
  const isRecurring = plan.paymentKind === "recurring";
  const currency = plan.currency ?? "GHS";
  const price = isRecurring
    ? getCadencePrice(plan, cadence)
    : plan.pricing.monthly.price;

  const ownsThisTier =
    !!entitlement &&
    entitlement.account === plan.account &&
    !entitlement.cancelled;
  const ownsCurrentLevel =
    currentSubscription?.level === plan.level &&
    (currentSubscription.status === "active" ||
      currentSubscription.status === "xp_credited");

  return (
    <Card
      className={cn(
        "p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden",
        !isPlus ? "border-orange" : "",
      )}
    >
      {!isPlus ? (
        <div className="absolute top-0 right-0 inline-flex items-center gap-1 px-2.5 h-7 bg-orange text-paper rounded-bl-2xl text-[11.5px] font-semibold uppercase tracking-widest">
          <Sparkles size={12} />
          Most popular
        </div>
      ) : null}

      <div>
        <div className="text-[12px] font-semibold uppercase tracking-widest text-ink-mute">
          {isPlus ? "Bondzi Plus" : "Bondzi Pro"}
        </div>
        <div className="mt-1 font-display text-[26px] leading-tight text-ink">
          {plan.name}
        </div>
        {plan.description ? (
          <p className="mt-1.5 text-[13.5px] text-ink-soft">
            {plan.description}
          </p>
        ) : null}
      </div>

      {/* Cadence chips for Pro */}
      {isRecurring ? (
        <div className="flex flex-wrap gap-2">
          {(["monthly", "six_month", "annual"] as const).map((c) => {
            const p = getCadencePrice(plan, c);
            const active = cadence === c;
            const unavailable =
              c === "monthly"
                ? !plan.pricing.monthly.available
                : c === "six_month"
                  ? !plan.pricing.sixMonth.available
                  : !plan.pricing.annual.available;
            if (unavailable) return null;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onChangeCadence(c)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-medium border transition-colors motion-reduce:transition-none",
                  active
                    ? "border-orange bg-orange text-paper"
                    : "border-rule-strong bg-paper text-ink hover:border-ink-soft",
                )}
              >
                {cadenceLabel(c)}
                <span className="opacity-80">
                  · {currency} {p.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Price */}
      <div>
        <div className="font-display text-[36px] text-ink leading-none">
          {currency} {price.toLocaleString()}
        </div>
        <div className="mt-1 text-[12.5px] text-ink-soft">
          {isRecurring
            ? `Billed ${cadenceLabel(cadence).toLowerCase()} · renews automatically`
            : "One-time payment · lifetime access to this level"}
        </div>
      </div>

      <ul className="space-y-2 flex-1">
        {(isPlus ? PLUS_PERKS : PRO_PERKS).map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-[13.5px] text-ink">
            <Check
              size={14}
              className="mt-0.5 text-orange shrink-0"
              strokeWidth={3}
            />
            {perk}
          </li>
        ))}
      </ul>

      {ownsThisTier ? (
        <div className="rounded-xl bg-yellow-soft/60 border border-orange/40 p-3 text-[12.5px] text-ink">
          You already have {isPlus ? "Plus" : "Pro"} on {label(plan.level)}
          {entitlement?.expiresAt && !isPlus
            ? ` — renews ${formatDate(entitlement.expiresAt)}`
            : ""}
        </div>
      ) : null}

      <Button
        block
        size="lg"
        loading={busy}
        onClick={() => onBuy(plan, isRecurring ? cadence : null)}
        leftIcon={<Zap size={16} />}
      >
        {ownsThisTier
          ? "Extend"
          : ownsCurrentLevel
            ? `Switch to ${isPlus ? "Plus" : "Pro"}`
            : isPlus
              ? "Get lifetime access"
              : "Start Pro"}
      </Button>
    </Card>
  );
}

const PLUS_PERKS = [
  "All past papers for this level, forever",
  "All AI-generated explanations",
  "One-time payment — no renewals",
  "Study any subject you pick",
];

const PRO_PERKS = [
  "Everything in Plus, plus…",
  "Unlimited adaptive Quiz sessions",
  "Timed mock exams (3-hour papers)",
  "Level tests against the WAEC syllabus",
  "AI weakness narratives + post-exam breakdown",
];

function isExamType(x: string | undefined): x is ExamType {
  return x === "wassce" || x === "bece" || x === "novdec";
}
function label(x: ExamType): string {
  return x === "wassce" ? "WASSCE" : x === "bece" ? "BECE" : "Nov/Dec";
}
function cadenceLabel(c: Cadence): string {
  return c === "monthly" ? "Monthly" : c === "six_month" ? "6 months" : "Annual";
}
function getCadencePrice(plan: PublicPlan, c: Cadence): number {
  return c === "monthly"
    ? plan.pricing.monthly.price
    : c === "six_month"
      ? plan.pricing.sixMonth.price
      : plan.pricing.annual.price;
}
function getAmountMinor(plan: PublicPlan, c: Cadence | null): number {
  const price =
    plan.paymentKind === "one_time"
      ? plan.pricing.monthly.price
      : getCadencePrice(plan, c ?? "monthly");
  return Math.round(price * 100);
}
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
