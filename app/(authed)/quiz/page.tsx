import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { listPmTestSubjects } from "@/lib/api/pm-test";
import { createExam } from "@/lib/api/exams";
import { getMySubscription, isPro } from "@/lib/api/subscription";
import { QuizPicker } from "./QuizPicker";

export const metadata: Metadata = {
  title: "Quiz",
  description: "Fresh AI-generated questions on your weakest topics.",
};

/**
 * Quiz — adaptive AI-generated questions (mobile calls this "PM Test").
 * Pro-gated feature: preview is public (students see the subject
 * summaries + the tease copy), but the Start action pops a paywall
 * for free-tier users.
 *
 * Server pre-loads:
 *   - subject summaries for THIS student (backend scopes to the
 *     user's examType + active pm_test question pool)
 *   - subscription so we know whether to gate the start action
 */
export default async function QuizPage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");
  const profile = session.profile;

  const [subjectsRes, subRes] = await Promise.allSettled([
    listPmTestSubjects(session.accessToken),
    getMySubscription(session.accessToken),
  ]);

  const subjects = subjectsRes.status === "fulfilled" ? subjectsRes.value : [];
  const subscription = subRes.status === "fulfilled" ? subRes.value : null;
  const proTier = isPro(subscription);

  async function start(input: {
    subjectId: string;
    questionCount: number;
    difficulty: "easy" | "medium" | "hard" | "mixed";
  }): Promise<void> {
    "use server";
    const s = await auth();
    if (!s?.accessToken) redirect("/login");
    const exam = await createExam(s.accessToken, {
      mode: "pm_test",
      subjectFilter: {
        subjectIds: [input.subjectId],
      },
      questionCount: input.questionCount,
      // Backend accepts difficulty only when explicit; omit 'mixed'.
      ...(input.difficulty === "mixed" ? {} : { difficulty: input.difficulty }),
    });
    redirect(`/exam/${exam.id}`);
  }

  return (
    <div className="max-w-[880px] mx-auto space-y-8">
      <section className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-orange text-paper text-[11.5px] font-semibold uppercase tracking-widest">
            <Sparkles size={12} />
            Pro
          </div>
          <h1 className="mt-3 font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
            Quiz me
          </h1>
          <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
            Bondzi AI writes fresh questions matched to your exam and your
            weakest topics — every session, brand new. Answers come with
            step-by-step explanations.
          </p>
        </div>
      </section>

      <QuizPicker
        subjects={subjects}
        pro={proTier}
        examType={profile.examType}
        onStart={start}
      />
    </div>
  );
}
