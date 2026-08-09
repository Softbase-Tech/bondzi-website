import { api, requestRaw } from "./client";
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

export async function login(input: {
  email?: string;
  phone?: string;
  password: string;
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
  referralCode?: string;
  schoolName?: string;
  region?: string;
}): Promise<AuthResponse> {
  return requestRaw<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
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
