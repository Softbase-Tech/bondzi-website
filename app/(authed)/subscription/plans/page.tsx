import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, Coins, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { listPlansServer } from "@/lib/api/plans";
import {
  getMySubscription,
  listEntitlementsServer,
} from "@/lib/api/subscription";
import { listXpTiersServer } from "@/lib/api/xp";
import type {
  PublicPlan,
  Subscription,
  SubscriptionEntitlement,
  XpRedemptionTier,
} from "@/lib/api/types";
import { PlanPicker } from "./PlanPicker";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Bondzi Pro",
  description:
    "Unlock all past papers, quiz, mock exams and AI explanations on Bondzi.",
};

/**
 * The Plans page — the beating heart of Phase 6. Renders the full
 * catalogue and hands off to the client `PlanPicker` for the
 * interactive checkout.
 *
 * Layout:
 *   - Hero (Pro badge + short pitch)
 *   - Level-scoped plan cards (defaults to student's examType; other
 *     levels rendered below with a "Study another level" heading)
 *   - XP redemption teaser card (deep-links to /subscription/redeem)
 *   - Money-back / support line at the bottom
 */
export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; returnTo?: string }>;
}) {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");
  const params = await searchParams;
  const profile = session.profile;

  const [plansRes, subRes, entRes, tiersRes] = await Promise.allSettled([
    listPlansServer(session.accessToken, profile.countryCode ?? "GH"),
    getMySubscription(session.accessToken),
    listEntitlementsServer(session.accessToken),
    listXpTiersServer(session.accessToken),
  ]);
  const plans: PublicPlan[] =
    plansRes.status === "fulfilled" ? plansRes.value : [];
  const currentSubscription: Subscription | null =
    subRes.status === "fulfilled" ? subRes.value : null;
  const entitlements: SubscriptionEntitlement[] =
    entRes.status === "fulfilled" ? entRes.value : [];
  const xpTiers: XpRedemptionTier[] =
    tiersRes.status === "fulfilled" ? tiersRes.value : [];

  return (
    <div className="max-w-[880px] mx-auto space-y-8">
      <header className="text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-orange text-on-brand text-[11.5px] font-semibold uppercase tracking-widest">
          <Sparkles size={12} />
          Bondzi Pro
        </div>
        <h1 className="mt-3 font-display text-[36px] sm:text-[48px] leading-[1.02] text-ink">
          Everything you need to nail the exam
        </h1>
        <p className="mt-2 text-[15.5px] text-ink-soft max-w-[62ch]">
          All past papers, AI explanations, adaptive quiz, timed mock
          exams, and level tests — unlocked. Pay once for lifetime
          access, subscribe monthly, or redeem your XP.
        </p>
      </header>

      <PlanPicker
        studentEmail={profile.email ?? ""}
        studentExamType={profile.examType}
        currentSubscription={currentSubscription}
        entitlements={entitlements}
        plans={plans}
        preferredLevel={params.level}
        returnTo={params.returnTo}
      />

      {/* XP redemption teaser */}
      {xpTiers.length > 0 ? (
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full bg-yellow-soft text-orange">
              <Coins size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[22px] leading-tight text-ink">
                Redeem your XP for Pro time
              </h2>
              <p className="mt-1 text-[13.5px] text-ink-soft max-w-[60ch]">
                No cash to spare? Trade the XP you&apos;ve earned answering
                questions for days of Pro access — every tier extends
                your subscription instantly.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {xpTiers.slice(0, 3).map((tier) => (
              <div
                key={tier.id}
                className="p-3 rounded-xl border border-rule-strong bg-paper"
              >
                <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
                  {tier.label}
                </div>
                <div className="mt-1 font-display text-[19px] text-ink">
                  {tier.xpCost.toLocaleString()} XP
                </div>
                <div className="text-[12px] text-ink-soft">
                  {tier.creditDays} days of Pro
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/subscription/redeem"
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-orange text-on-brand font-medium text-[14.5px] hover:bg-orange-deep transition-colors motion-reduce:transition-none"
          >
            <Coins size={14} />
            Redeem XP
          </Link>
        </Card>
      ) : null}

      <Card className="p-4 border-rule">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="text-orange shrink-0 mt-0.5" />
          <p className="text-[13px] text-ink-soft leading-relaxed">
            Payments are processed by Paystack — cards, mobile money,
            and bank transfer all supported. Your card details never
            touch Bondzi&apos;s servers.
          </p>
        </div>
      </Card>
    </div>
  );
}
