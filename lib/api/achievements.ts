import { api, apiServer } from "./client";
import type { Achievement } from "./types";

/**
 * Achievements / milestones — `GET /users/me/achievements` returns the full
 * catalogue merged with the caller's progress (unlocked flag, progress
 * current/target, server-owned `progressLabel`). Bare array, ordered by
 * `sortOrder`.
 */

export async function getAchievementsServer(
  accessToken: string,
): Promise<Achievement[]> {
  return apiServer<Achievement[]>(accessToken, "/users/me/achievements");
}

export async function getAchievements(): Promise<Achievement[]> {
  return api<Achievement[]>("/users/me/achievements");
}
