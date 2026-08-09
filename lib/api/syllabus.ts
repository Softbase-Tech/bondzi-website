import { apiServer } from "./client";
import type { ExamType, SyllabusTopic } from "./types";

/**
 * Syllabus-topic catalogue (backend Phase 0.2). Powers the Level Test
 * picker: a Form-scoped chip list of topics the student can drill
 * against. Backend returns only active rows, sorted by
 * (sort_order ASC, title ASC).
 */
export async function listSyllabusTopics(
  accessToken: string,
  params: {
    examType?: ExamType;
    subjectId?: string;
    formLevel?: number;
  },
): Promise<SyllabusTopic[]> {
  return apiServer<SyllabusTopic[]>(accessToken, "/syllabus-topics", {
    query: params,
  });
}
