import { api, apiServer, ApiError } from "./client";
import type {
  CreateReferralCodePayload,
  PartnerAppeal,
  PartnerBanner,
  PartnerCommission,
  PartnerPayout,
  PartnerPayoutPreview,
  PartnerProfile,
  PartnerReferralCode,
  PartnerReferralSort,
  PartnerReferralsResult,
  PartnerTerms,
  RegisterPartnerPayload,
  SubmitAppealPayload,
  UpdatePartnerMomoPayload,
} from "./types";

/**
 * Partner portal API. Every call goes to `/partner/*` on the backend.
 * Backend gates the routes:
 *   - Register / current terms   → JwtAuthGuard only (any signed-in user)
 *   - Everything else            → JwtAuthGuard + PartnerAuthGuard
 * A 404/403 on the profile endpoints means "you're logged in but not
 * registered as a partner" — callers translate that into a "start here"
 * empty state.
 */

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * `GET /partner/me` — the partner profile for the signed-in user.
 * Returns null if the user isn't a partner yet (so the portal can
 * show the "register as partner" screen instead of erroring).
 */
export async function getMyPartner(
  accessToken: string,
): Promise<PartnerProfile | null> {
  try {
    return await apiServer<PartnerProfile>(accessToken, "/partner/me");
  } catch (err) {
    if (isNotPartner(err)) return null;
    throw err;
  }
}

/** Client-side variant for use inside React Query hooks. */
export async function getMyPartnerClient(): Promise<PartnerProfile | null> {
  try {
    return await api<PartnerProfile>("/partner/me");
  } catch (err) {
    if (isNotPartner(err)) return null;
    throw err;
  }
}

/**
 * `GET /partner/terms/current` — the terms version currently in force.
 * Used by the register-as-partner form (show the agreement) and by the
 * dashboard footer (link to the version the partner agreed to).
 * No PartnerAuthGuard on this route — any signed-in user can read.
 */
export async function getCurrentPartnerTerms(
  accessToken: string,
): Promise<PartnerTerms> {
  return apiServer<PartnerTerms>(accessToken, "/partner/terms/current");
}

export async function getCurrentPartnerTermsClient(): Promise<PartnerTerms> {
  return api<PartnerTerms>("/partner/terms/current");
}

export async function listMyReferralCodes(
  accessToken: string,
): Promise<PartnerReferralCode[]> {
  return apiServer<PartnerReferralCode[]>(accessToken, "/partner/codes");
}

export async function listMyReferralCodesClient(): Promise<
  PartnerReferralCode[]
> {
  return api<PartnerReferralCode[]>("/partner/codes");
}

export async function listMyPayouts(
  accessToken: string,
): Promise<PartnerPayout[]> {
  return apiServer<PartnerPayout[]>(accessToken, "/partner/payouts");
}

export async function listMyPayoutsClient(): Promise<PartnerPayout[]> {
  return api<PartnerPayout[]>("/partner/payouts");
}

export async function getMyPayoutPreview(
  accessToken: string,
): Promise<PartnerPayoutPreview> {
  return apiServer<PartnerPayoutPreview>(
    accessToken,
    "/partner/payouts/preview",
  );
}

export async function getMyPayoutPreviewClient(): Promise<PartnerPayoutPreview> {
  return api<PartnerPayoutPreview>("/partner/payouts/preview");
}

/**
 * Convenience — surface the partner's own commission stream. Backend
 * doesn't expose a partner-side `GET /partner/commissions` yet (Phase 3
 * only wired admin listing), so this is a stub that returns an empty
 * array until the endpoint lands. Kept here so pages import from a
 * single module.
 */
export async function listMyCommissionsClient(): Promise<PartnerCommission[]> {
  try {
    return await api<PartnerCommission[]>("/partner/commissions");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Referrals
// ---------------------------------------------------------------------------

/**
 * `GET /partner/referrals` — every user attributed to the signed-in
 * partner with per-user engagement, paid-Plus, and commission summary.
 * Optional `codeId` filter and `sort` (recent | engaged | earning).
 */
export async function listMyReferrals(
  accessToken: string,
  opts: { codeId?: string; sort?: PartnerReferralSort } = {},
): Promise<PartnerReferralsResult> {
  const path = buildReferralsPath(opts);
  return apiServer<PartnerReferralsResult>(accessToken, path);
}

export async function listMyReferralsClient(
  opts: { codeId?: string; sort?: PartnerReferralSort } = {},
): Promise<PartnerReferralsResult> {
  return api<PartnerReferralsResult>(buildReferralsPath(opts));
}

function buildReferralsPath(opts: {
  codeId?: string;
  sort?: PartnerReferralSort;
}): string {
  const params = new URLSearchParams();
  if (opts.codeId) params.set("codeId", opts.codeId);
  if (opts.sort) params.set("sort", opts.sort);
  const q = params.toString();
  return q ? `/partner/referrals?${q}` : "/partner/referrals";
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function registerAsPartner(
  payload: RegisterPartnerPayload,
): Promise<PartnerProfile> {
  return api<PartnerProfile>("/partner/register", {
    method: "POST",
    body: payload,
  });
}

export async function updateMyMomo(
  payload: UpdatePartnerMomoPayload,
): Promise<PartnerProfile> {
  return api<PartnerProfile>("/partner/me/momo", {
    method: "PATCH",
    body: payload,
  });
}

export async function createReferralCode(
  payload: CreateReferralCodePayload,
): Promise<PartnerReferralCode> {
  return api<PartnerReferralCode>("/partner/codes", {
    method: "POST",
    body: payload,
  });
}

export async function deactivateReferralCode(
  id: string,
): Promise<PartnerReferralCode> {
  return api<PartnerReferralCode>(
    `/partner/codes/${encodeURIComponent(id)}/deactivate`,
    { method: "PATCH" },
  );
}

export async function reactivateReferralCode(
  id: string,
): Promise<PartnerReferralCode> {
  return api<PartnerReferralCode>(
    `/partner/codes/${encodeURIComponent(id)}/reactivate`,
    { method: "PATCH" },
  );
}

// ---------------------------------------------------------------------------
// Appeals
// ---------------------------------------------------------------------------

export async function listMyAppeals(
  accessToken: string,
): Promise<PartnerAppeal[]> {
  return apiServer<PartnerAppeal[]>(accessToken, "/partner/appeals");
}

export async function listMyAppealsClient(): Promise<PartnerAppeal[]> {
  return api<PartnerAppeal[]>("/partner/appeals");
}

export async function submitAppeal(
  payload: SubmitAppealPayload,
): Promise<PartnerAppeal> {
  return api<PartnerAppeal>("/partner/appeals", {
    method: "POST",
    body: payload,
  });
}

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

export async function listBanners(
  accessToken: string,
): Promise<PartnerBanner[]> {
  return apiServer<PartnerBanner[]>(accessToken, "/partner/banners");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * The "you're logged in but not a partner" case shows up as either a
 * 403 (PartnerAuthGuard refused) or a 404 (the route bounced upstream).
 * Kept as one predicate so callers don't have to remember both.
 */
export function isNotPartner(err: unknown): boolean {
  return (
    err instanceof ApiError && (err.status === 403 || err.status === 404)
  );
}
