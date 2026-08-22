import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getMySubscription } from "@/lib/api/subscription";
import { Card } from "@/components/ui/Card";
import { SuccessRefresher } from "./SuccessRefresher";

export const metadata: Metadata = {
  title: "Payment received",
  description: "Your Bondzi subscription is active.",
};

/**
 * Post-checkout confirmation. Renders server-side so students see the
 * actual activated subscription, not just a "thanks" splash.
 *
 * When `pending=1` is in the URL (verify call failed but Paystack
 * accepted the payment), the page relies on the webhook to activate
 * and the client polls `/subscriptions/me` for a few beats.
 */
export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; pending?: string }>;
}) {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");
  const params = await searchParams;

  const subscription = await getMySubscription(session.accessToken);
  const isPending =
    params.pending === "1" &&
    (!subscription ||
      (subscription.status !== "active" &&
        subscription.status !== "xp_credited"));

  return (
    <div className="max-w-[640px] mx-auto space-y-6 text-center">
      <div className="mx-auto inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange text-paper">
        {isPending ? (
          <Sparkles size={26} />
        ) : (
          <CheckCircle2 size={28} strokeWidth={2.25} />
        )}
      </div>
      <div>
        <h1 className="font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          {isPending
            ? "Payment received — activating…"
            : "You&apos;re in. Welcome to Bondzi Pro."}
        </h1>
        <p className="mt-2 text-[15.5px] text-ink-soft max-w-[52ch] mx-auto">
          {isPending
            ? "Paystack accepted your payment. It only takes a moment for our system to catch up — this page will refresh itself."
            : "All Pro features are unlocked. Reach out to support@bondzi.online if anything is off."}
        </p>
      </div>

      {subscription ? (
        <Card className="p-5 text-left">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute mb-2">
            Your plan
          </div>
          <div className="grid grid-cols-2 gap-3 text-[13.5px]">
            <Row label="Account" value={subscription.account ?? "—"} />
            <Row label="Level" value={subscription.level ?? "—"} />
            <Row label="Status" value={subscription.status} />
            <Row
              label={
                subscription.paymentKind === "one_time"
                  ? "Purchased"
                  : "Renews"
              }
              value={
                subscription.expiresAt
                  ? formatDate(subscription.expiresAt)
                  : subscription.startsAt
                    ? formatDate(subscription.startsAt)
                    : "—"
              }
            />
          </div>
        </Card>
      ) : null}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-orange text-paper font-medium text-[14.5px] hover:bg-orange-deep transition-colors motion-reduce:transition-none"
        >
          Go to dashboard
        </Link>
        <Link
          href="/subscription/manage"
          className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-paper text-ink border border-rule-strong font-medium text-[14.5px] hover:border-ink-soft transition-colors motion-reduce:transition-none"
        >
          Manage subscription
        </Link>
      </div>

      {isPending ? <SuccessRefresher reference={params.reference} /> : null}
    </div>
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
