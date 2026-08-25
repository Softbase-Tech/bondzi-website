"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { listNotifications } from "@/lib/api/notifications";
import type { AppNotification } from "@/lib/api/types";

const QK = ["notifications", "list"] as const;
const STALE_MS = 5 * 60_000;

/**
 * Bell + unread badge in the header. Reuses the same TanStack Query
 * cache key as the /notifications page so navigating between the
 * bell and inbox never triggers a duplicate fetch.
 *
 * Guarded on `session.status === 'authenticated'` so we don't fire
 * this query on the marketing side of the app (proxy.ts prevents the
 * header ever showing there today — but belt-and-braces).
 */
export function NotificationBell() {
  const { status } = useSession();
  const query = useQuery<AppNotification[]>({
    queryKey: QK,
    queryFn: listNotifications,
    enabled: status === "authenticated",
    staleTime: STALE_MS,
  });
  const unread = (query.data ?? []).filter((n) => !n.readAt).length;
  const label = unread > 9 ? "9+" : `${unread}`;

  return (
    <Link
      href="/notifications"
      aria-label={
        unread > 0
          ? `Notifications, ${unread} unread`
          : "Notifications"
      }
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-yellow-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange transition-colors motion-reduce:transition-none"
    >
      <Bell size={18} className="text-ink" />
      {unread > 0 ? (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange text-on-brand text-[10.5px] font-semibold inline-flex items-center justify-center"
          aria-hidden="true"
        >
          {label}
        </span>
      ) : null}
    </Link>
  );
}
