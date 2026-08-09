import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookOpenText, ArrowUpRight, ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { ApiError } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getSubject, listSubjectTopics } from "@/lib/api/subjects";
import { getSubjectProgress } from "@/lib/api/user";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await auth();
  if (!session?.accessToken) {
    return { title: "Subject" };
  }
  const { id } = await params;
  try {
    const subject = await getSubject(session.accessToken, id);
    return {
      title: subject.name,
      description: `Practice ${subject.name} — topics, past questions, and AI explanations.`,
    };
  } catch {
    return { title: "Subject" };
  }
}

/**
 * Subject detail page. Shows the topic list, the student's current
 * accuracy on this subject (from progress endpoint), and quick-links
 * to practise / past-papers scoped to this subject.
 *
 * The practise / past-papers destinations exist as routes but their
 * detail pages land in Phase 3 (practice sessions + past-paper
 * browser). Linking here now future-proofs the entry points — a
 * student who taps "Practise this subject" today lands on a stub
 * that'll be alive shortly.
 */
export default async function SubjectDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.accessToken || !session.profile) {
    redirect("/login");
  }
  const { id } = await params;
  const { accessToken, profile } = session;

  const [subjectRes, topicsRes, progressRes] = await Promise.allSettled([
    getSubject(accessToken, id),
    listSubjectTopics(accessToken, id),
    getSubjectProgress(accessToken),
  ]);

  if (subjectRes.status !== "fulfilled") {
    // 404 on the subject means either a bad id or the user doesn't
    // have access under their examType. Either way it's a not-found
    // from the user's perspective.
    if (
      subjectRes.reason instanceof ApiError &&
      subjectRes.reason.status === 404
    ) {
      notFound();
    }
    // For non-404 failures (5xx, timeout) render an error state
    // rather than the notFound page — it's a transient problem, not
    // a wrong URL.
    return (
      <SubjectLoadError message={
        subjectRes.reason instanceof Error
          ? subjectRes.reason.message
          : "Couldn't load the subject."
      } />
    );
  }
  const subject = subjectRes.value;
  const topics = topicsRes.status === "fulfilled" ? topicsRes.value : [];
  const progressList =
    progressRes.status === "fulfilled" ? progressRes.value : [];
  const progress = progressList.find((p) => p.subjectId === subject.id) ?? null;
  const accuracyPct = progress ? Math.round(progress.accuracy * 100) : null;
  // Backend scopes to user.examType, so this equality is a paranoia
  // check — a mismatch means someone's linking across levels.
  const examMismatch = subject.examType !== profile.examType;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-mute hover:text-ink transition-colors"
        >
          <ChevronLeft size={14} /> All subjects
        </Link>
      </div>

      <section className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
            {subject.examType.toUpperCase()}
            {subject.category ? ` · ${subject.category}` : ""}
          </p>
          <h1 className="mt-1 font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
            {subject.name}
          </h1>
          <p className="mt-2 text-[15px] text-ink-soft">
            Code <span className="font-semibold text-ink">{subject.code}</span>
            {typeof subject.topicCount === "number" ? (
              <>
                {" "}
                · {subject.topicCount.toLocaleString()} topics
              </>
            ) : null}
            {typeof subject.questionCount === "number" ? (
              <>
                {" "}
                · {subject.questionCount.toLocaleString()} questions
              </>
            ) : null}
          </p>
        </div>
        {progress && progress.questionsAnswered > 0 ? (
          <Card className="p-4 sm:p-5 sm:min-w-[220px]">
            <div className="text-[12px] font-medium uppercase tracking-widest text-ink-mute">
              Your accuracy
            </div>
            <div className="mt-1 font-display text-[36px] leading-none text-ink">
              {accuracyPct}
              <span className="text-[20px] text-ink-soft">%</span>
            </div>
            <div className="mt-1 text-[12px] text-ink-mute">
              {progress.questionsAnswered.toLocaleString()} answered
            </div>
          </Card>
        ) : null}
      </section>

      {examMismatch ? (
        <Card className="p-4 border-orange/40">
          <p className="text-[13.5px] text-ink">
            This subject isn&apos;t on your current exam. Switch exam type in
            settings to unlock it.
          </p>
        </Card>
      ) : null}

      {/* Action row */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Button
          href={`/practice?subjectId=${encodeURIComponent(subject.id)}`}
          block
          size="lg"
          rightIcon={<ArrowUpRight size={16} />}
        >
          Practise this subject
        </Button>
        <Button
          href={`/past-papers?subjectId=${encodeURIComponent(subject.id)}`}
          block
          size="lg"
          variant="outline"
          rightIcon={<ArrowUpRight size={16} />}
        >
          Past papers
        </Button>
        <Button
          href="/quiz"
          block
          size="lg"
          variant="ghost"
          rightIcon={<ArrowUpRight size={16} />}
        >
          Quiz me
        </Button>
      </section>

      {/* Topics */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-[22px] sm:text-[26px] text-ink">
            Topics
          </h2>
          {topics.length > 0 ? (
            <span className="text-[12.5px] text-ink-mute">
              {topics.length.toLocaleString()} in this subject
            </span>
          ) : null}
        </div>
        {topics.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-soft text-orange mb-3">
              <BookOpenText size={22} />
            </div>
            <p className="font-display text-[18px] text-ink">
              Topics coming soon
            </p>
            <p className="mt-1.5 text-[13.5px] text-ink-soft max-w-[42ch] mx-auto">
              The topic list for this subject isn&apos;t published yet. In the
              meantime you can practise directly or open the past papers
              browser.
            </p>
          </Card>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-paper overflow-hidden">
            {topics.map((topic, idx) => (
              <li key={topic.id}>
                <Link
                  href={`/practice?subjectId=${encodeURIComponent(subject.id)}&topicId=${encodeURIComponent(topic.id)}`}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-yellow-soft/40 transition-colors motion-reduce:transition-none group"
                >
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-yellow-soft text-orange-deep text-[13px] font-semibold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[15px] text-ink truncate">
                      {topic.title}
                    </div>
                    {topic.description ? (
                      <div className="text-[12.5px] text-ink-mute truncate">
                        {topic.description}
                      </div>
                    ) : null}
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-ink-mute group-hover:text-orange transition-colors shrink-0"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SubjectLoadError({ message }: { message: string }) {
  return (
    <Card className="p-8 text-center">
      <p className="font-display text-[20px] text-ink">Couldn&apos;t load subject</p>
      <p className="mt-2 text-[13.5px] text-ink-soft max-w-[52ch] mx-auto">
        {message}. Try refreshing, or go back to the subjects list.
      </p>
      <div className="mt-4 flex justify-center">
        <Button href="/subjects" variant="outline">
          Back to subjects
        </Button>
      </div>
    </Card>
  );
}
