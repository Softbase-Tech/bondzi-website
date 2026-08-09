import { apiServer } from "./client";
import type { PmTestSubjectSummary } from "./types";

/**
 * Adaptive-Quiz reads. The actual "start" fires the shared
 * POST /exams endpoint with mode='pm_test' — no dedicated create.
 */
export async function listPmTestSubjects(
  accessToken: string,
): Promise<PmTestSubjectSummary[]> {
  return apiServer<PmTestSubjectSummary[]>(accessToken, "/pm-test/subjects");
}
