import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, ArrowUpRight, Calendar } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { ApiError } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { getSubject } from "@/lib/api/subjects";
import { listYears } from "@/lib/api/questions";

interface Props {
  params: Promise<{ subjectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await auth();
  if (!session?.accessToken) return { title: "Past papers" };
  const { subjectId } = await params;
  try {
    const subject = await getSubject(session.accessToken, subjectId);
    return {
      title: `${subject.name} past papers`,
      description: `Every year of ${subject.name} past questions.`,
    };
  } catch {
    return { title: "Past papers" };
  }
}

/**
 * Year picker for a specific subject. Fetches the subject metadata +
 * the distinct years the backend has questions for. Renders a grid of
 * year cards that each deep-link into the launcher page.
 */
export default async function SubjectYearsPage({ params }: Props) {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");
  const { subjectId } = await params;
  const { accessToken } = session;

  const [subjectRes, yearsRes] = await Promise.allSettled([
    getSubject(accessToken, subjectId),
    listYears(accessToken, subjectId),
  ]);

  if (subjectRes.status !== "fulfilled") {
    if (
      subjectRes.reason instanceof ApiError &&
      subjectRes.reason.status === 404
    ) {
      notFound();
    }
    return (
      <div className="max-w-[720px] mx-auto text-center py-16">
        <p className="text-[15px] text-ink-soft">
          Couldn&apos;t load this subject. Refresh and try again.
        </p>
      </div>
    );
  }
  const subject = subjectRes.value;
  const years = yearsRes.status === "fulfilled" ? yearsRes.value : [];
  const sortedYears = years.slice().sort((a, b) => b - a);

  return (
    <div className="space-y-8 max-w-[880px] mx-auto">
      <div>
        <Link
          href="/past-papers"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-mute hover:text-ink transition-colors"
        >
          <ChevronLeft size={14} /> All past papers
        </Link>
      </div>
      <section>
        <p className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
          {subject.examType.toUpperCase()} past papers
        </p>
        <h1 className="mt-1 font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          {subject.name}
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          {sortedYears.length > 0
            ? `${sortedYears.length} year${sortedYears.length === 1 ? "" : "s"} of past questions.`
            : "No past questions published yet for this subject."}
        </p>
      </section>

      {sortedYears.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-soft text-orange mb-3">
            <Calendar size={22} />
          </div>
          <p className="font-display text-[18px] text-ink">
            Nothing here yet
          </p>
          <p className="mt-1.5 text-[13.5px] text-ink-soft">
            The past-paper archive for this subject is still being populated.
            Try a different subject or start a practice session instead.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {sortedYears.map((year) => (
            <Link
              key={year}
              href={`/past-papers/${subject.id}/${year}`}
              className="group"
            >
              <Card
                interactive
                className="p-5 flex flex-col items-start"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-soft text-orange mb-3">
                  <Calendar size={18} />
                </div>
                <div className="font-display text-[26px] leading-none text-ink group-hover:text-orange-deep transition-colors">
                  {year}
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-[12px] text-ink-soft group-hover:text-orange transition-colors font-semibold">
                  Open paper
                  <ArrowUpRight size={13} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
