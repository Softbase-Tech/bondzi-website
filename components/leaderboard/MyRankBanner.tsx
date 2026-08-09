"use client";

import { Trophy, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { LeaderboardRow } from "@/lib/api/types";

interface Props {
  rows: LeaderboardRow[];
  currentUserId: string;
  periodLabel: string;
}

/**
 * Shows the current student's rank + how much XP to the next slot.
 * When the user isn't on the list yet, prompts them to earn XP to
 * appear.
 *
 * All derivation is client-side (from the list we already fetched) so
 * we skip the extra `/leaderboard/my-rank` call when the user is
 * inside the top-100 window.
 */
export function MyRankBanner({ rows, currentUserId, periodLabel }: Props) {
  const mine = rows.find((r) => r.userId === currentUserId) ?? null;

  if (!mine) {
    return (
      <Card className="p-4 border-orange/40 bg-yellow-soft/50">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5 inline-flex items-center justify-center w-9 h-9 rounded-full bg-orange text-paper">
            <Trophy size={16} />
          </div>
          <div className="min-w-0">
            <div className="font-display text-[16px] text-ink">
              Not on the {periodLabel} board yet
            </div>
            <p className="text-[13px] text-ink-soft mt-0.5">
              Answer a few questions to earn XP — you&apos;ll show up here
              as soon as the board picks you up.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const above = rows.find((r) => r.rank === mine.rank - 1) ?? null;
  const xpGap = above ? Math.max(0, above.score - mine.score + 1) : 0;
  const topPercentile =
    rows.length > 0 ? Math.max(1, Math.round((mine.rank / rows.length) * 100)) : null;

  return (
    <Card className="p-4 border-orange/40 bg-yellow-soft/50">
      <div className="flex items-center gap-3">
        <div className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full bg-orange text-paper">
          <Trophy size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[16.5px] text-ink">
            You&apos;re #{mine.rank}{" "}
            <span className="text-ink-soft font-normal text-[13.5px]">
              {periodLabel} · {mine.score.toLocaleString()} XP
            </span>
          </div>
          {above ? (
            <div className="mt-0.5 text-[12.5px] text-ink-soft inline-flex items-center gap-1">
              <TrendingUp size={12} />
              {xpGap.toLocaleString()} XP to reach #{mine.rank - 1}
            </div>
          ) : (
            <div className="mt-0.5 text-[12.5px] font-medium text-orange">
              You&apos;re at the top — hold the line!
            </div>
          )}
        </div>
        {topPercentile !== null ? (
          <div className="shrink-0 text-right">
            <div className="text-[10.5px] font-medium uppercase tracking-widest text-ink-mute">
              Top
            </div>
            <div className="font-display text-[18px] text-ink">
              {topPercentile}%
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
