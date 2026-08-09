import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { ApiError } from "@/lib/api/client";
import { getExamSession } from "@/lib/api/exams";
import { ExamRunner } from "@/components/exam/ExamRunner";

interface Props {
  params: Promise<{ examId: string }>;
}

export const metadata: Metadata = {
  title: "Exam",
  robots: { index: false, follow: false },
};

/**
 * The exam runner page. Server fetches the session (so the first
 * paint has real questions, no client waterfall), then hands off to
 * the client `ExamRunner` which owns all interaction.
 *
 * A completed session bounces to the result page — no reason to let
 * the student re-take the same session interactively; they can start
 * a fresh one from the subject page.
 */
export default async function ExamPage({ params }: Props) {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");
  const { examId } = await params;

  let examSession;
  try {
    examSession = await getExamSession(session.accessToken, examId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  if (examSession.completedAt) {
    redirect(`/exam/${examId}/result`);
  }
  if (examSession.abandonedAt) {
    // Abandoned sessions can't be resumed. Route home.
    redirect("/dashboard");
  }

  return <ExamRunner session={examSession} />;
}
