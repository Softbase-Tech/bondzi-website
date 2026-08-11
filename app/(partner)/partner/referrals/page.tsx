import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import {
  getMyPartner,
  listMyReferralCodes,
  listMyReferrals,
} from "@/lib/api/partner";
import type { PartnerReferralSort } from "@/lib/api/types";
import { ReferralsClient } from "./ReferralsClient";

/**
 * Per-user + per-code referrals view — who signed up under which code,
 * how engaged they are, whether they've paid Plus, and what commission
 * you've earned from them.
 *
 * Server-renders the initial slice (default sort = most recent) so the
 * partner sees data on first paint. Filter and sort controls live in
 * the client component; each change re-fetches from the API rather
 * than shuffling in-memory so the totals block matches the visible
 * rows for every filter combination.
 */
export default async function PartnerReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ codeId?: string; sort?: PartnerReferralSort }>;
}) {
  const session = await auth();
  const accessToken = session?.accessToken ?? null;
  if (!accessToken) {
    redirect("/partner/signin?returnTo=%2Fpartner%2Freferrals");
  }

  const partner = await getMyPartner(accessToken);
  if (!partner) redirect("/partner/register");

  const params = await searchParams;
  const codeId = typeof params.codeId === "string" ? params.codeId : undefined;
  const sort: PartnerReferralSort =
    params.sort === "engaged" || params.sort === "earning"
      ? params.sort
      : "recent";

  const [codes, initial] = await Promise.all([
    listMyReferralCodes(accessToken).catch(() => []),
    listMyReferrals(accessToken, { codeId, sort }).catch(() => ({
      items: [],
      totals: {
        totalReferrals: 0,
        activeUsers: 0,
        paidPlus: 0,
        earnedGhs: "0.00",
        paidGhs: "0.00",
      },
    })),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Referrals</p>
        <h1 className="display text-[28px] sm:text-[36px] mt-1">
          Who you&apos;ve referred
        </h1>
        <p className="mt-2 text-ink-soft text-[14px] leading-relaxed max-w-prose">
          Every student who signed up with one of your codes. Filter by
          code to see how each channel is performing, and sort by earnings
          or engagement to find your top referrals. We only show
          usernames — no full names, emails, or phone numbers — so your
          referrals&apos; privacy stays intact.
        </p>
      </header>

      <ReferralsClient
        initial={initial}
        codes={codes}
        initialCodeId={codeId}
        initialSort={sort}
      />
    </div>
  );
}
