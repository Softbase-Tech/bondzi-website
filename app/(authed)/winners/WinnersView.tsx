"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { listWinners, listAllTimeWinners } from "@/lib/api/winners";
import type {
  AllTimeWinnerRow,
  LeaderboardPeriodType,
  WinnerRow,
} from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Tab = "weekly" | "monthly" | "all-time";
const STALE_MS = 5 * 60_000;

interface Props {
  currentUserId: string;
  initialWeekly: WinnerRow[];
  initialAllTime: AllTimeWinnerRow[];
}

/**
 * Winners tab shell. Three tabs share a single podium+list template:
 *
 *   - Weekly (hydrated from server)
 *   - Monthly (lazy — fires on tab select)
 *   - All time (hydrated from server, uses AllTimeWinnerRow shape)
 *
 * Ranks are never re-numbered client-side — anti-cheat disqualifiers
 * can leave gaps (backend returns rank=5 with no rank=4). Respect that.
 */
export function WinnersView({
  currentUserId,
  initialWeekly,
  initialAllTime,
}: Props) {
  const [tab, setTab] = useState<Tab>("weekly");

  const weekly = useQuery({
    queryKey: ["winners", "weekly"] as const,
    queryFn: () => listWinners({ periodType: "weekly" }),
    initialData: initialWeekly,
    staleTime: STALE_MS,
  });
  const monthly = useQuery({
    queryKey: ["winners", "monthly"] as const,
    queryFn: () => listWinners({ periodType: "monthly" }),
    enabled: tab === "monthly",
    staleTime: STALE_MS,
  });
  const allTime = useQuery({
    queryKey: ["winners", "all-time"] as const,
    queryFn: () => listAllTimeWinners(),
    initialData: initialAllTime,
    staleTime: STALE_MS,
  });

  return (
    <div className="space-y-6">
      <Tabs value={tab} onChange={setTab} />

      {tab === "weekly" ? (
        <PeriodBoard
          rows={weekly.data ?? []}
          isLoading={weekly.isPending && !weekly.data}
          period="weekly"
          currentUserId={currentUserId}
        />
      ) : null}
      {tab === "monthly" ? (
        <PeriodBoard
          rows={monthly.data ?? []}
          isLoading={monthly.isPending}
          period="monthly"
          currentUserId={currentUserId}
        />
      ) : null}
      {tab === "all-time" ? (
        <AllTimeBoard
          rows={allTime.data ?? []}
          isLoading={allTime.isPending && !allTime.data}
          currentUserId={currentUserId}
        />
      ) : null}
    </div>
  );
}

