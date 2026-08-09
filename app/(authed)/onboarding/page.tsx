import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Welcome",
  description: "You're in. Let's set you up for exam success.",
};

/**
 * Post-registration welcome screen. Deliberately minimal in Phase 1 —
 * confirms sign-up worked and forwards to the dashboard. Phase 2 will
 * expand this into a proper subject-picker + plan-picker wizard
 * (mirroring the mobile onboarding). For now the account is created,
 * the session is live, and there's nothing else blocking the student
 * from browsing.
 */
export default async function OnboardingPage() {
  const session = await auth();
  const firstName = session?.profile?.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-[520px] mx-auto text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-orange text-paper flex items-center justify-center mb-6 shadow-[0_10px_28px_-12px_rgba(212,75,26,0.5)]">
        <span className="text-[28px] font-display">🎉</span>
      </div>
      <h1 className="font-display text-[36px] leading-tight text-ink">
        Welcome to Bondzi, {firstName}
      </h1>
      <p className="mt-3 text-[16px] text-ink-soft">
        Your account is ready. Bondzi is the exam-prep app for Ghanaian
        students — nine years of past questions, AI explanations for every
        wrong answer, and revision that adapts to you.
      </p>
      <div className="mt-8">
        <Button href="/dashboard" size="lg" block>
          Take me to the dashboard
        </Button>
      </div>
    </div>
  );
}
