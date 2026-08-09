import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Coins } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getXpWalletServer, listXpTiersServer } from "@/lib/api/xp";
import type { XpRedemptionTier, XpWalletSnapshot } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { RedeemPanel } from "./RedeemPanel";

export const metadata: Metadata = {
  title: "Redeem XP",
  description: "Trade your XP for days of Bondzi Pro.",
};

/**
 * XP redemption page. Server-fetches the wallet + tier list so the
 * initial paint has the student's spendable XP visible. Client panel
 * handles the confirm sheet + optimistic UI + toast.
 */
export default async function RedeemPage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");

  const [walletRes, tiersRes] = await Promise.allSettled([
    getXpWalletServer(session.accessToken),
    listXpTiersServer(session.accessToken),
  ]);
  const wallet: XpWalletSnapshot | null =
    walletRes.status === "fulfilled" ? walletRes.value : null;
  const tiers: XpRedemptionTier[] =
    tiersRes.status === "fulfilled" ? tiersRes.value : [];

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <Link
        href="/subscription/plans"
        className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-soft hover:text-ink transition-colors motion-reduce:transition-none"
      >
        <ArrowLeft size={14} />
        Back to plans
      </Link>
      <header>
        <div className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-yellow-soft text-orange text-[11.5px] font-semibold uppercase tracking-widest">
          <Coins size={12} />
          XP redemption
        </div>
        <h1 className="mt-3 font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Trade XP for Pro
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          Every question you answer earns XP. Cash it in here for days
          of Bondzi Pro — no card required.
        </p>
      </header>

      {wallet ? (
        <Card className="p-4 border-orange/40 bg-yellow-soft/50">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
                Spendable XP
              </div>
              <div className="mt-0.5 font-display text-[30px] text-ink leading-none">
                {wallet.spendableXp.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
                Level
              </div>
              <div className="mt-0.5 font-display text-[24px] text-ink leading-none">
                {wallet.currentLevel}
              </div>
              <div className="mt-0.5 text-[11.5px] text-ink-mute">
                {wallet.xpToNextLevel.toLocaleString()} XP to next
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <RedeemPanel
        initialSpendableXp={wallet?.spendableXp ?? 0}
        tiers={tiers.filter((t) => t.isActive)}
      />
    </div>
  );
}
