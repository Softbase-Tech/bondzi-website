"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { listMyReferralsClient } from "@/lib/api/partner";
import { ApiError } from "@/lib/api/client";
import type {
  PartnerReferralCode,
  PartnerReferralCommissionStatus,
  PartnerReferralEngagement,
  PartnerReferralRow,
  PartnerReferralSort,
  PartnerReferralsResult,
} from "@/lib/api/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

/**
 * Interactive shell: code filter + sort control, kept in sync with the
 * URL search params so a partner can share/bookmark a specific view.
 * Every change re-fetches from the backend rather than sorting
 * client-side — that way the `totals` block always matches the visible
 * rows for the selected code filter.
 *
 * Two layouts: stacked cards on mobile so a thumb can scan the handle
 * + status + earnings at a glance, table on lg+ so the seven columns
 * line up cleanly.
 */
export function ReferralsClient({
  initial,
  codes,
  initialCodeId,
  initialSort,
}: {
  initial: PartnerReferralsResult;
  codes: PartnerReferralCode[];
  initialCodeId?: string;
  initialSort: PartnerReferralSort;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<PartnerReferralsResult>(initial);
  const [isPending, startTransition] = useTransition();

  // URL params are the source of truth for the filter/sort combo so a
  // partner can bookmark a specific view. Local state would fork from
  // Back/Forward navigation.
  const codeId = searchParams.get("codeId") ?? undefined;
  const sort = (searchParams.get("sort") ?? "recent") as PartnerReferralSort;

  // Re-fetch whenever the URL's search params change. The server-
  // rendered initial slice already matches the first mount, so we skip
  // the first fetch to avoid a redundant round-trip.
  useEffect(() => {
    if (codeId === initialCodeId && sort === initialSort) return;
    startTransition(async () => {
      try {
        const fresh = await listMyReferralsClient({ codeId, sort });
        setData(fresh);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Couldn't load referrals.";
        toast.error(message);
      }
    });
  }, [codeId, sort, initialCodeId, initialSort]);

  function updateParams(next: {
    codeId?: string;
    sort?: PartnerReferralSort;
  }): void {
    const params = new URLSearchParams(searchParams.toString());
    if (next.codeId) params.set("codeId", next.codeId);
    else params.delete("codeId");
    if (next.sort && next.sort !== "recent") params.set("sort", next.sort);
    else params.delete("sort");
    const q = params.toString();
    router.replace(q ? `/partner/referrals?${q}` : "/partner/referrals", {
      scroll: false,
    });
  }

  const activeCodes = codes.filter((c) => c.isActive || codeId === c.id);

  return (
    <div className="space-y-6">
      <section
        className="grid grid-cols-2 lg:grid-cols-5 gap-3"
        aria-label="Referrals summary"
      >
        <SummaryTile
          label="Total"
          value={String(data.totals.totalReferrals)}
          hint="Signups"
        />
        <SummaryTile
          label="Active"
          value={String(data.totals.activeUsers)}
          hint="10+ answers"
        />
        <SummaryTile
          label="Paid Plus"
          value={String(data.totals.paidPlus)}
          hint="Right now"
        />
        <SummaryTile
          label="Earned"
          value={`GHS ${data.totals.earnedGhs}`}
          hint="Commissions"
        />
        <SummaryTile
          label="Paid out"
          value={`GHS ${data.totals.paidGhs}`}
          hint="To your MoMo"
        />
      </section>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="min-w-0">
            <label
              htmlFor="referrals-code-filter"
              className="block text-[11px] font-mono uppercase tracking-wider text-ink-mute mb-1"
            >
              Code
            </label>
            <select
              id="referrals-code-filter"
              value={codeId ?? ""}
              onChange={(e) =>
                updateParams({
                  codeId: e.target.value || undefined,
                  sort,
                })
              }
              className="min-w-[220px] h-10 rounded-lg border border-rule bg-paper px-3 text-[14px] text-ink focus:border-orange focus:outline-none"
            >
              <option value="">All codes</option>
              {activeCodes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.label}
                  {c.isDefault ? " (default)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label
              htmlFor="referrals-sort"
              className="block text-[11px] font-mono uppercase tracking-wider text-ink-mute mb-1"
            >
              Sort by
            </label>
            <select
              id="referrals-sort"
              value={sort}
              onChange={(e) =>
                updateParams({
                  codeId,
                  sort: e.target.value as PartnerReferralSort,
                })
              }
              className="min-w-[180px] h-10 rounded-lg border border-rule bg-paper px-3 text-[14px] text-ink focus:border-orange focus:outline-none"
            >
              <option value="recent">Most recent</option>
              <option value="engaged">Most engaged</option>
              <option value="earning">Highest earning</option>
            </select>
          </div>
        </div>
        {isPending ? (
          <span className="text-[12px] text-ink-mute self-end sm:self-auto">
            Loading…
          </span>
        ) : null}
      </div>

      {/* Mobile: card list */}
      <div className="lg:hidden space-y-3">
        {data.items.length === 0 ? (
          <EmptyState hasFilter={Boolean(codeId)} />
        ) : (
          data.items.map((r) => <ReferralCard key={r.userId} row={r} />)
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden lg:block">
        {data.items.length === 0 ? (
          <EmptyState hasFilter={Boolean(codeId)} />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead className="text-left text-[12px] font-mono uppercase tracking-wider text-ink-mute">
                  <tr className="border-b border-rule">
                    <th className="px-5 py-3">Referral</th>
                    <th className="px-5 py-3">Signed up</th>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Engagement</th>
                    <th className="px-5 py-3">Paid Plus</th>
                    <th className="px-5 py-3 text-right">Earned</th>
                    <th className="px-5 py-3">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {data.items.map((r) => (
                    <tr key={r.userId}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{r.handle}</p>
                      </td>
                      <td className="px-5 py-3 text-ink-mute">
                        {formatDate(r.attributedAt)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[13px] tracking-wider text-ink-soft">
                            {r.code}
                          </span>
                          {r.isDefaultCode ? (
                            <span className="inline-flex items-center rounded-full bg-yellow-soft px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-orange-deep">
                              Default
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11.5px] text-ink-mute mt-0.5">
                          {r.codeLabel}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <EngagementPill bucket={r.engagementBucket} />
                        <p className="text-[11.5px] text-ink-mute mt-0.5">
                          {r.answerCount} answer
                          {r.answerCount === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        {r.hasPaidPlus ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11.5px] font-medium text-emerald-800">
                            Yes
                          </span>
                        ) : (
                          <span className="text-[13px] text-ink-mute">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-ink">
                        GHS {r.commissionsEarnedGhs}
                        {Number(r.commissionsPaidGhs) > 0 ? (
                          <p className="text-[11.5px] font-normal text-ink-mute">
                            {r.commissionsPaidGhs} paid
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <CommissionPill status={r.commissionStatus} />
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

function ReferralCard({ row }: { row: PartnerReferralRow }) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-ink text-[15px]">{row.handle}</p>
            <p className="text-[11.5px] text-ink-mute mt-0.5">
              Signed up {formatDate(row.attributedAt)}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="font-mono text-[12.5px] tracking-wider text-ink-soft">
                {row.code}
              </span>
              {row.isDefaultCode ? (
                <span className="inline-flex items-center rounded-full bg-yellow-soft px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-orange-deep">
                  Default
                </span>
              ) : null}
            </div>
            <p className="text-[11.5px] text-ink-mute mt-0.5">
              {row.codeLabel}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[16px] font-semibold text-ink">
              GHS {row.commissionsEarnedGhs}
            </p>
            {Number(row.commissionsPaidGhs) > 0 ? (
              <p className="text-[11px] text-ink-mute">
                {row.commissionsPaidGhs} paid
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <EngagementPill bucket={row.engagementBucket} />
          <span className="text-[11.5px] text-ink-mute">
            {row.answerCount} answer{row.answerCount === 1 ? "" : "s"}
          </span>
          {row.hasPaidPlus ? (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
              Paid Plus
            </span>
          ) : null}
          <CommissionPill status={row.commissionStatus} />
        </div>
      </CardBody>
    </Card>
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
      <CardBody className="space-y-0.5">
        <p className="text-[10.5px] font-mono uppercase tracking-wider text-ink-mute">
          {label}
        </p>
        <p className="text-[20px] font-semibold text-ink">{value}</p>
        <p className="text-[11.5px] text-ink-mute">{hint}</p>
      </CardBody>
    </Card>
  );
}

function EngagementPill({
  bucket,
}: {
  bucket: PartnerReferralEngagement;
}) {
  const meta =
    bucket === "committed"
      ? { label: "Committed", tone: "bg-emerald-100 text-emerald-800" }
      : bucket === "engaged"
        ? { label: "Engaged", tone: "bg-yellow-soft text-orange-deep" }
        : { label: "New", tone: "bg-ink/10 text-ink-mute" };
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

function CommissionPill({
  status,
}: {
  status: PartnerReferralCommissionStatus;
}) {
  const meta = ((): { label: string; tone: string } => {
    switch (status) {
      case "paid":
        return { label: "Paid", tone: "bg-emerald-100 text-emerald-800" };
      case "approved":
        return { label: "Approved", tone: "bg-sky-100 text-sky-800" };
      case "flagged":
        return { label: "Flagged", tone: "bg-red-100 text-red-800" };
      case "pending":
        return { label: "Pending", tone: "bg-yellow-soft text-orange-deep" };
      case "clawed_back":
        return { label: "Clawed back", tone: "bg-red-100 text-red-800" };
      default:
        return { label: "None yet", tone: "bg-ink/10 text-ink-mute" };
    }
  })();
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

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-[16px] font-semibold text-ink">
          {hasFilter ? "No referrals for this code" : "No referrals yet"}
        </h2>
      </CardHeader>
      <CardBody>
        <p className="text-[14px] text-ink-mute">
          {hasFilter
            ? "Try picking a different code, or share this one on a new channel to bring in your first signup."
            : "Share your code — every student who signs up with it shows up here with a real-time engagement + earnings summary."}
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
