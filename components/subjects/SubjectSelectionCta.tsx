import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";

/**
 * Empty-state card shown when the student has no subjects picked yet.
 * Every subject listing surface renders this in place of the usual
 * grid — the "one shared empty state" pattern means we don't drift
 * copy across Dashboard / Subjects / Past Papers / etc.
 */
export function NoSelectedSubjectsCta({
  href = "/settings/subjects",
}: {
  href?: string;
}) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-soft text-orange mb-3">
        <BookOpen size={22} />
      </div>
      <p className="font-display text-[20px] text-ink">
        Pick the subjects you&apos;re preparing for
      </p>
      <p className="mt-1.5 text-[13.5px] text-ink-soft max-w-[42ch] mx-auto">
        We&apos;ll narrow everything on Bondzi — dashboard, past papers,
        quizzes — to just those subjects. You can change your picks
        anytime.
      </p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl bg-orange text-paper font-medium text-[14.5px] hover:bg-orange-deep transition-colors motion-reduce:transition-none"
      >
        <BookOpen size={14} />
        Choose subjects
      </Link>
    </Card>
  );
}

/**
 * Slim "Add more subjects" link, rendered at the bottom of a filtered
 * list so students always know how to expand their focus.
 */
export function AddMoreSubjectsLink({
  href = "/settings/subjects",
  label = "Add more subjects",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <div className="pt-1 text-center">
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-orange hover:text-orange-deep underline underline-offset-4"
      >
        <Plus size={13} />
        {label}
      </Link>
    </div>
  );
}
