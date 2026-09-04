"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  isPushAvailable,
  resyncPushTokenOnce,
  SW_MESSAGE_SOURCE,
} from "@/lib/push/firebase";

/**
 * Invisible manager mounted once in the (authed) layout. Two jobs:
 *
 *   1. Token refresh — if the user previously enabled push on this
 *      browser (localStorage flag) and permission is still granted,
 *      silently re-fetch the FCM token and re-register it with the
 *      backend on app load (getToken is cheap; the backend upserts).
 *      Never prompts — enabling is always an explicit user gesture in
 *      the prompt card / settings toggle.
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
    return () =>
      navigator.serviceWorker.removeEventListener("message", onSwMessage);
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
