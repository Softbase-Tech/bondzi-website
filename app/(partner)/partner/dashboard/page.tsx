import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Coins,
  ReceiptText,
  Tag as TagIcon,
  ShieldAlert,
} from "lucide-react";
import { auth } from "@/lib/auth/config";
import {
  getMyPartner,
  getMyPayoutPreview,
  listMyPayouts,
  listMyReferralCodes,
} from "@/lib/api/partner";
import type {
  PartnerPayout,
  PartnerReferralCode,
} from "@/lib/api/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { CopyCodeButton } from "@/components/partner/CopyCodeButton";

/**
 * Partner overview.
 *
 * Reads five things server-side + renders them into a mobile-first
 * grid:
 *   - Partner profile   (status pill, welcome copy)
 *   - Live payout preview (approved-and-unpaid total)
 *   - Default referral code (copyable, above-the-fold)
 *   - Recent payouts (last 3)
 *   - Suspended banner if fraud flags kicked in
 */
export default async function PartnerDashboardPage() {
  const session = await auth();
  const accessToken = session?.accessToken ?? null;
  if (!accessToken) redirect("/partner/signin?returnTo=%2Fpartner%2Fdashboard");

  const partner = await getMyPartner(accessToken);
  if (!partner) redirect("/partner/register");

  const [preview, codes, payouts] = await Promise.all([
    getMyPayoutPreview(accessToken).catch(() => ({
      partnerId: partner.id,
      totalGhs: "0.00",
      commissionCount: 0,
      commissions: [],
    })),
    listMyReferralCodes(accessToken).catch(() => [] as PartnerReferralCode[]),
    listMyPayouts(accessToken).catch(() => [] as PartnerPayout[]),
  ]);

  const defaultCode = codes.find((c) => c.isDefault) ?? codes[0] ?? null;
  const recentPayouts = payouts.slice(0, 3);
  const paidTotal = payouts
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amountGhs), 0);

  const isSuspended = partner.status === "suspended";
  const isBanned = partner.status === "banned";
  const isPending = partner.status === "pending";

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <p className="kicker">Partner dashboard</p>
        <h1 className="display text-[32px] sm:text-[40px] mt-1">
          Welcome, {partner.fullName.split(" ")[0]}
        </h1>
        <div className="mt-2">
          <StatusPill status={partner.status} />
        </div>
      </header>

      {isBanned ? (
        <Card emphasis>
          <CardBody className="flex items-start gap-3">
            <ShieldAlert
              size={20}
              className="text-red-600 shrink-0 mt-0.5"
            />
            <div>
              <p className="font-semibold text-ink">Account banned</p>
              <p className="mt-1 text-[13px] text-ink-soft leading-relaxed">
                Your partner account has been banned and outstanding
                commissions have been forfeited. Contact support if you
                believe this was in error.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : isSuspended ? (
        <Card emphasis>
          <CardBody className="flex items-start gap-3">
            <ShieldAlert
              size={20}
              className="text-orange-deep shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink">
                Account under review
              </p>
              <p className="mt-1 text-[13px] text-ink-soft leading-relaxed">
                Your account is temporarily suspended while we review
                recent activity. Payouts are paused. If you believe
                this was in error, open an appeal.
              </p>
              <Link
                href="/partner/appeals"
                className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-orange hover:text-orange-deep"
              >
                Open an appeal <ArrowRight size={14} />
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : isPending ? (
        <Card>
          <CardBody className="flex items-start gap-3">
            <ShieldAlert
              size={20}
              className="text-orange shrink-0 mt-0.5"
            />
            <div>
              <p className="font-semibold text-ink">Pending approval</p>
              <p className="mt-1 text-[13px] text-ink-soft leading-relaxed">
                Your code works immediately — share it away. Earnings
                accrue but payouts unlock once we approve your account.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        aria-label="Partner stats"
      >
        <StatTile
          Icon={Coins}
          label="Ready to pay out"
          value={`GHS ${preview.totalGhs}`}
          hint={`${preview.commissionCount} commission${
            preview.commissionCount === 1 ? "" : "s"
          } waiting`}
        />
        <StatTile
          Icon={ReceiptText}
          label="Paid to you (lifetime)"
          value={`GHS ${paidTotal.toFixed(2)}`}
          hint={`${payouts.filter((p) => p.status === "paid").length} payout${
            payouts.filter((p) => p.status === "paid").length === 1 ? "" : "s"
          }`}
        />
        <StatTile
          Icon={TagIcon}
          label="Referral codes"
          value={String(codes.length)}
          hint={`${codes.filter((c) => c.isActive).length} active`}
        />
      </section>

      {defaultCode ? (
        <Card>
          <CardHeader>
            <h2 className="text-[16px] font-semibold text-ink">
              Your referral code
            </h2>
            <p className="text-[13px] text-ink-mute mt-1">
              Share this code with students. Anyone who signs up with
              it — and stays — earns you commission.
            </p>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 rounded-xl border border-rule bg-yellow-soft/30 px-4 py-3">
                <p className="font-mono text-[22px] tracking-[0.2em] text-ink text-center sm:text-left">
                  {defaultCode.code}
                </p>
              </div>
              <CopyCodeButton code={defaultCode.code} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/partner/codes"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-orange hover:text-orange-deep"
              >
                Manage codes <ArrowRight size={14} />
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[16px] font-semibold text-ink">
              Recent payouts
            </h2>
            <Link
              href="/partner/payouts"
              className="text-[13px] font-medium text-orange hover:text-orange-deep"
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardBody>
          {recentPayouts.length === 0 ? (
            <p className="text-[14px] text-ink-mute">
              No payouts yet. Payouts run weekly once you have approved
              earnings.
            </p>
          ) : (
            <ul className="divide-y divide-rule">
              {recentPayouts.map((p) => (
                <li
                  key={p.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-ink">
                      GHS {p.amountGhs}
                    </p>
                    <p className="text-[12.5px] text-ink-mute">
                      Invoice {p.invoiceNumber} · week of{" "}
                      {formatDate(p.weekOf)}
                    </p>
                  </div>
                  <PayoutStatusPill status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function StatTile({
  Icon,
  label,
  value,
  hint,
}: {
  Icon: typeof Coins;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardBody className="space-y-2">
        <div className="flex items-center gap-2 text-ink-mute">
          <Icon size={16} strokeWidth={2.25} />
          <span className="text-[11px] font-mono uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p className="text-[26px] sm:text-[28px] font-semibold text-ink leading-tight">
          {value}
        </p>
        <p className="text-[12.5px] text-ink-mute">{hint}</p>
      </CardBody>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const { label, tone } = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

function PayoutStatusPill({
  status,
}: {
  status: "pending" | "paid" | "failed";
}) {
  const meta =
    status === "paid"
      ? { label: "Paid", tone: "bg-emerald-100 text-emerald-800" }
      : status === "failed"
        ? { label: "Failed", tone: "bg-red-100 text-red-800" }
        : { label: "Pending", tone: "bg-yellow-soft text-orange-deep" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${meta.tone}`}
    >
      {meta.label}
    </span>
  );
}

function statusMeta(status: string): { label: string; tone: string } {
  switch (status) {
    case "active":
      return {
        label: "Active",
        tone: "bg-emerald-100 text-emerald-800",
      };
    case "pending":
      return {
        label: "Pending review",
        tone: "bg-yellow-soft text-orange-deep",
      };
    case "suspended":
      return {
        label: "Suspended",
        tone: "bg-orange/10 text-orange-deep",
      };
    case "banned":
      return { label: "Banned", tone: "bg-red-100 text-red-800" };
    default:
      return { label: status, tone: "bg-ink/10 text-ink" };
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
