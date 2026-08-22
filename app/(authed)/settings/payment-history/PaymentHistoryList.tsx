"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  listMyPaymentHistory,
  type PaymentAttemptStatusView,
  type PaymentAttemptView,
} from "@/lib/api/subscription";

const STATUS_LABEL: Record<PaymentAttemptStatusView, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  abandoned: "Abandoned",
};

const STATUS_STYLE: Record<PaymentAttemptStatusView, string> = {
  pending: "bg-yellow-soft text-orange-deep",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-ink/5 text-ink-soft",
  abandoned: "bg-ink/5 text-ink-mute",
};

interface Props {
  initialItems: PaymentAttemptView[];
  total: number;
  pageSize: number;
}

/**
 * Client-side pager for the payment-history list. Initial page comes
 * from the server component (fresh SSR paint); "Load more" fetches
 * subsequent pages via the axios `api` fetcher.
 */
export function PaymentHistoryList({ initialItems, total, pageSize }: Props) {
  const [items, setItems] = useState<PaymentAttemptView[]>(initialItems);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasMore = items.length < total;

  const loadMore = () => {
    setError(null);
    startTransition(async () => {
      try {
        const page = await listMyPaymentHistory({
          limit: pageSize,
          offset: items.length,
        });
        setItems((prev) => [...prev, ...page.items]);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Could not load more.";
        setError(msg);
      }
    });
  };

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-display text-[18px] text-ink">
          No payments yet
        </p>
        <p className="mt-1.5 text-[13.5px] text-ink-soft max-w-[42ch] mx-auto">
          When you start a checkout, you&apos;ll see it here — pending
          until it confirms, then paid.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((row) => (
        <PaymentRow key={row.id} row={row} />
      ))}
      {hasMore ? (
        <div className="pt-2">
          <Button
            variant="outline"
            onClick={loadMore}
            loading={pending}
            disabled={pending}
          >
            Load more
          </Button>
        </div>
      ) : (
        <p className="pt-2 text-[12px] text-ink-mute text-center">
          {items.length} of {total} shown.
        </p>
      )}
      {error ? (
        <p className="text-[13px] font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

function PaymentRow({ row }: { row: PaymentAttemptView }) {
  const accountLabel = row.account
    ? row.account === "pro"
      ? "Pro"
      : "Plus"
    : "Plan";
  const levelLabel = row.level ? row.level.toUpperCase() : "";
  const cadenceLabel = row.billingInterval
    ? row.billingInterval === "monthly"
      ? "Monthly"
      : row.billingInterval === "six_month"
        ? "Termly"
        : "Annual"
    : "Lifetime";
  const stamp = row.resolvedAt ?? row.initiatedAt;
  const stampDate = new Date(stamp);
  const stampLabel = stampDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const showRefundPill = row.alarmDuplicatePlus && row.status !== "refunded";
  const refundPillLabel =
    row.autoRefundOutcome === "failed"
      ? "Refund processing"
      : "Refund pending";

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-display text-[15.5px] text-ink">
            {accountLabel}
            {levelLabel ? ` · ${levelLabel}` : ""}
          </div>
          <div className="mt-0.5 text-[12.5px] text-ink-soft">
            {cadenceLabel} · {stampLabel}
          </div>
          {row.status === "failed" && row.failureReason ? (
            <div className="mt-1.5 text-[12px] text-red-700 leading-snug">
              {row.failureReason}
            </div>
          ) : null}
          {showRefundPill ? (
            <div className="mt-1.5 text-[12px] text-ink-soft leading-snug">
              {row.autoRefundOutcome === "failed"
                ? "Refund is being processed by our team — your card will be credited shortly."
                : "You already own this plan on this level. A refund has been issued and will appear on your statement shortly."}
            </div>
          ) : null}
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-[15.5px] text-ink">
            {row.currency} {row.amountGhs.toFixed(2)}
          </div>
          <div
            className={
              "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide " +
              (showRefundPill
                ? "bg-yellow-soft text-orange-deep"
                : STATUS_STYLE[row.status])
            }
          >
            {showRefundPill ? refundPillLabel : STATUS_LABEL[row.status]}
          </div>
        </div>
      </div>
    </Card>
  );
}
