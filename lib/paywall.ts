"use client";

import { ApiError } from "@/lib/api/client";

/**
 * Backend gates content with `403 Forbidden` (entitlement missing)
 * and `429 Too Many Requests` (daily-quota exhausted on tier). Both
 * mean "the user needs to upgrade / redeem XP" — no 402 anywhere.
 *
 * This helper centralises detection so exam/practice/quiz launchers
 * don't each grow bespoke error-code checks. Callers pass the error
 * they caught + a `push` function (typically `router.push` from
 * next/navigation) and get a boolean back saying whether they need to
 * surface a fallback error themselves.
 */
export function isPaywallError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 403 || err.status === 429);
}

/**
 * If the error should trigger the paywall, route the user to the
 * plans page (deep-linked back to `returnTo` after purchase) and
 * return true. Otherwise return false and let the caller surface an
 * inline error.
 */
export function handlePaywallError(
  err: unknown,
  navigate: (href: string) => void,
  returnTo?: string,
): boolean {
  if (!isPaywallError(err)) return false;
  const suffix = returnTo
    ? `?returnTo=${encodeURIComponent(returnTo)}`
    : "";
  navigate(`/subscription/plans${suffix}`);
  return true;
}
