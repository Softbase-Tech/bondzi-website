import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { ExamDateForm } from "./ExamDateForm";

export const metadata: Metadata = {
  title: "Exam date",
};

/**
 * Set / update the student's next-exam date. Backed by
 * `users.target_exam_date` via PATCH /users/me — same endpoint that
 * carries the rest of the whitelisted profile fields. Passing `null`
 * clears the date so the profile countdown falls back to its empty
 * state.
 */
export default async function ExamDatePage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");
  const profile = session.profile;

  return (
    <div className="max-w-[640px] mx-auto space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-soft hover:text-ink transition-colors motion-reduce:transition-none"
      >
        <ArrowLeft size={14} />
        Back to settings
      </Link>

      <header>
        <h1 className="font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Exam date
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          The date we count down to on your profile. Update it whenever
          WAEC publishes final dates.
        </p>
      </header>

      <ExamDateForm profile={profile} />
    </div>
  );
}
