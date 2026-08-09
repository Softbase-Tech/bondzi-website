import { requestRaw } from "./client";
import type { AuthResponse, TokenPair } from "./types";

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
