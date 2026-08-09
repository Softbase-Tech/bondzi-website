import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Gift } from "lucide-react";
import { auth } from "@/lib/auth/config";
import {
  getMyReferralStatsServer,
  listMyReferralEventsServer,
} from "@/lib/api/referrals";
import type { ReferralEvent, ReferralStats } from "@/lib/api/types";
import { ReferralPanel } from "./ReferralPanel";

export const metadata: Metadata = {
  title: "Share & earn XP",
  description: "Invite friends to Bondzi — you both earn XP.",
};

/**
 * Referral hub. Backend awards XP automatically on:
 *   - signup (both parties, when the invitee registers with the code)
 *   - qualification (referrer only, once the invitee answers >= 10 Qs)
 *
 * We just show the state — no direct XP actions from this page.
 */
export default async function ReferralPage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");

  const [statsRes, eventsRes] = await Promise.allSettled([
    getMyReferralStatsServer(session.accessToken),
    listMyReferralEventsServer(session.accessToken),
  ]);

  // Referral code is always present on the SafeUser too — use it as a
  // last-resort fallback so the page still renders during a transient
  // /referrals/me failure.
  const stats: ReferralStats =
    statsRes.status === "fulfilled"
      ? statsRes.value
      : {
          referralCode: session.profile.referralCode,
          referredCount: 0,
          qualifiedCount: 0,
          pendingCount: 0,
          referralQualified: session.profile.referralQualified,
        };
  const events: ReferralEvent[] =
    eventsRes.status === "fulfilled" ? eventsRes.value : [];

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <header>
        <div className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-orange text-paper text-[11.5px] font-semibold uppercase tracking-widest">
          <Gift size={12} />
          Refer &amp; earn
        </div>
        <h1 className="mt-3 font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Share Bondzi, earn XP
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          Send your code to a friend. When they sign up you both get
          bonus XP; when they get serious about studying, you get more.
        </p>
      </header>
      <ReferralPanel stats={stats} events={events} />
    </div>
  );
}
