import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, Timer, ChevronRight, LockKeyhole } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { listSubjects } from "@/lib/api/subjects";
import { getMySubscription, isPro } from "@/lib/api/subscription";
import { getSelectedSubjectIds } from "@/lib/api/user";
import { intersectWithSelected, hasSelection } from "@/lib/subjects/selected";
import {
  NoSelectedSubjectsCta,
  AddMoreSubjectsLink,
} from "@/components/subjects/SubjectSelectionCta";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Mock exams",
  description: "Timed practice papers under real exam conditions.",
};

/**
 * Mock exam entry. Lists every subject the student can sit a timed
 * mock in — the actual timer/config lives on the [subjectId] launcher.
 * Kept intentionally list-shaped (not the topic-drill setup UI) since
 * mock exams are deliberately non-configurable: 50 questions, 3 hours,
 * mixed difficulty. That's the whole point.
 */
export default async function MockExamsPage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");
  const profile = session.profile;

  const [subjectsRes, subRes, selectedRes] = await Promise.allSettled([
    listSubjects(session.accessToken, profile.examType),
    getMySubscription(session.accessToken),
    getSelectedSubjectIds(session.accessToken),
  ]);
  const allSubjects =
    subjectsRes.status === "fulfilled" ? subjectsRes.value : [];
  const selectedIdList =
    selectedRes.status === "fulfilled" ? selectedRes.value : [];
  const studentPicked = hasSelection(selectedIdList);
  const subjects = intersectWithSelected(allSubjects, selectedIdList);
  const proTier = isPro(subRes.status === "fulfilled" ? subRes.value : null);

  return (
    <div className="max-w-[880px] mx-auto space-y-8">
      <section className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-orange text-on-brand text-[11.5px] font-semibold uppercase tracking-widest">
            <Sparkles size={12} />
            Pro
          </div>
          <h1 className="mt-3 font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
            Mock exams
          </h1>
          <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
            Sit a full 3-hour paper under real exam conditions. When the
            timer ends the paper auto-submits and you get a marked
            breakdown with AI explanations on every wrong answer.
          </p>
        </div>
      </section>

      {!studentPicked ? (
        <NoSelectedSubjectsCta />
      ) : (
      <section className="grid gap-3 sm:grid-cols-2">
        {subjects.length === 0 ? (
          <Card className="p-8 text-center sm:col-span-2">
            <p className="font-display text-[20px] text-ink">
              Mock exams are being prepared for {profile.examType.toUpperCase()}
            </p>
            <p className="mt-1.5 text-[13.5px] text-ink-soft">
              You&apos;ll see subjects here as soon as they&apos;re ready.
            </p>
          </Card>
        ) : (
          subjects.map((s) => (
            <Link
              key={s.id}
              href={`/mock-exams/${s.id}`}
              className="group block p-5 rounded-2xl border-2 border-rule-strong bg-paper hover:border-ink-soft transition-colors motion-reduce:transition-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-[19px] leading-tight text-ink">
                    {s.name}
                  </div>
                  <div className="mt-1.5 text-[12.5px] text-ink-soft">
                    {typeof s.questionCount === "number"
                      ? `${s.questionCount.toLocaleString()} questions in bank`
                      : "Question bank ready"}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-[11.5px] text-ink-mute">
                    <span className="inline-flex items-center gap-1">
                      <Timer size={11} />
                      3 hr
                    </span>
                    <span>40 questions</span>
                    <span>Mixed difficulty</span>
                  </div>
                </div>
                <div
                  className="shrink-0 mt-1 text-ink-mute group-hover:text-ink transition-colors motion-reduce:transition-none"
                  aria-hidden="true"
                >
                  {proTier ? <ChevronRight size={20} /> : <LockKeyhole size={18} />}
                </div>
              </div>
            </Link>
          ))
        )}
      </section>
      )}
      {studentPicked && subjects.length > 0 ? <AddMoreSubjectsLink /> : null}
    </div>
  );
}
