import { api, apiServer } from "./client";
import type {
  AnswerResponse,
  ExamMode,
  ExamResult,
  ExamSession,
} from "./types";

/**
 * Exam sessions — the interactive engine's backing endpoints.
 *
 * Server-only variants (used by RSC pages): create, get, getResult.
 * Client-callable variants (used by the runner + queue): submitAnswer,
 * complete, abandon.
 */

export interface CreateExamBody {
  mode: ExamMode;
  subjectFilter: {
    subjectIds?: string[];
    topicIds?: string[];
    syllabusTopicIds?: string[];
    years?: number[];
    /** Paper number as int (1 | 2). */
    wassecPaper?: number;
  };
  questionCount?: number;
  durationSeconds?: number;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  focusWeak?: boolean;
}

export interface AnswerBody {
  questionId: string;
  selectedOptionId?: string | null;
  typedAnswer?: string | null;
  timeSpentMs?: number;
  idempotencyKey?: string;
}

// --- server-only wrappers --------------------------------------------------

export async function createExam(
  accessToken: string,
  body: CreateExamBody,
): Promise<ExamSession> {
  return apiServer<ExamSession>(accessToken, "/exams", {
    method: "POST",
    body,
  });
}

export async function getExamSession(
  accessToken: string,
  id: string,
): Promise<ExamSession> {
  return apiServer<ExamSession>(
    accessToken,
    `/exams/${encodeURIComponent(id)}`,
  );
}

export async function getExamResult(
  accessToken: string,
  id: string,
): Promise<ExamResult> {
  return apiServer<ExamResult>(
    accessToken,
    `/exams/${encodeURIComponent(id)}/result`,
  );
}

/**
 * Most-recent in-progress exam for this user — null when nothing is
 * open. Powers the Continue-where-you-left-off card on the home
 * screen and the equivalent affordance on the subject hub.
 */
export async function getResumeExam(
  accessToken: string,
): Promise<ExamSession | null> {
  try {
    return await apiServer<ExamSession | null>(accessToken, "/exams/resume");
  } catch {
    // Silent-fail so a transient 5xx doesn't kill the home render;
    // the card just doesn't appear.
    return null;
  }
}

/**
 * One row in the /exams/history response. Matches the backend
 * shape; the mode literal is left as `string` since ExamMode has
 * added values over time and pinning here would break resilience.
 */
export interface ExamHistoryRow {
  id: string;
  mode: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  totalQuestions: number | null;
  score: number | null;
  percentScore: string | null;
  subjectIds: string[];
}

export interface ExamHistoryPage {
  items: ExamHistoryRow[];
  total: number;
  nextCursor: string | null;
}

export async function listExamHistory(
  accessToken: string,
  query: {
    subjectId?: string;
    fromDate?: string;
    toDate?: string;
    mode?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<ExamHistoryPage> {
  const usp = new URLSearchParams();
  if (query.subjectId) usp.set("subjectId", query.subjectId);
  if (query.fromDate) usp.set("fromDate", query.fromDate);
  if (query.toDate) usp.set("toDate", query.toDate);
  if (query.mode) usp.set("mode", query.mode);
  if (query.status) usp.set("status", query.status);
  if (query.page) usp.set("page", String(query.page));
  if (query.limit) usp.set("limit", String(query.limit));
  const path = usp.toString()
    ? `/exams/history?${usp.toString()}`
    : "/exams/history";
  return apiServer<ExamHistoryPage>(accessToken, path);
}

// --- client-side runner + queue -------------------------------------------

export async function submitAnswer(
  examId: string,
  body: AnswerBody,
): Promise<AnswerResponse> {
  const { idempotencyKey, ...payload } = body;
  const headers = idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined;
  return api<AnswerResponse>(
    `/exams/${encodeURIComponent(examId)}/answers`,
    {
      method: "POST",
      body: payload,
      headers,
    },
  );
}

export async function completeExam(examId: string): Promise<ExamResult> {
  return api<ExamResult>(
    `/exams/${encodeURIComponent(examId)}/complete`,
    { method: "POST", body: {} },
  );
}

export async function abandonExam(examId: string): Promise<void> {
  await api<void>(
    `/exams/${encodeURIComponent(examId)}/abandon`,
    { method: "POST", body: {}, raw: true },
  );
}