function Tabs({ value, onChange }: { value: Tab; onChange: (v: Tab) => void }) {
  const items: { key: Tab; label: string }[] = [
    { key: "weekly", label: "This week" },
    { key: "monthly", label: "This month" },
    { key: "all-time", label: "All time" },
  ];
  return (
    <div
      role="tablist"
      className="inline-flex p-1 rounded-full bg-yellow-soft/70 border border-rule w-full"
    >
      {items.map(({ key, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn(
              "flex-1 h-9 px-3 rounded-full text-[13px] font-medium transition-colors motion-reduce:transition-none",
              active
                ? "bg-paper text-ink shadow-sm"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function PeriodBoard({
  rows,
  isLoading,
  period,
  currentUserId,
}: {
  rows: WinnerRow[];
  isLoading: boolean;
  period: LeaderboardPeriodType;
  currentUserId: string;
}) {
  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-[13.5px] text-ink-soft">Loading winners…</p>
      </Card>
    );
  }
  if (rows.length === 0) {
    return <EmptyState period={period} />;
  }
  const top3 = rows.filter((r) => r.rank <= 3).sort((a, b) => a.rank - b.rank);
  const rest = rows.filter((r) => r.rank > 3).sort((a, b) => a.rank - b.rank);

  return (
    <>
      <ShareBanner rows={rows} currentUserId={currentUserId} period={period} />
      <TopThreePodium rows={top3} currentUserId={currentUserId} />
      {rest.length > 0 ? (
        <Card className="p-4">
          <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute mb-3">
            {period === "weekly" ? "Weekly winners" : "Monthly winners"}
          </div>
          <ul className="space-y-2">
            {rest.map((row) => (
              <WinnerRowView
                key={row.id}
                row={row}
                currentUserId={currentUserId}
                period={period}
              />
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}

function AllTimeBoard({
  rows,
  isLoading,
  currentUserId,
}: {
  rows: AllTimeWinnerRow[];
  isLoading: boolean;
  currentUserId: string;
}) {
  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-[13.5px] text-ink-soft">Loading hall of fame…</p>
      </Card>
    );
  }
  if (rows.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-soft text-orange mb-3">
          <Sparkles size={22} />
        </div>
        <p className="font-display text-[20px] text-ink">
          The Hall of Fame opens soon
        </p>
        <p className="mt-1.5 text-[13.5px] text-ink-soft max-w-[42ch] mx-auto">
          Once weekly winners start claiming their XP, their names show
          up here — for good.
        </p>
      </Card>
    );
  }
  return (
    <Card className="p-4">
      <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute mb-3">
        Most weekly wins, all time
      </div>
      <ul className="space-y-2">
        {rows.map((row, i) => {
          const isYou = row.userId === currentUserId;
          const displayName = row.username ?? row.fullName ?? "Student";
          return (
            <li
              key={row.userId}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border border-rule",
                isYou ? "bg-yellow-soft/60 border-orange" : "bg-paper",
              )}
            >
              <span
                className={cn(
                  "shrink-0 w-9 text-right font-display text-[16px]",
                  isYou ? "text-orange" : "text-ink",
                )}
              >
                #{i + 1}
              </span>
              <span
                className={cn(
                  "inline-flex items-center justify-center w-9 h-9 rounded-full text-[12.5px] font-semibold",
                  isYou ? "bg-orange text-paper" : "bg-yellow-soft text-orange",
                )}
                aria-hidden="true"
              >
                {getInitials(displayName)}
              </span>
              <span className="min-w-0 flex-1 text-[14px] font-medium text-ink truncate">
                {displayName}
                {isYou ? (
                  <span className="ml-1.5 text-[11.5px] font-semibold text-orange uppercase tracking-widest">
                    · You
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-right">
                <div className="font-display text-[16px] text-ink leading-none">
                  {row.totalWins.toLocaleString()}
                </div>
                <div className="text-[10.5px] uppercase tracking-widest text-ink-mute leading-none mt-0.5">
                  wins
                </div>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function TopThreePodium({
  rows,
  currentUserId,
}: {
  rows: WinnerRow[];
  currentUserId: string;
}) {
  return (
    <Card className="p-5 space-y-3">
      {rows.map((row) => {
        const isYou = row.userId === currentUserId;
        const displayName = row.username ?? row.userName ?? "Student";
        return (
          <div
            key={row.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl",
              isYou ? "bg-yellow-soft/60 border border-orange" : "bg-yellow-soft/30",
            )}
          >
            <span aria-hidden="true" className="text-[28px] leading-none">
              {MEDAL[row.rank] ?? "🏅"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[17px] leading-tight text-ink truncate">
                {displayName}
                {isYou ? (
                  <span className="ml-1.5 text-[11.5px] font-semibold text-orange uppercase tracking-widest">
                    · You
                  </span>
                ) : null}
              </div>
              <div className="text-[12.5px] text-ink-soft">
                Rank #{row.rank} · {row.xpEarned.toLocaleString()} XP
              </div>
            </div>
            {row.xpIssued ? (
              <span className="shrink-0 text-[10.5px] font-semibold uppercase tracking-widest text-orange">
                Paid out
              </span>
            ) : null}
          </div>
        );
      })}
    </Card>
  );
}

function WinnerRowView({
  row,
  currentUserId,
  period,
}: {
  row: WinnerRow;
  currentUserId: string;
  period: LeaderboardPeriodType;
}) {
  const isYou = row.userId === currentUserId;
  const displayName = row.username ?? row.userName ?? "Student";
  return (
    <li
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border border-rule",
        isYou ? "bg-yellow-soft/60 border-orange" : "bg-paper",
      )}
    >
      <span
        className={cn(
          "shrink-0 w-9 text-right font-display text-[16px]",
          isYou ? "text-orange" : "text-ink",
        )}
      >
        #{row.rank}
      </span>
      <span
        className={cn(
          "inline-flex items-center justify-center w-9 h-9 rounded-full text-[12.5px] font-semibold",
          isYou ? "bg-orange text-paper" : "bg-yellow-soft text-orange",
        )}
        aria-hidden="true"
      >
        {getInitials(displayName)}
      </span>
      <span className="min-w-0 flex-1 text-[14px] font-medium text-ink truncate">
        {displayName}
        {isYou ? (
          <span className="ml-1.5 text-[11.5px] font-semibold text-orange uppercase tracking-widest">
            · You
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-[13.5px] font-semibold text-ink">
        {row.xpEarned.toLocaleString()} XP
      </span>
      {isYou ? (
        <ShareButton row={row} period={period} compact />
      ) : null}
    </li>
  );
}

function ShareBanner({
  rows,
  currentUserId,
  period,
}: {
  rows: WinnerRow[];
  currentUserId: string;
  period: LeaderboardPeriodType;
}) {
  const mine = useMemo(
    () => rows.find((r) => r.userId === currentUserId && r.rank <= 20) ?? null,
    [rows, currentUserId],
  );
  if (!mine) return null;
  return (
    <Card className="p-4 border-orange bg-orange text-paper">
      <div className="flex items-center gap-3">
        <div className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full bg-paper/20">
          <Trophy size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[17px] leading-tight">
            You ranked #{mine.rank} {period === "weekly" ? "this week" : "this month"}
          </div>
          <p className="mt-0.5 text-[13px] text-paper/85">
            Tell your friends — a share earns the bragging rights you
            just paid for in XP.
          </p>
        </div>
        <ShareButton row={mine} period={period} />
      </div>
    </Card>
  );
}

function ShareButton({
  row,
  period,
  compact = false,
}: {
  row: WinnerRow;
  period: LeaderboardPeriodType;
  compact?: boolean;
}) {
  const share = async () => {
    const exam = row.examType.toUpperCase();
    const periodLabel = period === "weekly" ? "week" : "month";
    const text = `I ranked #${row.rank} in the ${exam} leaderboard the ${periodLabel} of ${formatPeriod(row.periodStart, period)} on Bondzi Ghana! 🔥\nhttps://bondzi.online`;
    const nav: (Navigator & { share?: (d: ShareData) => Promise<void> }) | null =
      typeof navigator !== "undefined" ? navigator : null;
    try {
      if (nav?.share) {
        await nav.share({ text });
        return;
      }
      // Web Share API missing (desktop mostly) — fall through to
      // WhatsApp deep link; opens in-app on mobile, web on desktop.
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (err) {
      // User dismissed the native sheet — not an error state we surface.
      if ((err as { name?: string })?.name === "AbortError") return;
      try {
        await nav?.clipboard.writeText(text);
        toast.success("Copied to clipboard — paste and share");
      } catch {
        toast.error("Couldn't open the share sheet. Try again.");
      }
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={share}
        aria-label="Share your rank"
        className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-soft text-orange hover:bg-orange hover:text-paper transition-colors motion-reduce:transition-none"
      >
        <Share2 size={14} />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={share}
      className="shrink-0 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-paper text-orange text-[13.5px] font-medium hover:bg-yellow-soft transition-colors motion-reduce:transition-none"
    >
      <Share2 size={14} />
      Share
    </button>
  );
}

function EmptyState({ period }: { period: LeaderboardPeriodType }) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-soft text-orange mb-3">
        <Trophy size={22} />
      </div>
      <p className="font-display text-[20px] text-ink">
        No {period === "weekly" ? "weekly" : "monthly"} winners yet
      </p>
      <p className="mt-1.5 text-[13.5px] text-ink-soft max-w-[42ch] mx-auto">
        Be the first champion — earn XP now and your name lands here
        when winners are picked.
      </p>
    </Card>
  );
}

function formatPeriod(iso: string, period: LeaderboardPeriodType): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (period === "weekly") {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function getInitials(name: string): string {
  if (!name) return "•";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "•";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
