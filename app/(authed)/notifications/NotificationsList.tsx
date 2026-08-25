"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  notificationDeepLink,
} from "@/lib/api/notifications";
import type { AppNotification } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface Props {
  initial: AppNotification[];
}

const STALE_MS = 30_000;
const QK = ["notifications", "list"] as const;

/**
 * Client shell for the inbox. Handles:
 *   - initial hydration from server data
 *   - refetch on window focus (via TanStack Query default)
 *   - optimistic mark-read on tap and on "Mark all read"
 *   - deep-link routing on tap (via notificationDeepLink())
 */
export function NotificationsList({ initial }: Props) {
  const router = useRouter();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: QK,
    queryFn: listNotifications,
    initialData: initial,
    staleTime: STALE_MS,
  });

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK });
      const prev = qc.getQueryData<AppNotification[]>(QK) ?? [];
      qc.setQueryData<AppNotification[]>(QK, (rows) =>
        (rows ?? []).map((n) =>
          n.id === id
            ? { ...n, readAt: n.readAt ?? new Date().toISOString() }
            : n,
        ),
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK, ctx.prev);
      toast.error("Couldn't mark as read. Try again.");
    },
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: QK });
      const prev = qc.getQueryData<AppNotification[]>(QK) ?? [];
      const now = new Date().toISOString();
      qc.setQueryData<AppNotification[]>(QK, (rows) =>
        (rows ?? []).map((n) => ({ ...n, readAt: n.readAt ?? now })),
      );
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK, ctx.prev);
      toast.error("Couldn't mark all as read. Try again.");
    },
  });

  const rows = list.data ?? [];
  const unread = rows.filter((n) => !n.readAt).length;

  const onRowClick = useCallback(
    (n: AppNotification) => {
      if (!n.readAt) markOne.mutate(n.id);
      router.push(notificationDeepLink(n));
    },
    [markOne, router],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
            Inbox
          </div>
          {unread > 0 ? (
            <span className="inline-flex items-center h-6 px-2 rounded-full bg-orange text-on-brand text-[11.5px] font-semibold">
              {unread} new
            </span>
          ) : null}
        </div>
        {unread > 0 ? (
          <button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12.5px] font-medium text-orange hover:bg-yellow-soft/60 transition-colors motion-reduce:transition-none disabled:opacity-60"
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
        ) : null}
      </div>

      {list.isPending && !rows.length ? (
        <Card className="p-8 text-center">
          <p className="text-[13.5px] text-ink-soft">Loading…</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-soft text-orange mb-3">
            <Bell size={22} />
          </div>
          <p className="font-display text-[20px] text-ink">
            You&apos;re all caught up
          </p>
          <p className="mt-1.5 text-[13.5px] text-ink-soft max-w-[42ch] mx-auto">
            Streak reminders, level-ups and review alerts will land
            here.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((n) => (
            <NotificationRow key={n.id} n={n} onClick={onRowClick} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationRow({
  n,
  onClick,
}: {
  n: AppNotification;
  onClick: (n: AppNotification) => void;
}) {
  const isUnread = !n.readAt;
  return (
    <li>
      <button
        type="button"
        onClick={() => onClick(n)}
        className={cn(
          "w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange",
          isUnread
            ? "border-orange bg-yellow-soft/60"
            : "border-rule bg-paper hover:border-ink-soft",
        )}
      >
        <span
          className={cn(
            "mt-1.5 shrink-0 w-2 h-2 rounded-full",
            isUnread ? "bg-orange" : "bg-transparent",
          )}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2 justify-between">
            <div
              className={cn(
                "min-w-0 text-[14.5px] font-medium leading-tight",
                isUnread ? "text-ink" : "text-ink-soft",
              )}
            >
              {n.title}
            </div>
            <div className="shrink-0 text-[11.5px] text-ink-mute pl-2">
              {formatRelative(n.createdAt)}
            </div>
          </div>
          <p
            className={cn(
              "mt-0.5 text-[13.5px] leading-relaxed",
              isUnread ? "text-ink" : "text-ink-soft",
            )}
          >
            {n.body}
          </p>
        </div>
      </button>
    </li>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const t = d.getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.floor((now - t) / 1000);
  if (diff < 60) return "just now";
  const min = Math.floor(diff / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
