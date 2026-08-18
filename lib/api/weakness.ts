import { api, apiServer } from "./client";
import type { WeaknessBySource, WeaknessNarrative } from "./types";

/**
 * Weakness coaching. The list (`/progress/weakness`) is free statistical
 * detection over the student's answers; the narrative
 * (`/progress/weakness/narrative`) is the AI layer on top (Plus 1/day,
 * Pro unlimited, Free 403).
 */

export async function getWeaknessServer(
  accessToken: string,
  subjectId?: string,
): Promise<WeaknessBySource> {
  return apiServer<WeaknessBySource>(accessToken, "/progress/weakness", {
    query: { subjectId },
  });
}

export async function getWeakness(
  subjectId?: string,
): Promise<WeaknessBySource> {
  return api<WeaknessBySource>("/progress/weakness", {
    query: { subjectId },
  });
}

/**
 * `GET /progress/weakness/narrative` — the AI insight. Throws `ApiError`:
 * 403 when the tier is locked (Free), 429 when the daily allowance is spent.
 * Same-day, same-scope calls return the cached narrative without charge.
 */
export async function getWeaknessNarrative(
  subjectId?: string,
): Promise<WeaknessNarrative> {
  return api<WeaknessNarrative>("/progress/weakness/narrative", {
    query: { subjectId },
  });
}
