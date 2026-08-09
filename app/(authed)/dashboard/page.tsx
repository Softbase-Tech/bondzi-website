import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Bondzi home — pick up where you left off.",
};

/**
 * PHASE 1 STUB — this is the "we're in" landing page. Confirms auth
 * completed, greets the student, and previews what Phase 2 will fill
 * in. Real dashboard (streak, XP, subject cards, daily-goal progress)
 * lives here in Phase 2.
 */
export default async function DashboardPage() {
  const session = await auth();
  const profile = session?.profile;
  const firstName = profile?.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <section>
        <p className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
          Dashboard
        </p>
        <h1 className="mt-2 font-display text-[36px] sm:text-[44px] leading-[1.05] text-ink">
          Hi {firstName}, welcome to Bondzi
        </h1>
        <p className="mt-3 text-[16px] text-ink-soft max-w-[62ch]">
          You&apos;re signed in. The full dashboard — streak tracker, subject
          cards, past-paper picker, AI explanations — is being built now and
          will land here shortly.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card interactive className="p-5">
          <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
            Streak
          </div>
          <div className="mt-2 font-display text-[36px] leading-none text-ink">
            {profile?.streakDays ?? 0}
          </div>
          <div className="mt-1 text-[13px] text-ink-soft">day streak</div>
        </Card>
        <Card interactive className="p-5">
          <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
            Level
          </div>
          <div className="mt-2 font-display text-[36px] leading-none text-ink">
            {profile?.currentLevel ?? 1}
          </div>
          <div className="mt-1 text-[13px] text-ink-soft">
            {(profile?.levelXp ?? 0).toLocaleString()} XP
          </div>
        </Card>
        <Card interactive className="p-5 sm:col-span-2 lg:col-span-1">
          <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
            Preparing for
          </div>
          <div className="mt-2 font-display text-[36px] leading-none text-ink uppercase">
            {profile?.examType ?? "—"}
          </div>
          <div className="mt-1 text-[13px] text-ink-soft">
            {profile?.formLevel
              ? `${profile.examType === "bece" ? "JHS" : "SHS"} Form ${profile.formLevel}`
              : "Level yet to set"}
          </div>
        </Card>
      </section>

      <section>
        <h2 className="font-display text-[22px] text-ink mb-3">
          Under construction
        </h2>
        <p className="text-[15px] text-ink-soft max-w-[62ch]">
          Phase 2 brings the subject browser, past-paper year picker, and
          practice session engine. Phase 3 wires up the exam runner and
          AI explanations. In the meantime, feel free to explore your{" "}
          <Link
            href="/profile"
            className="font-semibold text-orange hover:text-orange-deep transition-colors"
          >
            profile
          </Link>{" "}
          or head back to the{" "}
          <Link
            href="/"
            className="font-semibold text-orange hover:text-orange-deep transition-colors"
          >
            marketing site
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
