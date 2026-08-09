import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getSubject } from "@/lib/api/subjects";
import { createExam } from "@/lib/api/exams";
import { PastPaperLauncher } from "./PastPaperLauncher";

interface Props {
  params: Promise<{ subjectId: string; year: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subjectId: _s, year } = await params;
  return { title: `Past paper — ${year}` };
}

/**
 * The launcher between "pick a year" and "sit the exam". Renders a
 * summary card + a big Start button. The server action wired into the
 * Start button creates the exam session (`POST /exams`) and redirects
 * to the runner page — so the exam is only paid for by state (a real
 * `exams` row) when the student commits.
 *
 * A student who navigates back before starting doesn't leave orphan
 * sessions in the DB.
 */
export default async function PastPaperLauncherPage({ params }: Props) {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");
  const { subjectId, year } = await params;
  const yearNum = Number.parseInt(year, 10);
  if (!Number.isFinite(yearNum) || yearNum < 1990 || yearNum > 2100) {
    redirect(`/past-papers/${subjectId}`);
  }

  const subject = await getSubject(session.accessToken, subjectId).catch(
    () => null,
  );
  if (!subject) {
    redirect("/past-papers");
  }

  // Server action bound to the launcher's Start button.
  async function start(): Promise<void> {
    "use server";
    const s = await auth();
    if (!s?.accessToken) redirect("/login");
    const exam = await createExam(s.accessToken, {
      mode: "past_paper",
      subjectFilter: {
        subjectIds: [subjectId],
        years: [yearNum],
      },
    });
    redirect(`/exam/${exam.id}`);
  }

  return (
    <PastPaperLauncher
      subjectName={subject.name}
      subjectCode={subject.code}
      year={yearNum}
      onStart={start}
    />
  );
}
