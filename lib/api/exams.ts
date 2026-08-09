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
