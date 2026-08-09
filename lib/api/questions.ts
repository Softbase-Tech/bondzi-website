import { api, apiServer } from "./client";
import type { Question } from "./types";

/**
 * Public question reads. Split between server-only (`listYears`,
 * `getPastPaper`) used by the past-paper picker RSCs, and the
 * client-callable `getQuestionDetail` / `flagQuestion` used by the
 * exam runner and the "flag question" dialog.
 */

export async function listYears(
  accessToken: string,
  subjectId: string,
): Promise<number[]> {
  return apiServer<number[]>(accessToken, "/questions/years", {
    query: { subjectId },
  });
}

export async function getPastPaper(
  accessToken: string,
  params: { subjectId: string; year: number; paper?: string },
): Promise<Question[]> {
  return apiServer<Question[]>(accessToken, "/questions/past-paper", {
    query: params,
  });
}

/**
 * Client-side detail fetch — used by the explanation modal to render
 * the question next to its explanation.
 */
export async function getQuestionDetail(id: string): Promise<Question> {
  return api<Question>(`/questions/${encodeURIComponent(id)}`);
}

/**
 * Report a question to admins. Distinct from the client-only
 * "Flag for review" bookmark in the exam runner — this one hits the
 * backend `POST /questions/:id/flag` endpoint that admins triage
 * from the internal question-review queue.
 */
export type FlagReason =
  | "wrong_answer"
  | "typo"
  | "bad_image"
  | "outdated"
  | "duplicate"
  | "other";

export async function flagQuestion(
  id: string,
  body: { reason: FlagReason; note?: string },
): Promise<void> {
  await api<void>(`/questions/${encodeURIComponent(id)}/flag`, {
    method: "POST",
    body,
    raw: true,
  });
}
