import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowUpRight,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Flag,
  MessageSquareText,
  Sparkles,
  Timer,
} from "lucide-react";
import { auth } from "@/lib/auth/config";
import { ApiError } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getSubject } from "@/lib/api/subjects";
import { listYears } from "@/lib/api/questions";
import { listPmTestSubjects } from "@/lib/api/pm-test";
import { getSubjectProgress } from "@/lib/api/user";
import { getWeaknessServer } from "@/lib/api/weakness";

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
      description: `Practise ${subject.name} — past papers, quiz, and mock exam.`,
    };
  } catch {
    return { title: "Subject" };
  }
}

/**
 * Subject-hub page — matches the mobile app layout exactly:
 *
 *   • Three mode rows, always in this order: Past papers, Quiz,
 *     Mock exam. Each is hidden when the underlying pool has nothing
 *     to serve, and Mock exam mirrors Past papers (the mock draws
 *     from the past-paper bank, so if there are zero past papers
 *     there's no mock either).
 *   • When ALL three modes are empty, a rich "Coming soon" panel
 *     replaces the mode card and offers three alternatives:
 *     browse other subjects, take an AI Quiz on a ready subject,
 *     or ask us to prioritise this subject via support.
 *
 * Drops the old "Practise this subject" CTA — mobile has no such
 * flow and the standalone /practice route family is being retired
 * to keep parity across surfaces.
 */
