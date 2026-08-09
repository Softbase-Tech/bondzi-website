import { apiServer } from "./client";
import type { Subscription } from "./types";

/**
 * Read-only subscription surface. Phase 6 adds the write side (initiate
 * Paystack, verify, cancel); Phase 4 only needs to *know* the current
 * tier so Quiz / Mock exam / Level test paywalls can be shown at the
 * right moment.
 */
export async function getMySubscription(
  accessToken: string,
): Promise<Subscription | null> {
  // The backend returns `null` (as a JSON literal) for free-tier users
  // rather than a 404 — the fetch helper unwraps `{ data: null }` to
  // `null` naturally so the branch below is symbolic more than
  // functional, but explicit is friendly to future readers.
  try {
    return await apiServer<Subscription | null>(
      accessToken,
      "/subscriptions/me",
    );
  } catch {
    // Any read failure degrades to "unknown" — callers treat that as
    // free tier so the paywall shows. Never lock a paid user out over
    // a transient 5xx.
    return null;
  }
}

/**
 * Match mobile's `useAuthStore.isPro()`. A subscription unlocks Pro
 * features when:
 *   - status is `active` or `xp_credited` (redeemed via XP counts as
 *     active for gate purposes)
 *   - AND account is `plus` or `pro` (or the legacy plan flag is
 *     non-free — kept for accounts predating the account column)
 */
export function isPro(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  if (
    subscription.status !== "active" &&
    subscription.status !== "xp_credited"
  ) {
    return false;
  }
  if (subscription.account === "plus" || subscription.account === "pro") {
    return true;
  }
  return subscription.plan !== "free";
}
