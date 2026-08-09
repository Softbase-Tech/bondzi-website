import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Timer, ClipboardCheck, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getSubject } from "@/lib/api/subjects";
import { getMySubscription, isPro } from "@/lib/api/subscription";
import { Card } from "@/components/ui/Card";
import { MockExamLauncher } from "./MockExamLauncher";

export const metadata: Metadata = {
  title: "Mock exam launcher",
};

/**
 * Per-subject mock exam launcher. No configuration surface on purpose:
 * one button, 40 questions, 3 hours, mixed difficulty — that's what
 * makes it a "mock." The heavy lifting lives in `MockExamLauncher`,
 * which posts to POST /exams with mode='mock_exam' via a server action
 * and hard-redirects into the runner.
 */
export default async function MockExamSubjectPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");

  const [subjectRes, subRes] = await Promise.allSettled([
    getSubject(session.accessToken, subjectId),
    getMySubscription(session.accessToken),
  ]);
  if (subjectRes.status !== "fulfilled") notFound();
  const subject = subjectRes.value;
  const proTier = isPro(subRes.status === "fulfilled" ? subRes.value : null);

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <Link
        href="/mock-exams"
        className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-soft hover:text-ink transition-colors motion-reduce:transition-none"
      >
        <ArrowLeft size={14} />
        All mock exams
      </Link>

      <header>
        <div className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-orange text-paper text-[11.5px] font-semibold uppercase tracking-widest">
          <Sparkles size={12} />
          Pro
        </div>
        <h1 className="mt-3 font-display text-[30px] sm:text-[38px] leading-[1.05] text-ink">
          {subject.name} — Mock exam
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          A timed paper drawn at random from the {subject.name} question
          bank. Once the timer starts, closing the tab does not stop it —
          the paper auto-submits at the deadline.
        </p>
      </header>

      <Card className="p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={<Timer size={16} />} label="Duration" value="3 hours" />
          <Stat icon={<ClipboardCheck size={16} />} label="Questions" value="40" />
          <Stat
            icon={<Sparkles size={16} />}
            label="Difficulty"
            value="Mixed"
          />
        </div>
        <div className="rounded-xl bg-yellow-soft/60 border border-orange/30 p-4">
          <p className="text-[13.5px] leading-relaxed text-ink">
            <strong className="font-semibold">Rules of engagement:</strong>{" "}
            Timer counts down whether the tab is open or not. You can flag
            questions and revisit them. Auto-submit fires the moment 3
            hours pass, whether you&apos;re finished or not.
          </p>
        </div>
        <MockExamLauncher
          subjectId={subject.id}
          subjectName={subject.name}
          pro={proTier}
        />
      </Card>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-xl border border-rule-strong bg-paper">
      <div className="text-ink-mute">{icon}</div>
      <div className="mt-2 text-[11.5px] font-medium uppercase tracking-widest text-ink-mute">
        {label}
      </div>
      <div className="mt-0.5 font-display text-[17px] text-ink">{value}</div>
    </div>
  );
}