export default async function SubjectDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.accessToken || !session.profile) {
    redirect("/login");
  }
  const { id } = await params;
  const { accessToken, profile } = session;

  const [subjectRes, yearsRes, pmSubjectsRes, progressRes, weaknessRes] =
    await Promise.allSettled([
      getSubject(accessToken, id),
      listYears(accessToken, id),
      listPmTestSubjects(accessToken),
      getSubjectProgress(accessToken),
      getWeaknessServer(accessToken, id),
    ]);

  if (subjectRes.status !== "fulfilled") {
    if (
      subjectRes.reason instanceof ApiError &&
      subjectRes.reason.status === 404
    ) {
      notFound();
    }
    return (
      <SubjectLoadError
        message={
          subjectRes.reason instanceof Error
            ? subjectRes.reason.message
            : "Couldn't load the subject."
        }
      />
    );
  }
  const subject = subjectRes.value;
  const years = yearsRes.status === "fulfilled" ? yearsRes.value : [];
  const pmSubjects =
    pmSubjectsRes.status === "fulfilled" ? pmSubjectsRes.value : [];
  const progressList =
    progressRes.status === "fulfilled" ? progressRes.value : [];
  const progress = progressList.find((p) => p.subjectId === subject.id) ?? null;
  const accuracyPct = progress ? Math.round(progress.accuracy * 100) : null;
  const examMismatch = subject.examType !== profile.examType;
  const pastAttempted = progress?.questionsAnswered ?? 0;

  // Availability of each practice mode — identical rules to the
  // mobile subject hub (`mobile/app/subject/[subjectId].tsx`).
  //   Past papers → gated on the subject's past-paper question count.
  //   Quiz        → gated on /pm-test/subjects' activeQuestionCount for this subject.
  //   Mock exam   → depends on Past papers (that's the pool it draws from).
  //
  // NOVDEC / JHS users never see Quiz (matches mobile). We derive
  // the flag from schoolLevel; NOVDEC is a separate examType.
  const pmSummary = pmSubjects.find((s) => s.subjectId === subject.id) ?? null;
  const isNovdec = subject.examType === "novdec";
  const isJhs = profile.schoolLevel === "jhs";
  const hasPastPapers = (subject.questionCount ?? 0) > 0;
  const hasQuiz =
    !isNovdec && !isJhs && (pmSummary?.activeQuestionCount ?? 0) > 0;
  const hasMock = hasPastPapers;
  const noModesAvailable = !hasPastPapers && !hasQuiz && !hasMock;

  // Weakest topics rail — same source of truth the mobile subject
  // hub uses. Merge past-paper + syllabus weak topics, sort by
  // accuracy ASC, cap at 3. If the weakness endpoint failed or the
  // student has no attempts yet, the section quietly drops off.
  const weakness =
    weaknessRes.status === "fulfilled" ? weaknessRes.value : null;
  const weakTopics = weakness
    ? [
        ...weakness.pastPaperWeakTopics.map((t) => ({
          id: t.topicId,
          title: t.title,
          accuracy: t.accuracy,
        })),
        ...weakness.syllabusWeakTopics.map((t) => ({
          id: t.syllabusTopicId,
          title: t.title,
          accuracy: t.accuracy,
        })),
      ]
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3)
    : [];

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
              <> · {subject.topicCount.toLocaleString()} topics</>
            ) : null}
            {typeof subject.questionCount === "number" ? (
              <> · {subject.questionCount.toLocaleString()} questions</>
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

      {noModesAvailable ? (
        <ComingSoonPanel subjectName={subject.name} />
      ) : null}

      {!noModesAvailable ? (
        <Card className="p-0 overflow-hidden">
          <ul className="divide-y divide-rule">
            {hasPastPapers ? (
              <ModeRow
                icon={<BookOpenText size={20} />}
                title="Past papers"
                subtitle={
                  years.length > 0
                    ? `${years.length} year${years.length === 1 ? "" : "s"} · ${pastAttempted} answered`
                    : "Real exam questions by topic or year"
                }
                href={`/past-papers?subjectId=${encodeURIComponent(subject.id)}`}
              />
            ) : null}
            {hasQuiz ? (
              <ModeRow
                icon={<Sparkles size={20} />}
                title="Quiz"
                subtitle="Fresh AI-generated questions · daily quota"
                href={`/quiz?subjectId=${encodeURIComponent(subject.id)}`}
              />
            ) : null}
            {hasMock ? (
              <ModeRow
                icon={<Timer size={20} />}
                title="Mock exam"
                subtitle={
                  isNovdec
                    ? "50 questions · 3 hours · NOVDEC conditions"
                    : "50 questions · 3 hours · exam conditions"
                }
                href={`/mock-exams?subjectId=${encodeURIComponent(subject.id)}`}
              />
            ) : null}
          </ul>
        </Card>
      ) : null}

      {weakTopics.length > 0 ? (
        <section>
          <p className="text-[12px] font-medium uppercase tracking-widest text-ink-mute mb-3">
            Weakest topics
          </p>
          <div className="space-y-3">
            {weakTopics.map((t) => (
              <WeakTopicRow
                key={t.id}
                title={t.title}
                accuracy={t.accuracy}
              />
            ))}
          </div>
          <Link
            href={`/past-papers?subjectId=${encodeURIComponent(subject.id)}&focusWeak=1`}
            className="mt-3 inline-block text-[15px] font-nunito-bold text-orange hover:text-orange-deep"
          >
            Drill these {weakTopics.length} topic
            {weakTopics.length === 1 ? "" : "s"} →
          </Link>
        </section>
      ) : null}
    </div>
  );
}

/**
 * Weak-topic row with a semantic bar colour, same palette as mobile
 * subject-hub: red for accuracy < 25%, amber < 60%, muted otherwise.
 */
function WeakTopicRow({
  title,
  accuracy,
}: {
  title: string;
  accuracy: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(accuracy * 100)));
  const bg =
    accuracy < 0.25 ? "#FF4365" : accuracy < 0.6 ? "#EF9F27" : "#94A3B8";
  return (
    <div className="flex items-center gap-3">
      <p className="flex-1 font-nunito-bold text-[15px] text-ink truncate">
        {title}
      </p>
      <div className="w-20 h-[5px] rounded-full bg-rule overflow-hidden">
        <div style={{ width: `${pct}%`, height: 5, background: bg }} />
      </div>
      <p className="w-11 text-right font-nunito-bold text-[13px] text-ink-mute">
        {pct}%
      </p>
    </div>
  );
}

