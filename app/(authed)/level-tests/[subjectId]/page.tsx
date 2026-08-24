import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getSubject } from "@/lib/api/subjects";
import { listSyllabusTopics } from "@/lib/api/syllabus";
import { getMySubscription, isPro } from "@/lib/api/subscription";
import { LevelTestPicker } from "./LevelTestPicker";

export const metadata: Metadata = {
  title: "Level test",
};

/**
 * Per-subject Level Test setup. The interesting UI is the syllabus-
 * topic chip picker in `LevelTestPicker`; this page mostly wires the
 * server action + prefetches the topics list. Backend scopes syllabus
 * topics to the student's form level so we don't need to filter here.
 */
export default async function LevelTestSubjectPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");
  const profile = session.profile;
  if (!profile.formLevel) redirect("/profile");
  const formLevel: 1 | 2 | 3 = profile.formLevel;

  const [subjectRes, topicsRes, subRes] = await Promise.allSettled([
    getSubject(session.accessToken, subjectId),
    listSyllabusTopics(session.accessToken, {
      subjectId,
      examType: profile.examType,
      formLevel,
    }),
    getMySubscription(session.accessToken),
  ]);
  if (subjectRes.status !== "fulfilled") notFound();
  const subject = subjectRes.value;
  const topics = topicsRes.status === "fulfilled" ? topicsRes.value : [];
  const proTier = isPro(subRes.status === "fulfilled" ? subRes.value : null);

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <Link
        href="/level-tests"
        className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-soft hover:text-ink transition-colors motion-reduce:transition-none"
      >
        <ArrowLeft size={14} />
        All level tests
      </Link>

      <header>
        <div className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-orange text-paper text-[11.5px] font-semibold uppercase tracking-widest">
          <Sparkles size={12} />
          Pro
        </div>
        <h1 className="mt-3 font-display text-[30px] sm:text-[38px] leading-[1.05] text-ink">
          {subject.name} — Level test
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          Pick the syllabus topics you&apos;ve already covered in class
          — Bondzi builds a graded test on exactly those topics. You
          get a per-topic breakdown so you know where to spend the
          next study session.
        </p>
      </header>

      <LevelTestPicker
        subjectId={subject.id}
        subjectName={subject.name}
        examType={subject.examType}
        formLevel={formLevel}
        topics={topics}
        pro={proTier}
      />
    </div>
  );
}
