import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listSubjects } from "@/lib/api/subjects";
import { getSelectedSubjectIds } from "@/lib/api/user";
import { intersectWithSelected, hasSelection } from "@/lib/subjects/selected";
import {
  NoSelectedSubjectsCta,
  AddMoreSubjectsLink,
} from "@/components/subjects/SubjectSelectionCta";
import { createExam } from "@/lib/api/exams";
import { PracticeSetup } from "./PracticeSetup";

export const metadata: Metadata = {
  title: "Practice",
  description: "Start a focused practice session on any subject or topic.",
};

/**
 * Practice setup page. Renders a client form that lets the student
 * pick a subject / topic / difficulty / question count, then fires a
 * server action to create the exam and route to /exam/:id.
 *
 * Query-param support:
 *   ?subjectId=…   — pre-select this subject
 *   ?topicId=…     — pre-select this topic (implies its subject)
 *
 * Both are used by the deep-link on the subject detail page's topic
 * list — a tap on a topic drops straight into a practice session
 * with that topic pre-picked.
 */
export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ subjectId?: string; topicId?: string }>;
}) {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");

  const { subjectId, topicId } = await searchParams;

  const [subjectsRes, selectedRes] = await Promise.allSettled([
    listSubjects(session.accessToken, session.profile.examType),
    getSelectedSubjectIds(session.accessToken),
  ]);
  const allSubjects =
    subjectsRes.status === "fulfilled" ? subjectsRes.value : [];
  const selectedIdList =
    selectedRes.status === "fulfilled" ? selectedRes.value : [];
  const studentPicked = hasSelection(selectedIdList);
  const subjects = intersectWithSelected(allSubjects, selectedIdList);

  async function start(input: {
    subjectId: string;
    topicId?: string;
    difficulty: "easy" | "medium" | "hard" | "mixed";
    questionCount: number;
  }): Promise<void> {
    "use server";
    const s = await auth();
    if (!s?.accessToken) redirect("/login");
    const exam = await createExam(s.accessToken, {
      mode: input.topicId ? "topic_drill" : "practice",
      subjectFilter: {
        subjectIds: [input.subjectId],
        ...(input.topicId ? { topicIds: [input.topicId] } : {}),
      },
      questionCount: input.questionCount,
      difficulty: input.difficulty,
    });
    redirect(`/exam/${exam.id}`);
  }

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <div>
        <p className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
          Practice
        </p>
        <h1 className="mt-1 font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Start a session
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          Pick a subject and how many questions. Practice sessions are
          untimed — answer at your own pace.
        </p>
      </div>
      {!studentPicked ? (
        <NoSelectedSubjectsCta />
      ) : (
        <>
          <PracticeSetup
            subjects={subjects}
            initialSubjectId={subjectId ?? null}
            initialTopicId={topicId ?? null}
            onStart={start}
          />
          {subjects.length > 0 ? <AddMoreSubjectsLink /> : null}
        </>
      )}
    </div>
  );
}
