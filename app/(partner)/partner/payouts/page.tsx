import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { Download } from "lucide-react";
import {
  getMyPartner,
  getMyPayoutPreview,
  listMyPayouts,
} from "@/lib/api/partner";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

/**
 * Payout history. Server-rendered so the initial paint has the data
 * (invoice list is small, no need for React Query on first load).
 * The invoice download link is a plain <a> — the browser handles
 * PDF download natively and we get the browser's download UI for
 * free.
 */
export default async function PartnerPayoutsPage() {
  const session = await auth();
  const accessToken = session?.accessToken ?? null;
  if (!accessToken) redirect("/partner/signin?returnTo=%2Fpartner%2Fpayouts");

  const partner = await getMyPartner(accessToken);
  if (!partner) redirect("/partner/register");

  const [payouts, preview] = await Promise.all([
    listMyPayouts(accessToken).catch(() => []),
    getMyPayoutPreview(accessToken).catch(() => ({
      partnerId: partner.id,
      totalGhs: "0.00",
      commissionCount: 0,
      commissions: [],
    })),
  ]);

  const paid = payouts.filter((p) => p.status === "paid");
  const paidTotal = paid.reduce((s, p) => s + Number(p.amountGhs), 0);
  const pending = payouts.filter((p) => p.status === "pending");

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Payouts</p>
        <h1 className="display text-[28px] sm:text-[36px] mt-1">
          Your payout history
        </h1>
        <p className="mt-2 text-ink-soft text-[14px] leading-relaxed max-w-prose">
          Payouts run weekly. Each row below carries the invoice PDF we
          sent to your email — download it here any time.
        </p>
      </header>

      <section
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        aria-label="Payout summary"
      >
        <SummaryTile
          label="Ready to pay out"
          value={`GHS ${preview.totalGhs}`}
          hint={`${preview.commissionCount} commission${
            preview.commissionCount === 1 ? "" : "s"
          }`}
        />
        <SummaryTile
          label="Paid this year"
          value={`GHS ${paidTotal.toFixed(2)}`}
          hint={`${paid.length} payout${paid.length === 1 ? "" : "s"}`}
        />
        <SummaryTile
          label="Pending"
          value={`${pending.length}`}
          hint={pending.length ? "In review" : "Nothing pending"}
        />
      </section>

      {/* Mobile: card list */}
      <div className="lg:hidden space-y-3">
        {payouts.length === 0 ? (
          <EmptyState />
        ) : (
          payouts.map((p) => (
            <Card key={p.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[18px] font-semibold text-ink">
                      GHS {p.amountGhs}
                    </p>
                    <p className="text-[12.5px] text-ink-mute mt-0.5">
                      Invoice {p.invoiceNumber}
                    </p>
                    <p className="text-[12.5px] text-ink-mute">
                      Week of {formatDate(p.weekOf)}
                    </p>
                  </div>
                  <StatusPill status={p.status} />
                </div>
                {p.momoReference ? (
                  <p className="text-[12.5px] text-ink-mute">
                    MoMo ref: {p.momoReference}
                  </p>
                ) : null}
                {p.status === "paid" ? (
                  <a
                    href={`/api/partner/payouts/${p.id}/invoice.pdf`}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-orange hover:text-orange-deep"
                  >
                    <Download size={14} /> Download invoice PDF
                  </a>
                ) : null}
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden lg:block">
        {payouts.length === 0 ? (
          <EmptyState />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead className="text-left text-[12px] font-mono uppercase tracking-wider text-ink-mute">
                  <tr className="border-b border-rule">
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-5 py-3">Week of</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">MoMo reference</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3 font-mono text-[13px]">
                        {p.invoiceNumber}
                      </td>
                      <td className="px-5 py-3 text-ink-soft">
                        {formatDate(p.weekOf)}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-ink">
                        GHS {p.amountGhs}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={p.status} />
                      </td>
                      <td className="px-5 py-3 text-ink-mute">
                        {p.momoReference ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {p.status === "paid" ? (
                          <a
                            href={`/api/partner/payouts/${p.id}/invoice.pdf`}
                            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-orange hover:text-orange-deep"
                          >
                            <Download size={14} /> Invoice
                          </a>
                        ) : (
                          <span className="text-[12px] text-ink-mute">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardBody className="space-y-1">
        <p className="text-[11px] font-mono uppercase tracking-wider text-ink-mute">
          {label}
        </p>
        <p className="text-[24px] font-semibold text-ink">{value}</p>
        <p className="text-[12.5px] text-ink-mute">{hint}</p>
      </CardBody>
    </Card>
  );
}

function StatusPill({
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
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium " +
        meta.tone
      }
    >
      {meta.label}
    </span>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-[16px] font-semibold text-ink">
          No payouts yet
        </h2>
      </CardHeader>
      <CardBody>
        <p className="text-[14px] text-ink-mute">
          Payouts run weekly. Once you have approved commissions the
          first one will show up here with a downloadable invoice.
        </p>
      </CardBody>
    </Card>
  );
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
