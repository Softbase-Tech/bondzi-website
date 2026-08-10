import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth/config";
import {
  getCurrentPartnerTerms,
  getMyPartner,
  listMyAppeals,
} from "@/lib/api/partner";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { AppealsClient } from "./AppealsClient";

/**
 * Appeals surface. States:
 *
 *   1. Partner is ACTIVE — nothing to appeal, show a "you're all
 *      good" state + a back link.
 *   2. Partner is PENDING — same as (1).
 *   3. Partner is SUSPENDED — show existing appeals + a submit form
 *      IF they haven't used their allocation.
 *   4. Partner is BANNED — read-only history, no submit form (three
 *      strikes done).
 */
export default async function PartnerAppealsPage() {
  const session = await auth();
  const accessToken = session?.accessToken ?? null;
  if (!accessToken) redirect("/login?returnTo=%2Fpartner%2Fappeals");

  const partner = await getMyPartner(accessToken);
  if (!partner) redirect("/partner/register");

  const [appeals, terms] = await Promise.all([
    listMyAppeals(accessToken).catch(() => []),
    getCurrentPartnerTerms(accessToken).catch(() => null),
  ]);

  const maxAppeals = terms?.maxAppeals ?? 3;
  const usedAppeals = appeals.length;
  const openAppeal = appeals.find((a) => a.status === "open") ?? null;
  const canSubmit =
    partner.status === "suspended" && !openAppeal && usedAppeals < maxAppeals;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <Link
          href="/partner/dashboard"
          className="inline-flex items-center gap-1 text-[13px] text-ink-mute hover:text-ink"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
        <p className="kicker mt-2">Appeals</p>
        <h1 className="display text-[28px] sm:text-[36px] mt-1">
          Contest an account decision
        </h1>
        <p className="mt-2 text-ink-soft text-[14px] leading-relaxed max-w-prose">
          If your account was suspended, you can open an appeal. Our
          team reviews and responds by email. You get{" "}
          <strong>{maxAppeals}</strong> appeals in total —
          <strong> {Math.max(0, maxAppeals - usedAppeals)}</strong>{" "}
          remaining. Three denied appeals close the account
          permanently.
        </p>
      </header>

      {partner.status === "active" || partner.status === "pending" ? (
        <Card>
          <CardHeader>
            <h2 className="text-[16px] font-semibold text-ink">
              Nothing to appeal
            </h2>
          </CardHeader>
          <CardBody>
            <p className="text-[14px] text-ink-mute">
              Your account is in good standing. Appeals are only open
              when your account is suspended.
            </p>
          </CardBody>
        </Card>
      ) : null}

      {partner.status === "banned" ? (
        <Card emphasis>
          <CardHeader>
            <h2 className="text-[16px] font-semibold text-ink">
              Account closed
            </h2>
          </CardHeader>
          <CardBody>
            <p className="text-[14px] text-ink-soft leading-relaxed">
              Your account is permanently closed. Any appeals below
              are preserved for reference — new appeals cannot be
              opened.
            </p>
          </CardBody>
        </Card>
      ) : null}

      <AppealsClient
        initialAppeals={appeals}
        canSubmit={canSubmit}
        openAppeal={openAppeal}
      />
    </div>
  );
}
