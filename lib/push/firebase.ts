"use client";

/**
 * Firebase Cloud Messaging plumbing for browser push.
 *
 * Design notes:
 *   - The Firebase SDK is loaded via dynamic `import()` only when push
 *     is actually used, so it never bloats the main bundle and never
 *     executes in environments without Firebase configured.
 *   - `isPushConfigured()` gates EVERYTHING on the NEXT_PUBLIC_FIREBASE_*
 *     vars being present — a dev environment without them silently
 *     no-ops (requirement: must not crash).
 *   - `isPushSupported()` feature-detects the browser. Non-PWA iOS
 *     Safari has no `Notification`/`PushManager`, so every surface
 *     built on these helpers disappears there.
 *   - The service worker at /firebase-messaging-sw.js is OURS (no
 *     firebase-compat importScripts). We hand its registration to
 *     `getToken()` so the push subscription lands on it; it displays
 *     background notifications and forwards foreground ones to the page
 *     (see components/push/PushManager.tsx).
 */

import type { Messaging } from "firebase/messaging";
import { ENV } from "../env";
import { getWebDeviceId } from "../device";
import { registerPushToken } from "../api/notifications";

const SW_PATH = "/firebase-messaging-sw.js";

/** localStorage flag — the user enabled push on this browser. */
const ENABLED_KEY = "bondzi_push_enabled_v1";
/** localStorage timestamp (ms) of the last prompt-card dismissal. */
export const PROMPT_DISMISSED_KEY = "bondzi_push_prompt_dismissed_at";
/** `source` marker on messages the service worker posts to the page. */
export const SW_MESSAGE_SOURCE = "bondzi-push";

/** All Firebase web-config vars present? (Empty in unconfigured envs.) */
export function isPushConfigured(): boolean {
  const f = ENV.FIREBASE;
  return Boolean(
    f.apiKey && f.projectId && f.messagingSenderId && f.appId && f.vapidKey,
  );
}

/** Does this browser expose the primitives web push needs? */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/** Convenience: supported browser AND configured environment. */
export function isPushAvailable(): boolean {
  return isPushSupported() && isPushConfigured();
}

export function readPushEnabledFlag(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePushEnabledFlag(value: boolean): void {
  try {
    if (value) localStorage.setItem(ENABLED_KEY, "1");
    else localStorage.removeItem(ENABLED_KEY);
  } catch {
    // Storage unavailable (private mode etc.) — flag is best-effort.
  }
}

let messagingPromise: Promise<Messaging | null> | null = null;

/**
 * Lazily initialise the Firebase app + Messaging instance. Resolves
 * `null` when unavailable for any reason (missing config, unsupported
 * browser, SDK-level `isSupported()` false).
 */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (!isPushAvailable()) return null;
  if (!messagingPromise) {
    messagingPromise = (async () => {
      const [{ initializeApp, getApps }, { getMessaging, isSupported }] =
        await Promise.all([import("firebase/app"), import("firebase/messaging")]);
      if (!(await isSupported())) return null;
      const { apiKey, authDomain, projectId, messagingSenderId, appId } =
        ENV.FIREBASE;
      const app =
        getApps()[0] ??
        initializeApp({ apiKey, authDomain, projectId, messagingSenderId, appId });
      return getMessaging(app);
    })().catch(() => null);
  }
  return messagingPromise;
}

/**
 * Register (idempotent) our push service worker and wait until it's
 * active — `getToken()` needs an activated worker to subscribe on.
 */
async function getSwRegistration(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register(SW_PATH);
  // `navigator.serviceWorker.ready` can hang on a registration with a
  // different scope; poll this registration's own lifecycle instead.
  if (registration.active) return registration;
  await new Promise<void>((resolve) => {
    const worker = registration.installing ?? registration.waiting;
    if (!worker) {
      resolve();
      return;
    }
    const onState = () => {
      if (worker.state === "activated" || worker.state === "redundant") {
        worker.removeEventListener("statechange", onState);
        resolve();
      }
    };
    worker.addEventListener("statechange", onState);
    onState();
  });
  return registration;
}

/**
 * Fetch the FCM token for this browser (creating the push subscription
 * if needed) and upsert it with the backend. Assumes Notification
 * permission is already granted. Returns false when anything in the
 * chain is unavailable.
 */
export async function obtainAndRegisterToken(): Promise<boolean> {
  const messaging = await getMessagingInstance();
  if (!messaging) return false;
  const registration = await getSwRegistration();
  const { getToken } = await import("firebase/messaging");
  const token = await getToken(messaging, {
    vapidKey: ENV.FIREBASE.vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) return false;
  const deviceId = getWebDeviceId();
  await registerPushToken({
    platform: "web",
    fcmToken: token,
    // Backend caps deviceId at 128 chars — our UUIDs are 36, but slice
    // defensively in case the cookie was ever tampered with.
    deviceId: deviceId ? deviceId.slice(0, 128) : undefined,
  });
  return true;
}

let resyncStarted = false;

/**
 * Token-refresh path: on app load, if the user already enabled push on
 * this browser and permission is granted, silently re-fetch the token
 * and re-register it (getToken is cheap; the backend upserts). Runs at
 * most once per page load; never throws.
 */
export async function resyncPushTokenOnce(): Promise<void> {
  if (resyncStarted) return;
  resyncStarted = true;
  if (!isPushAvailable()) return;
  if (Notification.permission !== "granted") return;
  if (!readPushEnabledFlag()) return;
  try {
    await obtainAndRegisterToken();
  } catch {
    // Silent — re-registration retries on the next page load.
  }
}

/**
 * Turn push off for this browser: delete the FCM token (stops delivery
 * at the FCM layer) and clear the local flag so we stop re-registering.
 */
export async function disablePushOnThisDevice(): Promise<void> {
  writePushEnabledFlag(false);
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return;
    const { deleteToken } = await import("firebase/messaging");
    await deleteToken(messaging);
  } catch {
    // Best-effort — the backend prunes tokens FCM reports as invalid.
  }
}
