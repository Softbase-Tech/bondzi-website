"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Users } from "lucide-react";
import { listLeaderboard } from "@/lib/api/leaderboard";
import type { LeaderboardPeriodType, LeaderboardRow } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { PodiumCard } from "@/components/leaderboard/PodiumCard";
import { LeaderRow } from "@/components/leaderboard/LeaderRow";
import { MyRankBanner } from "@/components/leaderboard/MyRankBanner";
import { cn } from "@/lib/utils";

interface Props {
  currentUserId: string;
  initialWeekly: LeaderboardRow[];
}

const POLL_MS = 5 * 60_000;
const STALE_MS = 5 * 60_000;

/**
 * Client shell — owns the period tab state + 5min visibility-aware
 * polling. Weekly comes hydrated from the server; monthly fetches on
 * first tab switch (and gets cached the same way).
 *
 * Visibility handling: TanStack Query's `refetchInterval` fires
 * whether or not the tab is visible. To keep parity with mobile
 * (which pauses polling in background), we listen for
 * `visibilitychange` and swap the interval accordingly.
 */
export function LeaderboardView({ currentUserId, initialWeekly }: Props) {
  const [period, setPeriod] = useState<LeaderboardPeriodType>("weekly");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const weekly = useQuery({
    queryKey: ["leaderboard", "weekly"] as const,
    queryFn: () => listLeaderboard({ periodType: "weekly" }),
    initialData: initialWeekly,
    staleTime: STALE_MS,
    refetchInterval: period === "weekly" && visible ? POLL_MS : false,
    refetchIntervalInBackground: false,
  });

  const monthly = useQuery({
    queryKey: ["leaderboard", "monthly"] as const,
    queryFn: () => listLeaderboard({ periodType: "monthly" }),
    enabled: period === "monthly",
    staleTime: STALE_MS,
    refetchInterval: period === "monthly" && visible ? POLL_MS : false,
    refetchIntervalInBackground: false,
  });

  const rows = period === "weekly" ? weekly.data ?? [] : monthly.data ?? [];
  const isLoading =
    period === "weekly" ? weekly.isPending && !weekly.data : monthly.isPending;
  const isEmpty = !isLoading && rows.length === 0;
  const top3 = rows.filter((r) => r.rank <= 3).sort((a, b) => a.rank - b.rank);
  const rest = rows.filter((r) => r.rank > 3);
  const periodLabel = period === "weekly" ? "this week" : "this month";

  return (
    <div className="space-y-6">
      <SegmentedTabs value={period} onChange={setPeriod} />

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-[13.5px] text-ink-soft">Loading leaderboard…</p>
        </Card>
      ) : isEmpty ? (
        <EmptyState periodLabel={periodLabel} />
      ) : (
        <>
          {/* Only render the podium when at least one top-3 rank
              exists. Otherwise the three empty columns read as broken
              UI to a student who's just glancing at the page. */}
          {top3.length > 0 ? (
            <PodiumCard top={top3} currentUserId={currentUserId} />
          ) : null}
          <MyRankBanner
            rows={rows}
            currentUserId={currentUserId}
            periodLabel={periodLabel}
          />
          {rest.length > 0 ? (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-ink-mute" />
                <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
                  Rest of the board
                </div>
                <div className="ml-auto text-[11.5px] text-ink-mute">
                  {rows.length.toLocaleString()} students competing
                </div>
              </div>
              <ul className="space-y-2">
                {rest.map((row) => (
                  <LeaderRow
                    key={row.userId}
                    row={row}
                    currentUserId={currentUserId}
                  />
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      )}

      <div className="text-center">
        <Link
          href="/winners"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-orange hover:text-orange-deep underline underline-offset-4"
        >
          <Trophy size={14} />
          See all winners in the Hall of Fame
        </Link>
      </div>
    </div>
  );
}

function SegmentedTabs({
  value,
  onChange,
}: {
  value: LeaderboardPeriodType;
  onChange: (v: LeaderboardPeriodType) => void;
}) {
  const items: { key: LeaderboardPeriodType; label: string }[] = [
    { key: "weekly", label: "This week" },
    { key: "monthly", label: "This month" },
  ];
  return (
    <div
      role="tablist"
      className="inline-flex p-1 rounded-full bg-yellow-soft/70 border border-rule w-full sm:w-auto"
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
              "flex-1 sm:flex-none h-9 px-4 rounded-full text-[13.5px] font-medium transition-colors motion-reduce:transition-none",
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

function EmptyState({ periodLabel }: { periodLabel: string }) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-soft text-orange mb-3">
        <Trophy size={22} />
      </div>
      <p className="font-display text-[20px] text-ink">
        {capitalise(periodLabel)}&apos;s board just reset
      </p>
      <p className="mt-1.5 text-[13.5px] text-ink-soft max-w-[42ch] mx-auto">
        Be the first to earn XP — every question you answer gets you
        closer to #1.
      </p>
    </Card>
  );
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
