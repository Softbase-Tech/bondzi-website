"use client";

import { memo } from "react";
import type { LeaderboardRow } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface Props {
  row: LeaderboardRow;
  /**
   * 1-indexed position in the sorted-by-score leaderboard. Trumps
   * whatever `row.rank` the backend sends — some rows arrive with a
   * missing or off-by-one rank field and using the array position is
   * always correct given the client's already-sorted view.
   */
  position: number;
  currentUserId?: string;
}

/**
 * Single leader-list row. Memoised so long lists don't re-render
 * every row when the current user's XP ticks. Highlights the current
 * user with the yellow-soft band + " · You" suffix.
 */
export const LeaderRow = memo(function LeaderRow({
  row,
  position,
  currentUserId,
}: Props) {
  const isYou = row.userId === currentUserId;
  const displayName = row.username ?? row.fullName ?? "Student";
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
        #{position}
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
        {(row.score ?? 0).toLocaleString()} XP
      </span>
    </li>
  );
});

function getInitials(name: string): string {
  if (!name) return "•";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "•";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
