import { apiServer } from "./client";

/**
 * FAQ knowledge base client for the web (app.bondzi.online). Same
 * shape the mobile hits — the contract lives in
 * backend/src/modules/faq/faq.service.ts.
 *
 * Both endpoints are JWT-gated on the backend so retired entries
 * never leak to signed-out crawlers. Server-only helpers here so
 * the page fetches at request time under NextAuth's accessToken.
 */

export interface FaqEntry {
  id: string;
  slug: string;
  question: string;
  answerMarkdown: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listFaqEntries(
  accessToken: string,
): Promise<FaqEntry[]> {
  return apiServer<FaqEntry[]>(accessToken, "/faq");
}

export async function getFaqEntry(
  accessToken: string,
  slug: string,
): Promise<FaqEntry> {
  return apiServer<FaqEntry>(
    accessToken,
    `/faq/${encodeURIComponent(slug)}`,
  );
}
