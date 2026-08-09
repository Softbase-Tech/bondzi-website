import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenText, ArrowUpRight } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { Card } from "@/components/ui/Card";
import { listSubjects } from "@/lib/api/subjects";
import { getSelectedSubjectIds } from "@/lib/api/user";
import type { Subject } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Subjects",
  description: "Browse subjects for your exam level.",
};

/**
 * Subject browser scoped to the student's registered examType — the
 * backend does the filtering. A BECE student never sees WASSCE-only
 * subjects here, which is the same behaviour as the mobile app.
 * Changing exam type lives in Settings (Phase 7) and rotates the JWT
 * so this page automatically reflects the new set.
 *
 * Subjects the user has explicitly favourited (via
 * `/users/me/subjects`) float to the top. Rest sort alphabetically.
 * A visual "Favourite" chip on the surfaced tiles keeps the reason
 * clear.
 */
export default async function SubjectsPage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) {
    redirect("/login");
  }
  const { accessToken, profile } = session;

  const [subjectsRes, selectedRes] = await Promise.allSettled([
    listSubjects(accessToken, profile.examType),
    getSelectedSubjectIds(accessToken),
  ]);

  const subjects = subjectsRes.status === "fulfilled" ? subjectsRes.value : [];
  const selectedIds =
    selectedRes.status === "fulfilled" ? new Set(selectedRes.value) : new Set<string>();

  const ordered = subjects.slice().sort((a, b) => {
    const aFav = selectedIds.has(a.id) ? 0 : 1;
    const bFav = selectedIds.has(b.id) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    return a.name.localeCompare(b.name);
  });

  // Group under category headings when the backend provides them.
  // Falls back to a flat list when every row's `category` is empty.
  const grouped = groupByCategory(ordered);
  const hasCategories = Object.keys(grouped).length > 1;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
          {profile.examType.toUpperCase()}
        </p>
        <h1 className="mt-1 font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Subjects
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          Everything on your exam. Tap a subject to see topics, past
          questions, and practice sessions.
        </p>
      </section>

      {ordered.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-soft text-orange mb-3">
            <BookOpenText size={22} />
          </div>
          <p className="font-display text-[18px] text-ink">
            No subjects available yet
          </p>
          <p className="mt-1.5 text-[13.5px] text-ink-soft max-w-[42ch] mx-auto">
            The subject list didn&apos;t load. Refresh the page shortly.
          </p>
        </Card>
      ) : hasCategories ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, list]) => (
            <section key={category}>
              <h2 className="font-display text-[18px] sm:text-[20px] text-ink mb-3">
                {category === "__uncategorised__" ? "Other" : category}
              </h2>
              <SubjectGrid subjects={list} selectedIds={selectedIds} />
            </section>
          ))}
        </div>
      ) : (
        <SubjectGrid subjects={ordered} selectedIds={selectedIds} />
      )}
    </div>
  );
}

function SubjectGrid({
  subjects,
  selectedIds,
}: {
  subjects: Subject[];
  selectedIds: Set<string>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((subject) => (
        <Link
          key={subject.id}
          href={`/subjects/${subject.id}`}
          className="group"
        >
          <Card
            interactive
            className="p-5 h-full flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-soft text-orange shrink-0"
                  aria-hidden="true"
                >
                  <BookOpenText size={18} />
                </div>
                {selectedIds.has(subject.id) ? (
                  <span className="inline-flex items-center px-2 h-6 rounded-full bg-orange text-paper text-[10.5px] font-semibold uppercase tracking-wider">
                    Favourite
                  </span>
                ) : null}
              </div>
              <div className="mt-3 font-display text-[19px] leading-tight text-ink group-hover:text-orange-deep transition-colors">
                {subject.name}
              </div>
              <div className="text-[12px] text-ink-mute mt-0.5">
                {subject.code}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[12px] text-ink-mute">
              <span>{(subject.topicCount ?? 0).toLocaleString()} topics</span>
              <span className="inline-flex items-center gap-1 text-ink-soft group-hover:text-orange transition-colors font-semibold">
                Open
                <ArrowUpRight size={13} />
              </span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function groupByCategory<S extends { category?: string | null }>(
  subjects: S[],
): Record<string, S[]> {
  const map: Record<string, S[]> = {};
  for (const s of subjects) {
    const key = s.category && s.category.trim().length > 0
      ? s.category
      : "__uncategorised__";
    (map[key] ??= []).push(s);
  }
  return map;
}
