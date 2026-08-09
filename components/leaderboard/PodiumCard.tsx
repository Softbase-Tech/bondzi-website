"use client";

import { Crown } from "lucide-react";
import type { LeaderboardRow } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface Props {
  top: LeaderboardRow[];
  currentUserId?: string;
}

/**
 * Top-3 podium. Gold column is tallest and centered on all breakpoints;
 * silver and bronze flank it. Visual is deliberately sparse (no
 * gradients or shadows) to keep the paper/cream feel — the win is
 * conveyed by the rank crown + column height.
 */
export function PodiumCard({ top, currentUserId }: Props) {
  const gold = top.find((r) => r.rank === 1) ?? null;
  const silver = top.find((r) => r.rank === 2) ?? null;
  const bronze = top.find((r) => r.rank === 3) ?? null;

  return (
    <div className="grid grid-cols-3 items-end gap-3 sm:gap-4">
      <Column entry={silver} tone="silver" height={92} currentUserId={currentUserId} />
      <Column entry={gold} tone="gold" height={124} currentUserId={currentUserId} showCrown />
      <Column entry={bronze} tone="bronze" height={78} currentUserId={currentUserId} />
    </div>
  );
}

const TONES = {
  gold: {
    bg: "bg-yellow-soft",
    ring: "ring-orange",
    text: "text-orange-deep",
  },
  silver: {
    bg: "bg-rule/60",
    ring: "ring-ink-mute",
    text: "text-ink-soft",
  },
  bronze: {
    bg: "bg-yellow-soft/50",
    ring: "ring-orange/50",
    text: "text-orange",
  },
};

function Column({
  entry,
  tone,
  height,
  currentUserId,
  showCrown = false,
}: {
  entry: LeaderboardRow | null;
  tone: keyof typeof TONES;
  height: number;
  currentUserId?: string;
  showCrown?: boolean;
}) {
  const t = TONES[tone];
  const displayName = entry
    ? entry.username ?? entry.fullName ?? "Student"
    : "—";
  const initials = getInitials(displayName);
  const isYou = entry?.userId === currentUserId;

  return (
    <div className="flex flex-col items-center gap-2">
      {showCrown ? (
        <Crown size={22} className="text-orange" aria-hidden="true" />
      ) : (
        <div className="h-[22px]" aria-hidden="true" />
      )}
      <div
        className={cn(
          "inline-flex items-center justify-center w-14 h-14 rounded-full ring-2 font-semibold text-[16px]",
          t.bg,
          t.ring,
          t.text,
        )}
      >
        {initials}
      </div>
      <div className="text-center max-w-full px-1">
        <div className="font-display text-[14.5px] leading-tight text-ink truncate">
          {displayName}
          {isYou ? " · You" : ""}
        </div>
        <div className="text-[12px] text-ink-soft font-semibold">
          {entry ? `${entry.score.toLocaleString()} XP` : "—"}
        </div>
      </div>
      <div
        className={cn(
          "w-full rounded-t-2xl flex items-start justify-center pt-2 font-display text-[18px] font-medium",
          t.bg,
          t.text,
        )}
        style={{ height }}
      >
        {entry ? `#${entry.rank}` : ""}
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  if (!name || name === "—") return "•";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "•";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
