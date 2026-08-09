import { api, apiServer } from "./client";
import type { ReferralEvent, ReferralStats } from "./types";

/**
 * Referral reads. All XP awarding is server-side (post-registration
 * hook + post-exam qualification check) — the client only shows the
 * current state.
 *
 * NOTE: the backend does not return the referred user's name on the
 * events endpoint (privacy / avoids a join). Renders should degrade to
 * "Friend" the same way mobile does.
 */

export async function getMyReferralStatsServer(
  accessToken: string,
): Promise<ReferralStats> {
  return apiServer<ReferralStats>(accessToken, "/referrals/me");
}

export async function getMyReferralStats(): Promise<ReferralStats> {
  return api<ReferralStats>("/referrals/me");
}

export async function listMyReferralEventsServer(
  accessToken: string,
): Promise<ReferralEvent[]> {
  return apiServer<ReferralEvent[]>(accessToken, "/referrals/events");
}

export async function listMyReferralEvents(): Promise<ReferralEvent[]> {
  return api<ReferralEvent[]>("/referrals/events");
}

/**
 * XP amounts + share message — kept in one place so tweaks don't drift
 * across the referral page, home nudge, and future email templates.
 * These are display-only defaults; the actual award amounts live on
 * the backend (event keys `referral_referred` / `referral_qualified`).
 */
export const REFERRAL_REWARDS = {
  signupXp: 50,
  qualifyXp: 100,
  qualifyThreshold: 10,
} as const;

export const REFERRAL_SHARE_TEMPLATE =
  "Join me on Bondzi Ghana and ace your exams. Use my code {code} when you sign up — we both earn XP. https://bondzi.online";

/**
 * Normalise a referral code for display + sharing. Strips the legacy
 * `PM-` prefix and any dashes so pre-migration codes stored in the
 * DB read the same as new ones on-screen. Safe to run on already-
 * normalised codes (no-op). Kept here so every consumer — panel,
 * clipboard copy, share message — goes through the same funnel.
 */
export function normalizeReferralCode(code: string): string {
  return (code ?? "")
    .trim()
    .toUpperCase()
    .replace(/^PM-/, "")
    .replace(/-/g, "");
}

export function buildReferralMessage(code: string): string {
  return REFERRAL_SHARE_TEMPLATE.replace(
    "{code}",
    normalizeReferralCode(code),
  );
}
