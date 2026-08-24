import { ApiError, api, requestRaw } from "./client";
import type { AuthResponse, SafeUser, TokenPair } from "./types";

/**
 * Auth service — the endpoints the NextAuth Credentials provider
 * and the (auth) screens (register / OTP / forgot / reset) hit
 * directly.
 *
 * These wrappers use `requestRaw` because the NextAuth Credentials
 * `authorize()` runs BEFORE a session exists — the higher-level `api()`
 * helper which reads the session would loop.
 */

/**
 * `POST /auth/login` — backend requires `deviceId` either via the
 * `X-Device-ID` header or in the body. NextAuth's authorize() runs
 * server-side (no browser cookies to read), so we forward it in the
 * body and let the client-side call site (LoginForm) supply the
 * value from `getWebDeviceId()`.
 */
export async function login(input: {
  email?: string;
  phone?: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
}): Promise<AuthResponse> {
  return requestRaw<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function register(input: {
  fullName: string;
  username: string;
  email: string;
  emailOtp: string;
  password: string;
  examType: "bece" | "wassce" | "novdec";
  formLevel?: 1 | 2 | 3;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  dateOfBirth?: string;
  /** Student XP referral code (resolves against `users.referral_code`). */
  referralCode?: string;
  /**
   * Partner referral code (resolves against `partner_referral_codes`).
   * A different system from `referralCode` above — separate table,
   * separate rewards. Both are sent because the backend no-ops
   * silently on a code it can't resolve, so a student who types one
   * code into the single visible field gets credited to whichever
   * system it actually belongs to.
   */
  partnerReferralCode?: string;
  schoolName?: string;
  region?: string;
  deviceId?: string;
  deviceName?: string;
  // First-touch acquisition attribution. Every field is optional and
  // must exist on the backend's SignupAttributionDto — the API runs
  // `forbidNonWhitelisted`, so an unknown key 400s the registration.
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  signupReferrer?: string;
}): Promise<AuthResponse> {
  try {
    return await requestRaw<AuthResponse>("/auth/register", {
      method: "POST",
      body: input,
    });
  } catch (err) {
    // FORWARD-COMPATIBILITY GUARD.
    //
    // The API validates with `forbidNonWhitelisted: true`, which means
    // an unrecognised property doesn't get ignored — it 400s the whole
    // registration. The attribution fields land in a separate backend
    // release, so between this deploy and that one every signup
    // carrying a campaign (or merely an external referrer) would fail.
    //
    // Rather than couple two deploys together, detect that specific
    // rejection and retry once without the attribution. Costs one
    // wasted round-trip on an old backend, nothing on a new one, and
    // it starts working by itself the moment the API ships — no flag
    // to remember to flip.
    //
    // Safe to delete once the attribution release is live everywhere.
    if (!rejectsAttribution(err)) throw err;
    const retry = { ...input };
    for (const key of ATTRIBUTION_KEYS) delete retry[key];
    return requestRaw<AuthResponse>("/auth/register", {
      method: "POST",
      body: retry,
    });
  }
}

const ATTRIBUTION_KEYS = [
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmContent",
  "utmTerm",
  "signupReferrer",
] as const;

/**
 * True when a 400 is specifically class-validator complaining about the
 * attribution properties ("property utmSource should not exist"), as
 * opposed to a real validation failure the user needs to see.
 */
function rejectsAttribution(err: unknown): boolean {
  if (!(err instanceof ApiError) || err.status !== 400) return false;
  const message = err.body?.message;
  const text = Array.isArray(message) ? message.join(" ") : (message ?? "");
  return ATTRIBUTION_KEYS.some((key) => text.includes(key));
}

export async function refreshTokens(
  refreshToken: string,
): Promise<TokenPair> {
  return requestRaw<TokenPair>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
}

export async function requestEmailOtp(input: {
  email: string;
  recipientName?: string;
}): Promise<{ expiresInSeconds: number }> {
  return requestRaw<{ expiresInSeconds: number }>("/auth/email/otp/send", {
    method: "POST",
    body: {
      email: input.email.trim().toLowerCase(),
      recipientName: input.recipientName?.trim() || undefined,
    },
  });
}

export async function forgotPassword(input: {
  email?: string;
  phone?: string;
}): Promise<void> {
  const body: Record<string, string> = {};
  if (input.email) body.email = input.email.trim().toLowerCase();
  if (input.phone) body.phone = input.phone.trim();
  await requestRaw<void>("/auth/forgot-password", {
    method: "POST",
    body,
    raw: true,
  });
}

export async function resetPassword(input: {
  email?: string;
  phone?: string;
  otp: string;
  password: string;
}): Promise<void> {
  await requestRaw<void>("/auth/reset-password", {
    method: "POST",
    body: input,
    raw: true,
  });
}

export async function verifyEmailCode(
  code: string,
  accessToken: string,
): Promise<void> {
  await requestRaw<void>("/auth/email/verify", {
    method: "POST",
    body: { code },
    accessToken,
    raw: true,
  });
}

export async function requestEmailVerification(
  accessToken: string,
): Promise<void> {
  await requestRaw<void>("/auth/email/verify-request", {
    method: "POST",
    body: {},
    accessToken,
    raw: true,
  });
}

export async function logout(
  refreshToken: string | undefined,
  accessToken: string,
): Promise<void> {
  await requestRaw<void>("/auth/logout", {
    method: "POST",
    body: refreshToken ? { refreshToken } : {},
    accessToken,
    raw: true,
  });
}

/**
 * Sign the user out of every device session (client-side call — no
 * refresh-token arg because backend uses `user.id` from the JWT to
 * revoke everything).
 */
export async function logoutAll(): Promise<void> {
  await api<void>("/auth/logout-all", { method: "POST", body: {}, raw: true });
}

/**
 * `PATCH /users/me/password` — requires the CURRENT password.
 * Backend returns 204 on success; 401 when the current password is
 * wrong or the account has no password hash (Google-only); 400 when
 * the new password equals the current one.
 */
export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api<void>("/users/me/password", {
    method: "PATCH",
    body: input,
    raw: true,
  });
}

export type ExamType = "bece" | "wassce" | "novdec";

/**
 * `PATCH /auth/me/exam-type` — throttled 3/hour by the backend.
 * Returns fresh tokens ONLY when examType actually changed (the JWT
 * bakes examType + per-level entitlement). formLevel-only changes
 * return `tokens: null`, so the caller doesn't need to rotate.
 */
export async function updateExamType(input: {
  examType: ExamType;
  formLevel: number | null;
}): Promise<{ user: SafeUser; tokens: TokenPair | null }> {
  return api<{ user: SafeUser; tokens: TokenPair | null }>(
    "/auth/me/exam-type",
    { method: "PATCH", body: input },
  );
}

/**
 * `GET /auth/username/available` — public, rate-limited. Returns
 * `available: false` with a machine-readable reason so the form can
 * render specific copy.
 */
export interface UsernameAvailability {
  available: boolean;
  reason?: "too_short" | "too_long" | "invalid_chars" | "reserved" | "taken";
  message?: string;
}
export async function checkUsernameAvailable(
  username: string,
): Promise<UsernameAvailability> {
  return requestRaw<UsernameAvailability>("/auth/username/available", {
    query: { q: username },
  });
}
