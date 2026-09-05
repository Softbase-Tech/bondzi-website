"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  autoRequestPushPermission,
  isPushAvailable,
  resyncPushTokenOnce,
  SW_MESSAGE_SOURCE,
} from "@/lib/push/firebase";

/** One automatic ask per browser session (per tab lifetime). */
const AUTO_ASK_KEY = "bondzi_push_auto_asked";

/**
 * Invisible manager mounted once in the (authed) layout. Two jobs:
 *
 *   1. Token refresh — if the user previously enabled push on this
 *      browser (localStorage flag) and permission is still granted,
 *      silently re-fetch the FCM token and re-register it with the
 *      backend on app load (getToken is cheap; the backend upserts).
 *      When permission was never decided ("default"), it also fires
 *      the automatic permission request once per browser session —
 *      the CTA card and settings toggle remain the gesture-based
 *      paths for browsers that ignore gestureless requests.
 *
 *   2. Foreground messages — the service worker forwards pushes to
 *      visible tabs instead of showing a system notification (see
 *      public/firebase-messaging-sw.js); we render them with the app's
 *      usual sonner toast, with an "Open" action honoring the push's
 *      `link`.
 *
 * No-ops entirely on unsupported browsers or unconfigured environments.
 */
export function PushManager() {
  const router = useRouter();

  useEffect(() => {
    if (!isPushAvailable()) return;

    void resyncPushTokenOnce();

    // Automatic ask: a signed-in user who has never decided on
    // notifications gets the native prompt without needing to find
    // the CTA. Once per browser session (sessionStorage), small delay
    // so it doesn't collide with first paint. Denied/granted states
    // short-circuit inside autoRequestPushPermission.
    // The session flag is written INSIDE the callback (not at mount)
    // so dev strict-mode's mount/unmount/mount doesn't mark the ask
    // as done while cancelling its own timer.
    let askTimer: number | undefined;
    if (Notification.permission === "default") {
      askTimer = window.setTimeout(() => {
        try {
          if (sessionStorage.getItem(AUTO_ASK_KEY)) return;
          sessionStorage.setItem(AUTO_ASK_KEY, "1");
        } catch {
          return; // No sessionStorage — skip the auto ask, card remains.
        }
        void autoRequestPushPermission();
      }, 1500);
    }

    const onSwMessage = (event: MessageEvent) => {
      const data = event.data as
        | { source?: string; title?: string; body?: string; link?: string }
        | null;
      if (!data || data.source !== SW_MESSAGE_SOURCE) return;

      const link = normalizeLink(data.link);
      toast(data.title || "Bondzi", {
        description: data.body || undefined,
        action: link
          ? { label: "Open", onClick: () => router.push(link) }
          : undefined,
      });
    };

    navigator.serviceWorker.addEventListener("message", onSwMessage);
    return () => {
      if (askTimer !== undefined) window.clearTimeout(askTimer);
      navigator.serviceWorker.removeEventListener("message", onSwMessage);
    };
  }, [router]);

  return null;
}

/**
 * Pushes carry `link` as a path ("/dashboard") or occasionally a full
 * URL. Router.push wants a path, and we only follow same-origin links.
 */
function normalizeLink(link: string | undefined): string | null {
  if (!link) return null;
  try {
    const url = new URL(link, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
