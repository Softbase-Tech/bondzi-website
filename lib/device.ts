"use client";

/**
 * Web-side equivalent of mobile's `lib/device.ts`. The backend enforces
 * single-active-session by binding tokens to an `X-Device-ID` header;
 * mobile stores its device id in SecureStore + MMKV. On web the closest
 * we have to a stable, per-install identifier is a first-party cookie
 * (survives refreshes and tab restarts, cleared only when the user
 * explicitly clears site data).
 *
 * Persistence uses `document.cookie` (not localStorage) because we want
 * the id available in Server Actions and route handlers via the standard
 * cookie header — the same id must reach the axios request interceptor
 * running client-side AND the NextAuth Credentials provider running on
 * the server during login.
 */

const COOKIE_NAME = "bondzi_web_device_id";
// 5 years. The id is not a secret; the goal is stability across app
// restarts, not confidentiality. Longer than the JWT refresh TTL so a
// user re-logging-in months later reuses the same device row.
const COOKIE_MAX_AGE_SECONDS = 5 * 365 * 24 * 60 * 60;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const pairs = document.cookie.split("; ");
  for (const pair of pairs) {
    if (pair.startsWith(prefix)) {
      return decodeURIComponent(pair.slice(prefix.length));
    }
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") return;
  // `SameSite=Lax` is the tightest that still lets the cookie ride on
  // top-level navigations after Paystack redirects. `Secure` is safe on
  // localhost (browsers ignore it when `NODE_ENV=development` on http)
  // and mandatory on production HTTPS.
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
    "SameSite=Lax",
  ];
  if (isSecure) parts.push("Secure");
  document.cookie = parts.join("; ");
}

/**
 * v4 UUID with `crypto.randomUUID()` when available, else a
 * time-mixed Math.random fallback. Same layout as mobile's fallback so
 * the backend's device_sessions table sees consistent UUID shapes.
 */
function randomUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  let now = Date.now();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16 + now) % 16 | 0;
    now = Math.floor(now / 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get (or create + persist) the stable device id for this browser.
 * Safe to call from any client component; returns null during SSR
 * (callers must guard).
 */
export function getWebDeviceId(): string | null {
  if (typeof document === "undefined") return null;
  const existing = readCookie(COOKIE_NAME);
  if (existing && existing.length > 0) return existing;
  const fresh = randomUuid();
  writeCookie(COOKIE_NAME, fresh, COOKIE_MAX_AGE_SECONDS);
  return fresh;
}

/**
 * Human-friendly name for the `X-Device-Name` header. Best-effort —
 * used only for admin/support display in device_sessions, never for
 * authentication.
 */
export function getWebDeviceName(): string {
  if (typeof navigator === "undefined") return "Web · Bondzi";
  const ua = navigator.userAgent;
  const isMobile = /Mobi|Android|iPhone|iPad/.test(ua);
  return isMobile ? "Web Mobile · Bondzi" : "Web · Bondzi";
}

export const WEB_DEVICE_COOKIE_NAME = COOKIE_NAME;
