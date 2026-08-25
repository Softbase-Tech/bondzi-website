import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Receipt, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth/config";
import {
  getMySubscription,
  listEntitlementsServer,
} from "@/lib/api/subscription";
import type {
  Subscription,
  SubscriptionEntitlement,
} from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { ManagePanel } from "./ManagePanel";

export const metadata: Metadata = {
  title: "Manage subscription",
};

/**
 * Manage-subscription surface. Renders the current plan, expiry, and
 * per-level entitlements. The interactive Cancel button lives inside
 * `ManagePanel` (only meaningful for recurring Pro rows — Plus is
 * lifetime and backend 400s on cancel).
 */
export default async function ManageSubscriptionPage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");
  const profile = session.profile;

  const [subRes, entRes] = await Promise.allSettled([
    getMySubscription(session.accessToken),
    listEntitlementsServer(session.accessToken),
  ]);
  const subscription: Subscription | null =
    subRes.status === "fulfilled" ? subRes.value : null;
  const entitlements: SubscriptionEntitlement[] =
    entRes.status === "fulfilled" ? entRes.value : [];

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-soft hover:text-ink transition-colors motion-reduce:transition-none"
      >
        <ArrowLeft size={14} />
        Back to settings
      </Link>

      <header>
        <h1 className="font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Your subscription
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          See what&apos;s active, when it renews, and cancel anytime.
          Bondzi Plus is lifetime — nothing to cancel there.
        </p>
      </header>

      {subscription ? (
        <ManagePanel
          subscription={subscription}
          currentLevelLabel={profile.examType.toUpperCase()}
        />
      ) : (
        <Card className="p-8 text-center">
          <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-soft text-orange mb-3">
            <Sparkles size={22} />
          </div>
          <p className="font-display text-[20px] text-ink">
            You&apos;re on the free tier
          </p>
          <p className="mt-1.5 text-[13.5px] text-ink-soft max-w-[42ch] mx-auto">
            Explore the plans page to unlock all past papers, Quiz,
            mock exams, and AI explanations.
          </p>
          <Link
            href="/subscription/plans"
            className="mt-4 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-orange text-on-brand font-medium text-[14.5px] hover:bg-orange-deep transition-colors motion-reduce:transition-none"
          >
            See plans
          </Link>
        </Card>
      )}

      <Link
        href="/settings/payment-history"
        className="group flex items-center gap-3 p-4 rounded-2xl border border-rule bg-paper hover:bg-yellow-soft/40 transition-colors motion-reduce:transition-none"
      >
        <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-soft text-orange">
          <Receipt size={18} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-display text-[15.5px] text-ink leading-tight">
            Payment history
          </span>
          <span className="mt-0.5 block text-[12.5px] text-ink-soft">
            Every checkout attempt — pending, paid, refunded
          </span>
        </span>
        <ArrowLeft
          size={16}
          className="rotate-180 shrink-0 text-ink-mute group-hover:text-ink transition-colors motion-reduce:transition-none"
        />
      </Link>

      {entitlements.length > 0 ? (
        <Card className="p-5 sm:p-6">
          <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute mb-3">
            Entitlements by level
          </div>
          <ul className="space-y-2">
            {entitlements.map((e) => (
              <li
                key={e.level}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-rule bg-paper"
              >
                <div className="font-display text-[15.5px] text-ink capitalize">
                  {labelFor(e.level)}
                </div>
                <div className="text-right">
                  <div
                    className={
                      e.account === "free"
                        ? "text-[13px] text-ink-soft"
                        : "text-[13px] font-semibold text-orange"
                    }
                  >
                    {e.account === "free" ? "Free" : e.account.toUpperCase()}
                  </div>
                  {e.expiresAt ? (
                    <div className="text-[11.5px] text-ink-mute">
                      {e.cancelled ? "Ends" : "Renews"} {formatDate(e.expiresAt)}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function labelFor(level: "bece" | "wassce" | "novdec"): string {
  return level === "wassce" ? "WASSCE" : level === "bece" ? "BECE" : "Nov/Dec";
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