/**
 * Neutral row layout — the three practice modes are ranked
 * equivalent, so no one gets the orange accent. Mobile applies the
 * same rule; the accent is reserved for the Continue card (added
 * later once we surface examsService.resume() on web).
 */
function ModeRow({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-4 px-5 py-4 hover:bg-yellow-soft/40 transition-colors motion-reduce:transition-none group"
      >
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-yellow-soft text-orange-deep shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-nunito-bold text-[17px] text-ink">{title}</div>
          <div className="text-[13px] text-ink-mute mt-0.5">{subtitle}</div>
        </div>
        <ChevronRight
          size={18}
          className="text-ink-mute group-hover:text-orange transition-colors shrink-0"
        />
      </Link>
    </li>
  );
}

/**
 * Rich empty state — mirrors mobile's ComingSoonPanel exactly. If a
 * subject has nothing across all three modes, the student doesn't
 * get a blank canvas. They see:
 *   1. A friendly acknowledgement panel.
 *   2. Three concrete alternatives (browse other subjects, take an
 *      AI Quiz on a ready subject, ask us to prioritise via
 *      support).
 * No fake ETAs.
 */
function ComingSoonPanel({ subjectName }: { subjectName: string }) {
  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8 border-orange/30 bg-orange/5 text-center">
        <div className="mx-auto inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-soft text-orange-deep mb-3">
          <BookOpenText size={26} />
        </div>
        <p className="font-display text-[22px] sm:text-[26px] text-ink">
          {subjectName} is on the way
        </p>
        <p className="mt-2 text-[14px] text-ink-soft max-w-[56ch] mx-auto">
          We&apos;re still building the question bank for {subjectName}. Past
          papers are being digitised and AI Quiz questions are being generated
          and reviewed. You&apos;ll see them here the moment the first batch is
          ready.
        </p>
      </Card>

      <div>
        <p className="text-[12px] font-medium uppercase tracking-widest text-ink-mute mb-3">
          In the meantime
        </p>
        <Card className="p-0 overflow-hidden">
          <ul className="divide-y divide-rule">
            <AltRow
              icon={<BookOpenText size={20} />}
              title="Browse other subjects"
              subtitle="Most subjects are ready — pick another and keep the streak alive."
              href="/subjects"
            />
            <AltRow
              icon={<Sparkles size={20} />}
              title="Take an AI Quiz on a ready subject"
              subtitle="Fresh questions daily on subjects you've already picked."
              href="/quiz"
            />
            <AltRow
              icon={<MessageSquareText size={20} />}
              title="Ask us to prioritise this subject"
              subtitle="Send a note through Support — we prioritise the ones students ask for."
              href={`/help?subject=${encodeURIComponent(`Please add ${subjectName}`)}`}
              rightIcon={<Flag size={14} />}
            />
          </ul>
        </Card>
      </div>
    </div>
  );
}

function AltRow({
  icon,
  title,
  subtitle,
  href,
  rightIcon,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
  rightIcon?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-4 px-5 py-4 hover:bg-yellow-soft/40 transition-colors motion-reduce:transition-none group"
      >
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-yellow-soft text-orange-deep shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-nunito-bold text-[15px] text-ink">{title}</div>
          <div className="text-[13px] text-ink-mute mt-0.5">{subtitle}</div>
        </div>
        {rightIcon ?? (
          <ArrowUpRight
            size={16}
            className="text-ink-mute group-hover:text-orange transition-colors shrink-0"
          />
        )}
      </Link>
    </li>
  );
}

function SubjectLoadError({ message }: { message: string }) {
  return (
    <Card className="p-8 text-center">
      <p className="font-display text-[20px] text-ink">
        Couldn&apos;t load subject
      </p>
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
