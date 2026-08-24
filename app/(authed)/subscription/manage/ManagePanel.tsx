"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cancelSubscription } from "@/lib/api/subscription";
import type { Subscription } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions } from "@/components/ui/Dialog";
import { trackEvent } from "@/lib/analytics";

interface Props {
  subscription: Subscription;
  currentLevelLabel: string;
}

/**
 * Shows the currently-active subscription and — for RECURRING Pro
 * rows — surfaces a Cancel button gated by a confirmation dialog.
 *
 * Cancel semantics: backend flips status='cancelled' but leaves
 * `expiresAt` intact so the student keeps access for the prepaid
 * window. We surface that explicitly ("you'll keep access until…") so
 * cancellers don't panic-refund via chargeback.
 */
export function ManagePanel({ subscription, currentLevelLabel }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const isRecurring = subscription.paymentKind === "recurring";
  const isPlus = subscription.account === "plus";
  const isXpCredited = subscription.status === "xp_credited";
  const isCancelled = subscription.status === "cancelled";
  const canCancel = isRecurring && subscription.status === "active";

  const doCancel = () => {
    startTransition(async () => {
      try {
        await cancelSubscription();
        trackEvent("subscription_cancelled", {
          account: isPlus ? "plus" : "pro",
        });
        await Promise.all([
          qc.invalidateQueries({ queryKey: ["subscription", "me"] }),
          qc.invalidateQueries({ queryKey: ["subscription", "entitlements"] }),
          qc.invalidateQueries({ queryKey: ["auth", "me"] }),
        ]);
        setConfirmOpen(false);
        router.refresh();
        toast.success(
          subscription.expiresAt
            ? `Cancelled. You keep Pro access until ${formatDate(subscription.expiresAt)}.`
            : "Cancelled.",
        );
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Couldn't cancel right now. Try again.";
        toast.error(msg);
      }
    });
  };

  return (
    <>
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-orange text-paper text-[11.5px] font-semibold uppercase tracking-widest">
              <Sparkles size={12} />
              Bondzi {isPlus ? "Plus" : "Pro"}
            </div>
            <h2 className="mt-2 font-display text-[24px] leading-tight text-ink">
              {isPlus
                ? "Lifetime access"
                : isXpCredited
                  ? "Pro via XP redemption"
                  : "Pro — recurring"}
            </h2>
            <p className="mt-0.5 text-[13.5px] text-ink-soft">
              Level: {currentLevelLabel}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[13.5px]">
          <Row label="Status" value={statusLabel(subscription.status)} />
          <Row
            label={
              isPlus
                ? "Purchased"
                : isCancelled
                  ? "Access ends"
                  : isRecurring
                    ? "Renews"
                    : "Expires"
            }
            value={
              subscription.expiresAt
                ? formatDate(subscription.expiresAt)
                : subscription.startsAt
                  ? formatDate(subscription.startsAt)
                  : "—"
            }
          />
          {subscription.billingInterval ? (
            <Row
              label="Cadence"
              value={cadenceLabel(subscription.billingInterval)}
            />
          ) : null}
          {typeof subscription.amountGhs === "number" ? (
            <Row
              label="Last charge"
              value={`GHS ${subscription.amountGhs.toLocaleString()}`}
            />
          ) : null}
        </div>

        {isCancelled && subscription.expiresAt ? (
          <div className="rounded-xl bg-yellow-soft/60 border border-orange/40 p-3 text-[13px] text-ink">
            Your Pro is cancelled — you&apos;ll keep access until{" "}
            <strong className="font-semibold">
              {formatDate(subscription.expiresAt)}
            </strong>
            .
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/subscription/plans"
            className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-orange text-paper font-medium text-[14.5px] hover:bg-orange-deep transition-colors motion-reduce:transition-none"
          >
            {isPlus ? "Upgrade to Pro" : "Change plan"}
          </Link>
          {canCancel ? (
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(true)}
              leftIcon={<XCircle size={16} />}
            >
              Cancel Pro
            </Button>
          ) : null}
        </div>
      </Card>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cancel Bondzi Pro?"
        description={
          subscription.expiresAt
            ? `You'll keep Pro access until ${formatDate(subscription.expiresAt)}. After that you drop to the free tier — you can resubscribe anytime.`
            : "Cancelling ends your subscription. You can resubscribe anytime."
        }
      >
        <DialogActions>
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(false)}
            disabled={pending}
          >
            Never mind
          </Button>
          <Button
            loading={pending}
            onClick={doCancel}
            leftIcon={<XCircle size={16} />}
          >
            Confirm cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-widest text-ink-mute">
        {label}
      </div>
      <div className="mt-0.5 text-ink capitalize">{value}</div>
    </div>
  );
}

function statusLabel(s: Subscription["status"]): string {
  switch (s) {
    case "active":
      return "Active";
    case "cancelled":
      return "Cancelled";
    case "xp_credited":
      return "XP-credited";
    case "past_due":
      return "Past due";
    case "inactive":
      return "Inactive";
    default:
      return s;
  }
}

function cadenceLabel(c: NonNullable<Subscription["billingInterval"]>): string {
  return c === "monthly"
    ? "Monthly"
    : c === "six_month"
      ? "Every 6 months"
      : "Annual";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
