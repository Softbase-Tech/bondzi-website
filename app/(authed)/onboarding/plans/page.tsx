import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listPlansServer } from "@/lib/api/plans";
import type { PublicPlan } from "@/lib/api/types";
import { OnboardingPlansStep } from "./OnboardingPlansStep";

export const metadata: Metadata = {
  title: "Choose your plan",
  description: "Start free, or unlock the full AI tutor.",
};

/**
 * Onboarding step 2 — one skippable pricing look right after subject
 * selection, while signup intent is highest. Deliberately NOT the
 * full /subscription/plans catalogue: this screen shows only the
 * student's own exam level, one price per tier, pay-now or skip.
 *
 * Checkout here is the same initiate → Paystack popup → verify flow
 * PlanPicker runs (shared helpers in lib/paystack.ts and
 * lib/api/subscription.ts), so there is exactly one payment pipeline.
 * If the plan fetch fails, we skip the step entirely rather than
 * show an empty pricing screen.
 */
export default async function OnboardingPlansPage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");
  const profile = session.profile;

  let plans: PublicPlan[] = [];
  try {
    plans = await listPlansServer(
      session.accessToken,
      profile.countryCode ?? "GH",
    );
  } catch {
    redirect("/dashboard");
  }

  const levelPlans = plans.filter(
    (p) => p.level === profile.examType && p.isDefault,
  );
  const plus = levelPlans.find((p) => p.account === "plus") ?? null;
  const pro = levelPlans.find((p) => p.account === "pro") ?? null;
  if (!plus && !pro) redirect("/dashboard");

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <header className="text-center">
        <h1 className="font-display text-[32px] sm:text-[40px] leading-[1.05] text-ink">
          One last thing
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[54ch] mx-auto">
          Your account is ready and the free plan is yours forever. Here is
          what the paid tiers add, if you want the full toolkit from day
          one.
        </p>
      </header>

      <OnboardingPlansStep
        studentEmail={profile.email ?? ""}
        plus={plus}
        pro={pro}
      />
    </div>
  );
}
