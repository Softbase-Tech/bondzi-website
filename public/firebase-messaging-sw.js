/**
 * Bondzi web-push service worker.
 *
 * Registered by `lib/push/firebase.ts` and handed to FCM's `getToken()`
 * via the `serviceWorkerRegistration` option, so the push subscription
 * lives on THIS worker. We deliberately do NOT importScripts the
 * firebase-messaging compat bundle:
 *
 *   - no CDN dependency (works offline / behind strict CSPs),
 *   - no Firebase config needed inside the worker (config lives in the
 *     page bundle via NEXT_PUBLIC_* vars — a static file can't read env),
 *   - FCM web pushes are standard Web Push messages whose payload is the
 *     message JSON (`notification`, `data`, `fcmOptions`), so a plain
 *     `push` handler can display them.
 *
 * Foreground contract with the page (components/push/PushManager.tsx):
 * when a Bondzi tab is visible we do NOT show a system notification —
 * we postMessage the payload to the open tabs and the page renders its
 * usual sonner toast instead.
 */

const FALLBACK_TITLE = "Bondzi";
const NOTIFICATION_ICON = "/brand/icon.png";
/** Marker so the page can tell our messages apart from anything else. */
const PAGE_MESSAGE_SOURCE = "bondzi-push";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Extract a same-origin path to open when the notification is clicked.
 * Honors, in order: `data.link`, webpush `fcmOptions.link`, the legacy
 * `notification.click_action`. Falls back to "/".
 */
function extractLink(payload) {
  const candidates = [
    payload && payload.data && payload.data.link,
    payload && payload.fcmOptions && payload.fcmOptions.link,
    payload && payload.notification && payload.notification.click_action,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }
  return "/";
}

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = null;
  try {
    payload = event.data.json();
  } catch {
    // Not JSON — nothing we can meaningfully display.
    return;
  }
  if (!payload) return;

  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || FALLBACK_TITLE;
  const body = notification.body || data.body || "";
  const link = extractLink(payload);

  event.waitUntil(
    (async () => {
      // If a Bondzi tab is visible, hand the message to the page so it
      // can show its in-app toast — a system notification on top of the
      // open app is just noise.
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const visible = windows.filter(
        (client) => client.visibilityState === "visible",
      );
      if (visible.length > 0) {
        for (const client of visible) {
          client.postMessage({
            source: PAGE_MESSAGE_SOURCE,
            title,
            body,
            link,
            data,
          });
        }
        return;
      }

      await self.registration.showNotification(title, {
        body,
        icon: NOTIFICATION_ICON,
        badge: NOTIFICATION_ICON,
        data: { link },
        // Collapse repeat nudges of the same kind rather than stacking.
        tag: typeof data.type === "string" ? `bondzi-${data.type}` : undefined,
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const link =
    (event.notification.data && event.notification.data.link) || "/";
  const target = new URL(link, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Prefer an already-open Bondzi tab: focus it and navigate.
      for (const client of windows) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client && client.url !== target) {
            try {
              await client.navigate(target);
            } catch {
              // Cross-origin or detached client — fall through to open.
            }
          }
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
