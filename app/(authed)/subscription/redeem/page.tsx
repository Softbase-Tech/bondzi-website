import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Coins,
  Flame,
  Sparkles,
  Trophy,
} from "lucide-react";
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

      <section className="mt-2">
        <p className="text-[12px] font-medium uppercase tracking-widest text-ink-mute mb-3">
          How XP works
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <EarnRule
            icon={<CheckCircle2 size={18} />}
            title="Answer a question"
            body="+10 XP for a past-paper correct answer, +15 XP for a Quiz correct answer. Streaks add a small daily bonus."
          />
          <EarnRule
            icon={<Trophy size={18} />}
            title="Finish an exam"
            body="Completion XP is scaled by your accuracy on that exam. A perfect score adds a flat bonus."
          />
          <EarnRule
            icon={<Flame size={18} />}
            title="Keep your streak"
            body="Answering at least one question a day keeps the streak alive. Longer streaks compound your earn rate."
          />
          <EarnRule
            icon={<Sparkles size={18} />}
            title="Refer a friend"
            body="Once they answer 10 questions your referral qualifies and you both get bonus XP."
          />
        </div>
        <p className="mt-4 text-[12.5px] text-ink-mute">
          Redeeming spends from your{" "}
          <span className="font-semibold text-ink">spendable XP</span>. It
          does not affect your{" "}
          <span className="font-semibold text-ink">level XP</span> — you
          keep the streak, the level, and the leaderboard rank.
        </p>
      </section>
    </div>
  );
}

function EarnRule({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-yellow-soft text-orange-deep shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="font-nunito-bold text-[14px] text-ink">{title}</div>
          <div className="text-[13px] text-ink-mute mt-0.5">{body}</div>
        </div>
      </div>
    </Card>
  );
}
