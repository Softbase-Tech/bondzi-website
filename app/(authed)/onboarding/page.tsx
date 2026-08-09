import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listSubjects } from "@/lib/api/subjects";
import { getSelectedSubjectIds } from "@/lib/api/user";
import type { Subject } from "@/lib/api/types";
import { OnboardingSubjectPicker } from "./OnboardingSubjectPicker";

export const metadata: Metadata = {
  title: "Welcome",
  description: "Pick your subjects to start studying.",
};

/**
 * Post-registration onboarding — a proper subject-picker step that
 * seeds `user_subjects` so the dashboard has something to render on
 * first visit. Mirrors mobile's `subject-select.tsx`.
 *
 * Flow decisions:
 *   - Core subjects are pre-selected so a student who taps "Continue"
 *     without changing anything still lands with a sensible default.
 *   - Continue submits + routes to /dashboard.
 *   - "Skip for now" is a low-friction escape that just lands on the
 *     dashboard; if selection stays empty the dashboard empty-state
 *     card prompts them again.
 */
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");
  const profile = session.profile;

  const [subjectsRes, selectedRes] = await Promise.allSettled([
    listSubjects(session.accessToken, profile.examType),
    getSelectedSubjectIds(session.accessToken),
  ]);
  const subjects: Subject[] =
    subjectsRes.status === "fulfilled" ? subjectsRes.value : [];
  const initialSelected: string[] =
    selectedRes.status === "fulfilled" ? selectedRes.value : [];

  const firstName = profile.fullName?.split(" ")[0] ?? "there";

  // If the student has already made a selection (rare — e.g. they hit
  // this route twice), skip the picker entirely so we don't overwrite
  // their choices on a Continue-with-defaults tap.
  if (initialSelected.length > 0) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <header className="text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-orange text-paper flex items-center justify-center mb-4">
          <span className="text-[24px]">🎉</span>
        </div>
        <h1 className="font-display text-[32px] sm:text-[40px] leading-[1.05] text-ink">
          Welcome, {firstName}
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[54ch] mx-auto">
          Pick the subjects you&apos;re preparing for. We&apos;ll narrow
          everything on Bondzi — dashboard, past papers, quiz — to just
          those. You can change your picks anytime under Settings.
        </p>
      </header>

      <OnboardingSubjectPicker
        subjects={subjects}
        initialSelected={initialSelected}
      />
    </div>
  );
}
