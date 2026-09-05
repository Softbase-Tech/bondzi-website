/**
 * Runtime env access, centralised so a missing var throws once at boot
 * rather than manifesting as a mysterious 401 in production.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time — safe to expose,
 * meant to be read from the browser. Server-only secrets
 * (NEXTAUTH_SECRET) MUST NOT carry the NEXT_PUBLIC_ prefix.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    // Only throw on the server. Client bundles inline the value at build
    // time; if it's missing at build, Next will substitute `undefined`
    // and the deployment is broken regardless.
    if (typeof window === "undefined") {
      throw new Error(
        `Missing required environment variable: ${name}. See .env.example.`,
      );
    }
    return "";
  }
  return value;
}

export const ENV = {
  API_URL:
    process.env.NEXT_PUBLIC_API_URL ??
    "https://api.bondzi.online/api/v1",
  AUTH_SECRET: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "",
  AUTH_URL: process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "",
  APP_ENV:
    (process.env.NEXT_PUBLIC_APP_ENV as
      | "development"
      | "preview"
      | "production") ?? "development",
  /**
   * Paystack public key for Ghana — safe to embed. Used by the Inline
   * JS popup on the Plans page. Backend re-verifies every transaction
   * against Paystack server-to-server with the SECRET key, so a
   * tampered public key just fails backend's amount/status check.
   *
   * Value should match the mobile app's EXPO_PUBLIC_PAYSTACK_KEY_GH.
   */
  PAYSTACK_PUBLIC_KEY_GH: process.env.NEXT_PUBLIC_PAYSTACK_KEY_GH ?? "",
  /**
   * Play Store listing URL. EMPTY UNTIL THE LISTING IS LIVE.
   *
   * Acts as the launch switch for the Android CTA: while it's blank the
   * marketing site shows a non-linking "coming to Play Store" note, and
   * the moment it's set the button becomes a real Play link carrying an
   * encoded `referrer` so the campaign survives the install (read back
   * in-app via the Play Install Referrer API).
   *
   * Deliberately not defaulted to a guessed play.google.com URL — a
   * dead store link is worse than no link.
   *
   * e.g. https://play.google.com/store/apps/details?id=com.bondzi.app
   */
  PLAY_STORE_URL: process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? "",
  /**
   * Firebase web config — used ONLY for Cloud Messaging (browser push).
   * Same Firebase project the mobile app uses; the backend delivers
   * pushes through firebase-admin against it. All values are public
   * identifiers (safe to inline in the client bundle).
   *
   * Deliberately optional: when any of these is unset the push layer
   * reports "not configured" and every hook/UI surface no-ops, so dev
   * environments without Firebase never crash.
   */
  FIREBASE: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    /** Web Push certificate key pair (Firebase console → Cloud Messaging). */
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "",
  },
};

/**
 * Server-only assertion — call from Server Components / Route Handlers /
 * server actions to fail loud when required secrets are missing.
 * Silently OK'd in the client bundle because `AUTH_SECRET` is
 * server-only.
 */
export function assertServerEnv(): void {
  required("NEXTAUTH_SECRET", ENV.AUTH_SECRET);
}
