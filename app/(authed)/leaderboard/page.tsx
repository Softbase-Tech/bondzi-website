import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listLeaderboardServer } from "@/lib/api/leaderboard";
import { LeaderboardView } from "./LeaderboardView";
import type { LeaderboardRow } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "See how you rank in Ghana this week and this month on Bondzi.",
};

/**
 * Leaderboard entry. RSC pre-fetches the weekly board so the page
 * lands with real data; client `LeaderboardView` then wires the
 * Weekly/Monthly tab switcher, 5-min visibility-aware polling, and
 * MyRank + Podium rendering.
 *
 * `examType` is intentionally NOT passed as a client query — backend
 * locks it to the user's account regardless of what we send. Same
 * rule mobile enforces.
 */
export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.accessToken || !session.user) redirect("/login");

  const weeklyRes = await Promise.allSettled([
    listLeaderboardServer(session.accessToken, { periodType: "weekly" }),
  ]);
  const initialWeekly: LeaderboardRow[] =
    weeklyRes[0].status === "fulfilled" ? weeklyRes[0].value : [];

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <header>
        <h1 className="font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Leaderboard
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          See where you stand in Ghana this week. Earn XP by answering
          questions — the board refreshes every Monday morning.
        </p>
      </header>
      <LeaderboardView
        currentUserId={session.user.id ?? ""}
        initialWeekly={initialWeekly}
      />
    </div>
  );
}
