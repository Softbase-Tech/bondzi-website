import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getSubject } from "@/lib/api/subjects";
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

  // Start is client-side so we can catch 403 (entitlement missing for
  // elective subjects) and route the user into the paywall via
  // handlePaywallError — server actions swallow the specific error in
  // production and surface a redacted "Server Components render"
  // message that no user can act on.
  return (
    <PastPaperLauncher
      subjectId={subject.id}
      subjectName={subject.name}
      subjectCode={subject.code}
      examType={subject.examType}
      year={yearNum}
    />
  );
}
