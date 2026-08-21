import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Timer, Trophy } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { Card } from "@/components/ui/Card";
import { listExamHistory, type ExamHistoryRow } from "@/lib/api/exams";
import { listSubjects } from "@/lib/api/subjects";

export const metadata: Metadata = {
  title: "Session history",
  description: "Every exam session you've completed on Bondzi.",
};

/**
 * Session history — mirrors the mobile /practice/history screen.
 * Lists completed exam sessions grouped by day, with a resume link
 * for any in-progress session. Uses the same /exams/history
 * endpoint as mobile.
 *
 * Deliberately server-rendered — history is read-mostly and
 * pagination is rare in practice. Pagination-by-query-string keeps
 * the component simple; a "Load more" client control lives in a
 * future iteration.
 */
export default async function SessionHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");
  const { accessToken } = session;
  const params = await searchParams;
  const page = params.page ? Math.max(1, parseInt(params.page, 10) || 1) : 1;
  const limit = 25;

  const [historyRes, subjectsRes] = await Promise.allSettled([
    listExamHistory(accessToken, { status: "completed", page, limit }),
    listSubjects(accessToken),
  ]);

  const history =
    historyRes.status === "fulfilled"
      ? historyRes.value
      : { items: [], total: 0, nextCursor: null };
  const subjects =
    subjectsRes.status === "fulfilled" ? subjectsRes.value : [];
  const subjectName = (id: string) =>
    subjects.find((s) => s.id === id)?.name ?? "";

  const groups = groupByDay(history.items);
  const hasMore = history.total > page * limit;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-mute hover:text-ink transition-colors"
        >
          <ChevronLeft size={14} /> Profile
        </Link>
      </div>

      <section>
        <h1 className="font-display text-[32px] sm:text-[40px] leading-[1.05] text-ink">
          Session history
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          Every exam session you&apos;ve completed. Tap a row to review it.
        </p>
      </section>

      {history.items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-display text-[20px] text-ink">
            No sessions yet
          </p>
          <p className="mt-2 text-[13.5px] text-ink-soft max-w-[52ch] mx-auto">
            Finish an exam and it&apos;ll show up here — score, time, XP, and
            a link to the review.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="text-[12px] font-medium uppercase tracking-widest text-ink-mute mb-3">
                {g.label}
              </h2>
              <Card className="p-0 overflow-hidden">
                <ul className="divide-y divide-rule">
                  {g.rows.map((row) => (
                    <SessionRow
                      key={row.id}
                      row={row}
                      subjectName={subjectName}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-between text-[13px]">
          {page > 1 ? (
            <Link
              href={`/sessions?page=${page - 1}`}
              className="text-ink-mute hover:text-ink"
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          {hasMore ? (
            <Link
              href={`/sessions?page=${page + 1}`}
              className="text-ink-mute hover:text-ink"
            >
              Older →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}

function SessionRow({
  row,
  subjectName,
}: {
  row: ExamHistoryRow;
  subjectName: (id: string) => string;
}) {
  const percent = row.percentScore
    ? Number(row.percentScore).toFixed(0)
    : row.score !== null && row.totalQuestions
      ? Math.round((row.score / row.totalQuestions) * 100).toString()
      : null;
  const modeLabel = row.mode.replace(/_/g, " ");
  const durationLabel = row.durationSeconds
    ? formatDuration(row.durationSeconds)
    : null;
  const primarySubject = row.subjectIds[0]
    ? subjectName(row.subjectIds[0])
    : "";

  return (
    <li>
      <Link
        href={`/exam/${encodeURIComponent(row.id)}/result`}
        className="flex items-center gap-4 px-5 py-4 hover:bg-yellow-soft/40 transition-colors motion-reduce:transition-none group"
      >
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-yellow-soft text-orange-deep shrink-0">
          {row.mode === "mock_exam" ? (
            <Timer size={20} />
          ) : (
            <Trophy size={20} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-nunito-bold text-[15px] text-ink truncate">
            {primarySubject || "Exam"}
            <span className="ml-2 text-[12px] text-ink-mute uppercase">
              {modeLabel}
            </span>
          </div>
          <div className="text-[13px] text-ink-mute mt-0.5">
            {row.score !== null && row.totalQuestions
              ? `${row.score} of ${row.totalQuestions}`
              : "—"}
            {durationLabel ? ` · ${durationLabel}` : ""}
          </div>
        </div>
        {percent !== null ? (
          <div className="font-display text-[20px] text-ink shrink-0">
            {percent}
            <span className="text-[13px] text-ink-mute">%</span>
          </div>
        ) : null}
        <ChevronRight
          size={16}
          className="text-ink-mute group-hover:text-orange transition-colors shrink-0"
        />
      </Link>
    </li>
  );
}

interface DayGroup {
  label: string;
  rows: ExamHistoryRow[];
}

/**
 * Group rows by completed-at day (falls back to startedAt). Buckets:
 * Today / Yesterday / short date ("Mon 12 Feb").
 */
function groupByDay(rows: ExamHistoryRow[]): DayGroup[] {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yyyymmdd = (d: Date) => d.toISOString().slice(0, 10);
  const todayKey = yyyymmdd(today);
  const yesterdayKey = yyyymmdd(yesterday);

  const buckets = new Map<string, DayGroup>();
  for (const row of rows) {
    const iso = row.completedAt ?? row.startedAt;
    const key = iso.slice(0, 10);
    const label =
      key === todayKey
        ? "Today"
        : key === yesterdayKey
          ? "Yesterday"
          : new Date(iso).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
    if (!buckets.has(key)) buckets.set(key, { label, rows: [] });
    buckets.get(key)!.rows.push(row);
  }
  return Array.from(buckets.values());
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
