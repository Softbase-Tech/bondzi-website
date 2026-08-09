import { api } from "./client";
import type { Explanation } from "./types";

type BackendExplanation = {
  questionId: string;
  source: string;
  content?: string;
  contentHtml?: string | null;
  upvotes?: number;
  downvotes?: number;
  generatedAt?: string;
  createdAt?: string;
};

/**
 * Client-side explanation fetch. Feeds the AI explanation sheet
 * mounted from an exam result screen or a question detail page.
 *
 * The endpoint 402s (Payment Required) for free-tier users on
 * AI-generated explanations — callers should catch that and surface
 * the paywall modal instead of the raw error.
 */
export async function getExplanation(
  questionId: string,
): Promise<Explanation> {
  const row = await api<BackendExplanation>(
    `/explanations/${encodeURIComponent(questionId)}`,
  );
  const source = row.source?.startsWith("ai") ? "ai" : "human";
  return {
    questionId: row.questionId,
    markdown: row.content ?? "",
    contentHtml: row.contentHtml ?? null,
    source,
    generatedAt:
      row.generatedAt ?? row.createdAt ?? new Date().toISOString(),
    upvotes: row.upvotes ?? 0,
    downvotes: row.downvotes ?? 0,
  };
}

export async function voteOnExplanation(
  questionId: string,
  vote: -1 | 0 | 1,
): Promise<void> {
  await api<void>(
    `/explanations/${encodeURIComponent(questionId)}/vote`,
    {
      method: "POST",
      body: { vote },
      raw: true,
    },
  );
}
