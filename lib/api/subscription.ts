import { api, apiServer, ApiError } from "./client";
import type {
  BillingInterval,
  CheckoutInProgressError,
  ExamType,
  InitiateSubscriptionResponse,
  Subscription,
  SubscriptionEntitlement,
} from "./types";

/**
 * One row of the user-facing payment history (Settings → Subscription →
 * Payment history). Mirrors `payment_attempts` — every checkout attempt,
 * regardless of outcome.
 */
export type PaymentAttemptStatusView =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "abandoned";

export interface PaymentAttemptView {
  id: string;
  status: PaymentAttemptStatusView;
  amountGhs: number;
  currency: string;
  initiatedAt: string;
  resolvedAt: string | null;
  billingInterval: "monthly" | "six_month" | "annual" | null;
  planName: string | null;
  account: "plus" | "pro" | null;
  level: ExamType | null;
  reference: string;
  failureReason: string | null;
  /**
   * True when the backend flagged this attempt as a duplicate Plus
   * charge for a level the user already owned. `autoRefundOutcome`
   * reflects Paystack's response — we surface a distinct "Refund
   * pending" / "processing" pill so the user isn't shown two identical
   * paid receipts.
   */
  alarmDuplicatePlus: boolean;
  autoRefundOutcome: "refunded" | "pending" | "failed" | null;
}

interface BackendPaymentAttempt {
  id: string;
  status: PaymentAttemptStatusView;
  amountGhs: string | number;
  currency?: string;
  initiatedAt: string;
  paidAt?: string | null;
  failedAt?: string | null;
  refundedAt?: string | null;
  abandonedAt?: string | null;
  billingInterval?: "monthly" | "six_month" | "annual" | null;
  providerReference: string;
  failureReason?: string | null;
  metadata?: {
    alarmDuplicatePlus?: boolean;
    autoRefundOutcome?: "refunded" | "pending" | "failed";
  } | null;
  plan?: {
    id: string;
    name: string;
    account: "plus" | "pro";
    level: ExamType;
  } | null;
}

function mapPaymentAttempt(row: BackendPaymentAttempt): PaymentAttemptView {
  const meta = row.metadata ?? null;
  const alarmDuplicatePlus = meta?.alarmDuplicatePlus === true;
  const autoRefundOutcome = alarmDuplicatePlus
    ? meta?.autoRefundOutcome ?? null
    : null;
  return {
    id: row.id,
    status: row.status,
    amountGhs:
      typeof row.amountGhs === "string"
        ? parseFloat(row.amountGhs)
        : row.amountGhs,
    currency: row.currency ?? "GHS",
    initiatedAt: row.initiatedAt,
    resolvedAt:
      row.paidAt ?? row.failedAt ?? row.refundedAt ?? row.abandonedAt ?? null,
    billingInterval: row.billingInterval ?? null,
    planName: row.plan?.name ?? null,
    account: row.plan?.account ?? null,
    level: row.plan?.level ?? null,
    reference: row.providerReference,
    failureReason: row.failureReason ?? null,
    alarmDuplicatePlus,
    autoRefundOutcome,
  };
}

export interface PaymentHistoryPage {
  items: PaymentAttemptView[];
  total: number;
}

/**
 * `GET /payments/me?limit=&offset=` — paged list of the caller's
 * payment attempts, newest first. Returns `{items,total}`; caller pages
 * by summing `items.length` across loaded pages.
 */
export async function listMyPaymentHistoryServer(
  accessToken: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<PaymentHistoryPage> {
  const limit = opts.limit ?? 25;
  const offset = opts.offset ?? 0;
  const raw = await apiServer<{ items: BackendPaymentAttempt[]; total: number }>(
    accessToken,
    `/payments/me?limit=${limit}&offset=${offset}`,
  );
  return { items: raw.items.map(mapPaymentAttempt), total: raw.total };
}

export async function listMyPaymentHistory(
  opts: { limit?: number; offset?: number } = {},
): Promise<PaymentHistoryPage> {
  const limit = opts.limit ?? 25;
  const offset = opts.offset ?? 0;
  const raw = await api<{ items: BackendPaymentAttempt[]; total: number }>(
    `/payments/me?limit=${limit}&offset=${offset}`,
  );
  return { items: raw.items.map(mapPaymentAttempt), total: raw.total };
}

/**
 * Subscription reads + writes. The backend is the source of truth for
 * pricing, activation, and expiry — client never mutates plan/expiry
 * fields directly.
 *
 * Payment flow (Phase 6):
 *   1. initiateSubscription → { authorizationUrl, reference }
 *   2. Paystack Inline JS popup with the same reference
 *   3. verifySubscription(reference) — backend re-verifies with
 *      Paystack server-to-server and activates. Webhook is a full
 *      fallback if the client's verify call never lands.
 */

export async function getMySubscription(
  accessToken: string,
): Promise<Subscription | null> {
  try {
    return await apiServer<Subscription | null>(
      accessToken,
      "/subscriptions/me",
    );
  } catch {
    return null;
  }
}

/** Client-side variant — used after verify to refresh the current view. */
export async function getMySubscriptionClient(): Promise<Subscription | null> {
  try {
    return await api<Subscription | null>("/subscriptions/me");
  } catch {
    return null;
  }
}

export async function listEntitlementsServer(
  accessToken: string,
): Promise<SubscriptionEntitlement[]> {
  return apiServer<SubscriptionEntitlement[]>(
    accessToken,
    "/subscriptions/entitlements",
  );
}

export async function listEntitlements(): Promise<SubscriptionEntitlement[]> {
  return api<SubscriptionEntitlement[]>("/subscriptions/entitlements");
}

/**
 * `POST /subscriptions/initiate` — creates a PENDING payment_attempts
 * row server-side and returns a Paystack authorization URL + the
 * reference we'll pass to Inline JS.
 *
 * `interval` MUST be omitted for Plus (one_time) and MUST be present
 * for Pro. Backend 400s on wrong combo.
 */
export interface InitiatePayload {
  planId: string;
  interval?: BillingInterval;
  promoCode?: string;
}

export async function initiateSubscription(
  payload: InitiatePayload,
): Promise<InitiateSubscriptionResponse> {
  return api<InitiateSubscriptionResponse>("/subscriptions/initiate", {
    method: "POST",
    body: payload,
  });
}

/**
 * `POST /subscriptions/verify` — idempotent; if the webhook has
 * already activated, this returns the resolved subscription.
 * Amount cross-check runs server-side.
 */
export async function verifySubscription(
  reference: string,
): Promise<Subscription> {
  return api<Subscription>("/subscriptions/verify", {
    method: "POST",
    body: { reference },
  });
}

/**
 * `POST /subscriptions/cancel` — cancels the active Pro on the JWT's
 * current level. Plus rows return 400 (they're lifetime, not
 * cancellable).
 */
export async function cancelSubscription(): Promise<Subscription> {
  return api<Subscription>("/subscriptions/cancel", {
    method: "POST",
    body: {},
  });
}

/**
 * Detects the CHECKOUT_IN_PROGRESS structured 409 so callers can
 * surface a "resume the checkout you started" affordance instead of
 * a generic "already have one" toast.
 */
export function checkoutInProgressFrom(
  err: unknown,
): CheckoutInProgressError | null {
  if (!(err instanceof ApiError)) return null;
  if (err.status !== 409) return null;
  const body = err.body as unknown as CheckoutInProgressError | null;
  if (!body || body.code !== "CHECKOUT_IN_PROGRESS") return null;
  return body;
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
  return subscription.plan !== undefined && subscription.plan !== "free";
}
