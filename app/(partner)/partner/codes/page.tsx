import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getMyPartner, listMyReferralCodes } from "@/lib/api/partner";
import { CodesClient } from "./CodesClient";

export default async function PartnerCodesPage() {
  const session = await auth();
  const accessToken = session?.accessToken ?? null;
  if (!accessToken) redirect("/login?returnTo=%2Fpartner%2Fcodes");

  const partner = await getMyPartner(accessToken);
  if (!partner) redirect("/partner/register");

  const codes = await listMyReferralCodes(accessToken).catch(() => []);
  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Referral codes</p>
        <h1 className="display text-[28px] sm:text-[36px] mt-1">
          Your codes
        </h1>
        <p className="mt-2 text-ink-soft text-[14px] leading-relaxed max-w-prose">
          Create as many codes as you like — one per campaign, per
          channel, per audience. Every code you create is tied to your
          account. Codes stay active forever unless you deactivate them;
          the default code cannot be deactivated so you always have at
          least one live.
        </p>
      </header>
      <CodesClient
        initialCodes={codes}
        canManage={partner.status !== "banned"}
      />
    </div>
  );
}
