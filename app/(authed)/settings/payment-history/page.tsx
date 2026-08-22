import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { listMyPaymentHistoryServer } from "@/lib/api/subscription";
import { PaymentHistoryList } from "./PaymentHistoryList";

export const metadata: Metadata = {
  title: "Payment history",
  description: "Every checkout attempt on your Bondzi account.",
};

const PAGE_SIZE = 25;

/**
 * `/settings/payment-history` — mirrors mobile `payment-history.tsx`.
 * Server renders the first page for zero-flash first paint; the
 * client component pages the rest via the axios `api` fetcher.
 */
export default async function PaymentHistoryPage() {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");

  const first = await listMyPaymentHistoryServer(session.accessToken, {
    limit: PAGE_SIZE,
    offset: 0,
  }).catch(() => ({ items: [], total: 0 }));

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
          Payment history
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          Every checkout attempt on this account — pending, paid,
          refunded. Reach out at{" "}
          <a
            href="mailto:hello@bondzi.online"
            className="text-orange hover:text-orange-deep underline underline-offset-4"
          >
            hello@bondzi.online
          </a>{" "}
          about any row that looks off.
        </p>
      </header>

      <PaymentHistoryList
        initialItems={first.items}
        total={first.total}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
