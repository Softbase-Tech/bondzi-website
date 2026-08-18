import { api, apiServer } from "./client";
import type {
  AiReviewFull,
  AiReviewListItem,
  AiReviewQuota,
  GenerateAiReviewResult,
  PaginatedResult,
} from "./types";

/**
 * AI Study Review — the on-demand, monthly-metered study report. Reviews are
 * never auto-generated; only `generate()` writes one, and the monthly
 * allowance (Plus/Pro; Free is locked) does not carry forward.
 */

// --- Reads (server + client variants) --------------------------------------

export async function getAiReviewQuotaServer(
  accessToken: string,
): Promise<AiReviewQuota> {
  return apiServer<AiReviewQuota>(accessToken, "/progress/ai-reviews/quota");
}

export async function getAiReviewQuota(): Promise<AiReviewQuota> {
  return api<AiReviewQuota>("/progress/ai-reviews/quota");
}

export async function listAiReviewsServer(
  accessToken: string,
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResult<AiReviewListItem>> {
  return apiServer<PaginatedResult<AiReviewListItem>>(
    accessToken,
    "/progress/ai-reviews",
    { query: params },
  );
}

export async function listAiReviews(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResult<AiReviewListItem>> {
  return api<PaginatedResult<AiReviewListItem>>("/progress/ai-reviews", {
    query: params,
  });
}

export async function getAiReview(id: string): Promise<AiReviewFull> {
  return api<AiReviewFull>(`/progress/ai-reviews/${id}`);
}

export async function getAiReviewServer(
  accessToken: string,
  id: string,
): Promise<AiReviewFull> {
  return apiServer<AiReviewFull>(accessToken, `/progress/ai-reviews/${id}`);
}

// --- Mutation --------------------------------------------------------------

/**
 * `POST /progress/ai-reviews` — generates a fresh review (optionally scoped to
 * one subject). Consumes one monthly unit; throws `ApiError` 403 with code
 * `AI_REVIEW_REQUIRES_SUBSCRIPTION` (Free) or `AI_REVIEW_LIMIT_REACHED`.
 */
export async function generateAiReview(
  subjectId?: string,
): Promise<GenerateAiReviewResult> {
  return api<GenerateAiReviewResult>("/progress/ai-reviews", {
    method: "POST",
    body: subjectId ? { subjectId } : {},
  });
}
