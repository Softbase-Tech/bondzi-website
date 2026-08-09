import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listNotificationsServer } from "@/lib/api/notifications";
import { NotificationsList } from "./NotificationsList";
import type { AppNotification } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Streak nudges, referral wins, exam updates.",
};

/**
 * Notifications inbox. Server prefetches the latest 50; client
 * component wires the mark-read mutations + deep-link routing +
 * optimistic updates.
 */
export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");

  const listRes = await Promise.allSettled([
    listNotificationsServer(session.accessToken),
  ]);
  const initial: AppNotification[] =
    listRes[0].status === "fulfilled" ? listRes[0].value : [];

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <header>
        <h1 className="font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Notifications
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          Streak nudges, referral wins, exam updates — everything the
          Bondzi backend sends you lands here.
        </p>
      </header>
      <NotificationsList initial={initial} />
    </div>
  );
}
