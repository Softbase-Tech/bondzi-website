"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { trackEvent } from "@/lib/analytics";

/**
 * Rendered on /subscription/plans only when the student arrives from
 * onboarding (`?onboarding=1`). One skippable pricing look right after
 * signup, while intent is highest — the escape hatch to the dashboard
 * lives here, so the plans page itself stays unchanged for every other
 * visitor.
 *
 * The mount-time event pairs with `onboarding_plans_skipped` and the
 * existing checkout events to answer the funnel question this step
 * exists for: of students shown pricing at signup, how many buy now,
 * how many skip, and how many of the skippers come back.
 */
export function OnboardingPlansBanner() {
  const router = useRouter();

  useEffect(() => {
    trackEvent("onboarding_plans_viewed");
  }, []);

  const skip = () => {
    trackEvent("onboarding_plans_skipped");
    router.replace("/dashboard");
  };

  return (
    <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div className="flex items-start gap-3 min-w-0">
        <CheckCircle2 size={20} className="text-orange shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[14.5px] font-medium text-ink">
            Your account is ready
          </p>
          <p className="text-[13px] text-ink-soft">
            One last look before you start: this is what Plus and Pro
            unlock. The free plan stays free either way.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={skip}
        className="inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 text-[13.5px] font-medium text-ink-soft hover:text-ink underline underline-offset-4"
      >
        Skip for now, take me to my dashboard
        <ArrowRight size={14} />
      </button>
    </Card>
  );
}
