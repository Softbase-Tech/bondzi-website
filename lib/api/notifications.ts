import { api, apiServer } from "./client";
import type { AppNotification } from "./types";

/**
 * Notification inbox reads + mutations.
 *
 * Server returns up to 50 rows (most-recent first). The client
 * synthesises `readAt` from `is_read=true` server-side, so we can
 * safely use `readAt` for unread bookkeeping without extra checks.
 */

export async function listNotificationsServer(
  accessToken: string,
): Promise<AppNotification[]> {
  return apiServer<AppNotification[]>(accessToken, "/notifications");
}

export async function listNotifications(): Promise<AppNotification[]> {
  return api<AppNotification[]>("/notifications");
}

export async function markNotificationRead(id: string): Promise<void> {
  await api<void>(
    `/notifications/${encodeURIComponent(id)}/read`,
    { method: "POST", body: {}, raw: true },
  );
}

export async function markAllNotificationsRead(): Promise<void> {
  await api<void>("/notifications/read-all", {
    method: "POST",
    body: {},
    raw: true,
  });
}

export interface RegisterPushTokenBody {
  platform: "web";
  fcmToken: string;
  /** Backend caps this at 128 chars. */
  deviceId?: string;
  appVersion?: string;
}

/**
 * Register (upsert) this browser's FCM token so the backend can target
 * it with re-engagement pushes. Re-registering the same token is an
 * upsert server-side — safe to call on every app load.
 */
export async function registerPushToken(
  body: RegisterPushTokenBody,
): Promise<void> {
  await api<void>("/notifications/push-token", {
    method: "POST",
    body,
    raw: true,
  });
}

/**
 * Maps the notification's `data.type` (or plain `type` fallback) to the
 * route web students land on when they tap the row. Matches mobile's
 * deep-link table — keep them in sync so a push received on both
 * platforms lands somewhere sensible on each.
 */
export function notificationDeepLink(n: AppNotification): string {
  const explicit = typeof n.data?.type === "string" ? n.data.type : n.type;
  const examId = typeof n.data?.examId === "string" ? n.data.examId : null;
  switch (explicit) {
    case "srs_due":
      // Web doesn't have a review tab yet — surface it on dashboard so
      // the notification isn't a dead end.
      return "/dashboard";
    case "streak_at_risk":
      return "/subjects";
    case "level_up":
    case "streak_milestone":
      return "/profile";
    case "exam_complete":
      return examId ? `/exam/${examId}/result` : "/dashboard";
    case "winner":
    case "leaderboard_winner":
      return "/winners";
    case "welcome":
      return "/dashboard";
    case "referral_referred":
    case "referral_qualified":
    case "referral_new_user":
      return "/referral";
    case "subscription_expiring":
    case "subscription_expired":
    case "subscription_payment_failed":
    case "subscription_cancelled":
      return "/subscription/plans";
    default:
      return "/notifications";
  }
}
