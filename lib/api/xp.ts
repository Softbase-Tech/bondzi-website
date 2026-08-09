import { api, apiServer } from "./client";
import type {
  XpRedeemResult,
  XpRedemptionTier,
  XpWalletSnapshot,
} from "./types";

/**
 * XP economy. Tiers are admin-editable rows in the DB — no client-side
 * pricing constants. `POST /xp/redeem` is transactional server-side:
 * it debits `spendable_xp`, writes the ledger row, and extends /
 * inserts the subscription row atomically.
 *
 * Note the shape of the redeem response comes DIRECTLY from the
 * backend — the mobile app has a stale type here. The web uses the
 * real fields: `xpSpent`, `creditDays`, `newSpendableXp`,
 * `subscriptionExpiresAt`.
 */

export async function getXpWalletServer(
  accessToken: string,
): Promise<XpWalletSnapshot> {
  return apiServer<XpWalletSnapshot>(accessToken, "/xp");
}

export async function getXpWallet(): Promise<XpWalletSnapshot> {
  return api<XpWalletSnapshot>("/xp");
}

export async function listXpTiersServer(
  accessToken: string,
): Promise<XpRedemptionTier[]> {
  return apiServer<XpRedemptionTier[]>(accessToken, "/xp/tiers");
}

export async function listXpTiers(): Promise<XpRedemptionTier[]> {
  return api<XpRedemptionTier[]>("/xp/tiers");
}

export async function redeemXp(tierKey: string): Promise<XpRedeemResult> {
  return api<XpRedeemResult>("/xp/redeem", {
    method: "POST",
    body: { tierKey },
  });
}
