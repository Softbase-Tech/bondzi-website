"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { redeemXp } from "@/lib/api/xp";
import type { XpRedemptionTier } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

interface Props {
  initialSpendableXp: number;
  tiers: XpRedemptionTier[];
}

/**
 * Redeem-XP interaction. Tier grid → confirm dialog → toast + refresh.
 *
 * On success we invalidate the caches that gate paywalls
 * (`subscription/me`, `entitlements`, `auth/me`) so the moment the
 * student returns to Quiz / Mock exam / Level test, they walk through
 * without hitting the paywall.
 */
export function RedeemPanel({ initialSpendableXp, tiers }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const [spendable, setSpendable] = useState(initialSpendableXp);
  const [selected, setSelected] = useState<XpRedemptionTier | null>(null);
  const [pending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<{
    creditDays: number;
    expiresAt: string;
  } | null>(null);

  if (tiers.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-[13.5px] text-ink-soft">
          No XP tiers are enabled right now. Ping support if this looks
          wrong.
        </p>
      </Card>
    );
  }

  const doRedeem = () => {
    if (!selected) return;
    if (selected.xpCost > spendable) {
      toast.error(`You need ${selected.xpCost - spendable} more XP for this tier.`);
      return;
    }
    startTransition(async () => {
      try {
        const res = await redeemXp(selected.tierKey);
        // creditDays is the tier's shape (7 / 30 / 90 / 365) — a
        // closed set, safe as a property. XP balances are not.
        trackEvent("xp_redeemed", { creditDays: res.creditDays });
        setSpendable(res.newSpendableXp);
        setSuccessMessage({
          creditDays: res.creditDays,
          expiresAt: res.subscriptionExpiresAt,
        });
        await Promise.all([
          qc.invalidateQueries({ queryKey: ["subscription", "me"] }),
          qc.invalidateQueries({ queryKey: ["subscription", "entitlements"] }),
          qc.invalidateQueries({ queryKey: ["auth", "me"] }),
          qc.invalidateQueries({ queryKey: ["xp", "wallet"] }),
        ]);
        router.refresh();
        setSelected(null);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Couldn't redeem right now. Try again.";
        toast.error(msg);
      }
    });
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {tiers.map((t) => {
          const canAfford = spendable >= t.xpCost;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t)}
              disabled={!canAfford}
              className={cn(
                "text-left p-5 rounded-2xl border-2 transition-colors motion-reduce:transition-none",
                canAfford
                  ? "border-rule-strong bg-paper hover:border-orange"
                  : "border-rule bg-paper opacity-60 cursor-not-allowed",
              )}
            >
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-orange">
                <Coins size={11} />
                {t.label}
              </div>
              <div className="mt-2 font-display text-[26px] text-ink leading-none">
                {t.xpCost.toLocaleString()} XP
              </div>
              <div className="mt-1 text-[13.5px] text-ink-soft">
                {t.creditDays} days of Pro
              </div>
              {!canAfford ? (
                <div className="mt-3 text-[12px] font-medium text-ink-mute">
                  {(t.xpCost - spendable).toLocaleString()} XP short
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(o) => (!o ? setSelected(null) : undefined)}
        title={selected ? `Redeem ${selected.xpCost.toLocaleString()} XP?` : ""}
        description={
          selected
            ? `You'll get ${selected.creditDays} days of Bondzi Pro. Your spendable XP after this: ${(spendable - selected.xpCost).toLocaleString()}.`
            : ""
        }
      >
        <DialogActions>
          <Button
            variant="outline"
            onClick={() => setSelected(null)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button loading={pending} onClick={doRedeem} leftIcon={<Coins size={16} />}>
            Confirm redeem
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!successMessage}
        onOpenChange={(o) => (!o ? setSuccessMessage(null) : undefined)}
        title="Pro is on."
        description={
          successMessage
            ? `+${successMessage.creditDays} days of Pro added. Active until ${formatDate(successMessage.expiresAt)}.`
            : ""
        }
      >
        <div className="flex items-center justify-center py-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange text-on-brand">
            <CheckCircle2 size={26} strokeWidth={2.25} />
          </div>
        </div>
        <DialogActions>
          <Button onClick={() => setSuccessMessage(null)} block>
            Start using Pro
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
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
