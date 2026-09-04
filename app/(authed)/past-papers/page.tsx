import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenText, ArrowUpRight } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { Card } from "@/components/ui/Card";
import { listSubjects } from "@/lib/api/subjects";
import { getSelectedSubjectIds } from "@/lib/api/user";
import { intersectWithSelected, hasSelection } from "@/lib/subjects/selected";
import {
  NoSelectedSubjectsCta,
  AddMoreSubjectsLink,
} from "@/components/subjects/SubjectSelectionCta";

export const metadata: Metadata = {
  title: "Past papers",
  description: "Browse WAEC past papers by subject and year.",
};

/**
 * Past-paper subject browser — first step of a two-step flow:
 *   1. /past-papers                     → pick a subject (this page)
 *   2. /past-papers/[subjectId]         → pick a year
 *   3. /past-papers/[subjectId]/[year]  → launcher → creates exam,
 *                                          routes to /exam/:id
 *
 * Filters to the student's exam type. Same query the /subjects page
 * uses; the only reason we don't share a component is the copy /
 * routing differ enough that a shared abstraction would obscure both.
 */
export default async function PastPapersPage({
  searchParams,
}: {
  searchParams: Promise<{ subjectId?: string }>;
}) {
  const session = await auth();
  if (!session?.accessToken || !session.profile) {
    redirect("/login");
  }
  const { accessToken, profile } = session;
  const { subjectId } = await searchParams;

  // Deep-link support: if a subjectId was passed (e.g. from the
  // "Past papers" link on a subject detail page), skip this picker
  // and go straight to the year picker.
  if (subjectId) {
    redirect(`/past-papers/${encodeURIComponent(subjectId)}`);
  }

  const [subjectsRes, selectedRes] = await Promise.allSettled([
    listSubjects(accessToken, profile.examType),
    getSelectedSubjectIds(accessToken),
  ]);
  const subjects = subjectsRes.status === "fulfilled" ? subjectsRes.value : [];
  const selectedIdList =
    selectedRes.status === "fulfilled" ? selectedRes.value : [];
  const studentPicked = hasSelection(selectedIdList);
  const sorted = intersectWithSelected(subjects, selectedIdList)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <section>
        <p className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
          {profile.examType.toUpperCase()} past papers
        </p>
        <h1 className="mt-1 font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Thirty-four years of WAEC papers
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          Pick a subject to see every year with past questions. Each
          paper opens as a timed exam — with AI explanations on every
          wrong answer for Pro students.
        </p>
      </section>

      {!studentPicked ? (
        <NoSelectedSubjectsCta />
      ) : sorted.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-soft text-orange mb-3">
            <BookOpenText size={22} />
          </div>
          <p className="font-display text-[18px] text-ink">
            Subjects unavailable
          </p>
          <p className="mt-1.5 text-[13.5px] text-ink-soft">
            Refresh the page in a moment.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((subject) => (
              <Link
                key={subject.id}
                href={`/past-papers/${subject.id}`}
                className="group"
              >
                <Card
                  interactive
                  className="p-5 h-full flex flex-col justify-between"
                >
                  <div>
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-soft text-orange mb-3">
                      <BookOpenText size={18} />
                    </div>
                    <div className="font-display text-[19px] leading-tight text-ink group-hover:text-orange-deep transition-colors">
                      {subject.name}
                    </div>
                    <div className="text-[12px] text-ink-mute mt-0.5">
                      {subject.code}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[12px] text-ink-mute">
                    <span>
                      {(subject.questionCount ?? 0).toLocaleString()} questions
                    </span>
                    <span className="inline-flex items-center gap-1 text-ink-soft group-hover:text-orange transition-colors font-semibold">
                      Pick a year
                      <ArrowUpRight size={13} />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          <AddMoreSubjectsLink />
        </>
      )}
    </div>
  );
}
