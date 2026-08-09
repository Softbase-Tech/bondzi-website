import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { auth } from "@/lib/auth/config";
import {
  listWinnersServer,
  listAllTimeWinnersServer,
} from "@/lib/api/winners";
import type { WinnerRow, AllTimeWinnerRow } from "@/lib/api/types";
import { WinnersView } from "./WinnersView";

export const metadata: Metadata = {
  title: "Hall of Fame",
  description: "Bondzi's top students, week by week and all time.",
};

/**
 * Hall of Fame page. RSC prefetches:
 *   - this week's winners (mobile's "This Week" tab)
 *   - all-time top 20 winners (backend `/winners/all-time`)
 *
 * Client component owns tab state + monthly-on-demand fetch. Backend
 * scopes to caller's examType, so no client param needed.
 */
export default async function WinnersPage() {
  const session = await auth();
  if (!session?.accessToken || !session.user) redirect("/login");

  const [weeklyRes, allTimeRes] = await Promise.allSettled([
    listWinnersServer(session.accessToken, { periodType: "weekly" }),
    listAllTimeWinnersServer(session.accessToken),
  ]);
  const initialWeekly: WinnerRow[] =
    weeklyRes.status === "fulfilled" ? weeklyRes.value : [];
  const initialAllTime: AllTimeWinnerRow[] =
    allTimeRes.status === "fulfilled" ? allTimeRes.value : [];

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <header className="text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-orange text-paper text-[11.5px] font-semibold uppercase tracking-widest">
          <Trophy size={12} />
          Hall of Fame
        </div>
        <h1 className="mt-3 font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Bondzi champions
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          Every week we crown the students who put in the work. XP is
          real — top winners earn spendable XP that unlocks Bondzi Pro.
        </p>
      </header>

      <WinnersView
        currentUserId={session.user.id ?? ""}
        initialWeekly={initialWeekly}
        initialAllTime={initialAllTime}
      />
    </div>
  );
}
