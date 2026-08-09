import { apiServer } from "./client";
import type { ExamType, Subject, Topic } from "./types";

/**
 * Subject + topic reads. All server-only (dashboard, subject list, subject
 * detail are RSC pages that fetch during the render). If you need these
 * client-side later, wrap them in React Query hooks that call the same
 * endpoints via the client `api()`.
 */

export async function listSubjects(
  accessToken: string,
  examType?: ExamType,
): Promise<Subject[]> {
  return apiServer<Subject[]>(accessToken, "/subjects", {
    query: examType ? { examType } : undefined,
  });
}

export async function getSubject(
  accessToken: string,
  id: string,
): Promise<Subject> {
  return apiServer<Subject>(accessToken, `/subjects/${encodeURIComponent(id)}`);
}

export async function listSubjectTopics(
  accessToken: string,
  id: string,
): Promise<Topic[]> {
  return apiServer<Topic[]>(
    accessToken,
    `/subjects/${encodeURIComponent(id)}/topics`,
  );
}
