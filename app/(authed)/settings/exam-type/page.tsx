import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { Card } from "@/components/ui/Card";
import { ExamTypeForm } from "./ExamTypeForm";

export const metadata: Metadata = {
  title: "Exam type",
};

/**
 * Exam-type switch page. Changes here rotate the JWT (backend bakes
 * `examType` + entitlements into it), so the client component
 * updates the NextAuth session in-place with the returned tokens.
 * Also warns about consequences: subject selection resets, board
 * position resets for the new level.
 */
export default async function ExamTypePage() {
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
          Exam type
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          Switch between WASSCE, BECE, and Nov/Dec — content, subjects,
          and leaderboards all follow. You can change this at most 3
          times per hour.
        </p>
      </header>

      <ExamTypeForm profile={profile} />

      <Card className="p-4 border-rule">
        <div className="text-[12.5px] text-ink-soft space-y-2 leading-relaxed">
          <p>
            <strong className="text-ink">Heads up:</strong> switching
            exam type resets your leaderboard entries for the old
            level. Your subject picks, XP, streak, and past attempts
            stay intact — each level keeps its own subject list, so
            switching back restores it.
          </p>
          <p>
            Subscriptions are per-level. Pro on WASSCE does not carry
            over to BECE — you&apos;ll need a separate plan on the
            new level.
          </p>
        </div>
      </Card>
    </div>
  );
}
