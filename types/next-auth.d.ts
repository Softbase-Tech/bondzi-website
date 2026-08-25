import type { DefaultSession } from "next-auth";
import type { SafeUser } from "@/lib/api/types";

/**
 * Extends NextAuth's built-in `Session` + JWT types so `session.accessToken`,
 * `session.profile`, and `session.error` are strongly typed everywhere they
 * appear (server actions, `useSession()`, `auth()`).
 *
 * The fields are set by the `jwt` + `session` callbacks in `lib/auth/config.ts`.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    /** Bearer token to send on API calls. Rotates via NextAuth's jwt callback. */
    accessToken?: string;
    /** Full SafeUser profile as returned by /auth/login and refreshed by /auth/me. */
    profile?: SafeUser;
    /**
     * Set by the jwt callback when a refresh fails. Values:
     *   - "DeviceKicked"          — DEVICE_KICKED code from backend rotate
     *   - "RefreshTokenExpired"   — refresh has passed its expiry timestamp
     *   - "RefreshFailed"         — generic refresh failure
     *   - "MissingTokens"         — session missing the necessary token fields
     */
    error?:
      | "DeviceKicked"
      | "RefreshTokenExpired"
      | "RefreshFailed"
      | "MissingTokens";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessExpiresAt?: string;
    refreshExpiresAt?: string;
    profile?: SafeUser;
    /**
     * Epoch ms when `profile` was last read from `/auth/me`. Drives the
     * staleness check in the jwt callback — without it the profile was
     * a sign-in snapshot that never changed for the 90-day life of the
     * session.
     */
    profileFetchedAt?: number;
    error?:
      | "DeviceKicked"
      | "RefreshTokenExpired"
      | "RefreshFailed"
      | "MissingTokens";
  }
}
