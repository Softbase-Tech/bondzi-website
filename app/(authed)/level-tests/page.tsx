import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, GraduationCap, ChevronRight, LockKeyhole } from "lucide-react";
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
  title: "Level tests",
  description: "Grade yourself against the WAEC syllabus.",
};

/**
 * Level Test index. Same shape as Mock Exams — pick a subject to drop
 * into the per-subject launcher, which then shows the syllabus-topic
 * chip picker for that subject. Split into two pages so the topic
 * fetch (which is subject-scoped) only fires when the student is
 * actually about to sit a test.
 */
export default async function LevelTestsPage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");
  const profile = session.profile;
  // Backend syllabus topics are keyed by form level — legacy accounts
  // without one land in profile to fill it in rather than seeing an
  // empty state.
  if (!profile.formLevel) redirect("/profile");
  const formLevel: 1 | 2 | 3 = profile.formLevel;
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
      <section>
        <div className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-orange text-paper text-[11.5px] font-semibold uppercase tracking-widest">
          <Sparkles size={12} />
          Pro
        </div>
        <h1 className="mt-3 font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Level tests
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          Test yourself against the WAEC syllabus for Form{" "}
          {formLevel}. Pick a subject, choose the
          syllabus topics you&apos;ve covered, and see where you stand.
        </p>
      </section>

      {!studentPicked ? (
        <NoSelectedSubjectsCta />
      ) : (
      <section className="grid gap-3 sm:grid-cols-2">
        {subjects.length === 0 ? (
          <Card className="p-8 text-center sm:col-span-2">
            <p className="font-display text-[20px] text-ink">
              Level tests are being prepared for {profile.examType.toUpperCase()}
            </p>
            <p className="mt-1.5 text-[13.5px] text-ink-soft">
              You&apos;ll see subjects here as soon as syllabus content
              is available for your form.
            </p>
          </Card>
        ) : (
          subjects.map((s) => (
            <Link
              key={s.id}
              href={`/level-tests/${s.id}`}
              className="group block p-5 rounded-2xl border-2 border-rule-strong bg-paper hover:border-ink-soft transition-colors motion-reduce:transition-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-[19px] leading-tight text-ink">
                    {s.name}
                  </div>
                  <div className="mt-1.5 text-[12.5px] text-ink-soft">
                    Test against Form {formLevel} syllabus
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-[11.5px] text-ink-mute">
                    <GraduationCap size={11} />
                    Adaptive scoring
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
