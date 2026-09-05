"use client";

/**
 * React surface over lib/push/firebase.ts. Every push UI (the
 * "Get study reminders" prompt card, the settings toggle) consumes
 * this hook so state transitions stay consistent.
 *
 * On unsupported browsers (non-PWA iOS Safari, ancient WebViews) or in
 * environments without Firebase configured, `supported` stays false and
 * `enable()` resolves "unsupported" — callers render nothing / no-op.
 *
 * Browser permission + the local opt-in flag are EXTERNAL state, so
 * they're read through `useSyncExternalStore` (server snapshot = "ssr"
 * → `ready` false during SSR/hydration, no mismatch, no setState-in-
 * effect). The store has no change events; snapshots re-read on every
 * render, and enable()/disable() end by flipping `busy`, which
 * re-renders and picks up the new permission/flag.
 */

import { useCallback, useState, useSyncExternalStore } from "react";
import {
  disablePushOnThisDevice,
  isPushAvailable,
  obtainAndRegisterToken,
  readPushEnabledFlag,
  writePushEnabledFlag,
} from "./firebase";

export type EnablePushResult =
  | "enabled"
  /** The user clicked "Block" (or had blocked before). */
  | "denied"
  /** The user closed the browser prompt without choosing. */
  | "dismissed"
  | "unsupported"
  | "error";

export interface PushNotificationsState {
  /** Client-side detection has run — render nothing until true to avoid hydration flicker. */
  ready: boolean;
  /** Browser supports push AND Firebase env is configured. */
  supported: boolean;
  permission: NotificationPermission;
  /** Permission granted AND the user opted in on this browser. */
  enabled: boolean;
  /** An enable/disable call is in flight. */
  busy: boolean;
  enable: () => Promise<EnablePushResult>;
  disable: () => Promise<void>;
}

const SSR_SNAPSHOT = "ssr";
const UNSUPPORTED_SNAPSHOT = "unsupported";

/** No change events to subscribe to — snapshots re-read per render. */
const subscribeNoop = () => () => {};

function getClientSnapshot(): string {
  if (!isPushAvailable()) return UNSUPPORTED_SNAPSHOT;
  const permission = Notification.permission;
  const optedIn = permission === "granted" && readPushEnabledFlag();
  return `${permission}:${optedIn ? "1" : "0"}`;
}

function getServerSnapshot(): string {
  return SSR_SNAPSHOT;
}

export function usePushNotifications(): PushNotificationsState {
  const snapshot = useSyncExternalStore(
    subscribeNoop,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [busy, setBusy] = useState(false);

  const ready = snapshot !== SSR_SNAPSHOT;
  const supported = ready && snapshot !== UNSUPPORTED_SNAPSHOT;
  let permission: NotificationPermission = "default";
  let enabled = false;
  if (supported) {
    const [perm, flag] = snapshot.split(":");
    permission = perm as NotificationPermission;
    enabled = flag === "1";
  }

  const enable = useCallback(async (): Promise<EnablePushResult> => {
    if (!isPushAvailable()) return "unsupported";
    setBusy(true);
    try {
      // Explicit user gesture required before we ever get here — the
      // browser prompt must NEVER fire on page load.
      const perm = await Notification.requestPermission();
      if (perm === "denied") return "denied";
      if (perm !== "granted") return "dismissed";
      const registered = await obtainAndRegisterToken();
      if (!registered) return "error";
      writePushEnabledFlag(true);
      return "enabled";
    } catch {
      return "error";
    } finally {
      // Also refreshes the snapshot read above via the re-render.
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async (): Promise<void> => {
    setBusy(true);
    try {
      await disablePushOnThisDevice();
    } finally {
      setBusy(false);
    }
  }, []);

  return { ready, supported, permission, enabled, busy, enable, disable };
}
