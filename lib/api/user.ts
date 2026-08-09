import { api, apiServer } from "./client";
import type { SafeUser, SubjectProgress, UserStats } from "./types";

/**
 * Users domain — the read side of the profile / dashboard. Writes
 * (change-password, notification prefs, exam-type rotation) live in a
 * separate module added when Phase 7 needs them.
 */

type BackendStats = {
  totalQuestionsAttempted?: number;
  accuracy?: number; // 0..100 from backend
  streakDays?: number;
  longestStreak?: number;
  activeDaysLast7?: boolean[];
  todayIndex?: number;
  streakAtRisk?: boolean;
  streakBroken?: boolean;
  lastStudyDate?: string | null;
  xp?: number;
  level?: number;
  xpToNextLevel?: number;
  questionsThisWeek?: number;
  dailyGoal?: number;
  dailyGoalProgress?: number;
  studyMinutesToday?: number;
};

/**
 * Normalise the raw backend response into the client-friendly UserStats.
 * Two normalisations happen here:
 *   1. `accuracy` is sent as a percentage (0..100). We store 0..1 so
 *      React components can render either `${acc * 100}%` or use the
 *      value directly as a ring-fill fraction.
 *   2. Missing fields on old backends default to zeros / empty arrays
 *      so the render tree never has to guard for undefined.
 */
export async function getUserStats(accessToken: string): Promise<UserStats> {
  const raw = await apiServer<BackendStats>(accessToken, "/users/me/stats");
  const rawAccuracy = raw.accuracy ?? 0;
  return {
    totalQuestionsAttempted: raw.totalQuestionsAttempted ?? 0,
    accuracy: rawAccuracy > 1 ? rawAccuracy / 100 : rawAccuracy,
    streakDays: raw.streakDays ?? 0,
    longestStreak: raw.longestStreak ?? 0,
    activeDaysLast7:
      Array.isArray(raw.activeDaysLast7) && raw.activeDaysLast7.length === 7
        ? raw.activeDaysLast7
        : [false, false, false, false, false, false, false],
    todayIndex:
      typeof raw.todayIndex === "number" &&
      raw.todayIndex >= 0 &&
      raw.todayIndex <= 6
        ? raw.todayIndex
        : 0,
    streakAtRisk: raw.streakAtRisk ?? false,
    streakBroken: raw.streakBroken ?? false,
    lastStudyDate: raw.lastStudyDate ?? null,
    xp: raw.xp ?? 0,
    level: raw.level ?? 1,
    xpToNextLevel: raw.xpToNextLevel ?? 0,
    questionsThisWeek: raw.questionsThisWeek ?? 0,
    dailyGoal: raw.dailyGoal ?? 20,
    dailyGoalProgress: raw.dailyGoalProgress ?? 0,
    studyMinutesToday: raw.studyMinutesToday ?? 0,
  };
}

type BackendProgressRow = {
  subjectId: string;
  subject?: { id?: string; name?: string; code?: string };
  questionsSeen?: number;
  questionsCorrect?: number;
  streakDays?: number;
  longestStreak?: number;
  topicAccuracy?: Record<string, { seen: number; correct: number }> | null;
  lastStudiedAt?: string | null;
};

export async function getSubjectProgress(
  accessToken: string,
): Promise<SubjectProgress[]> {
  const rows = await apiServer<BackendProgressRow[]>(
    accessToken,
    "/users/me/progress",
  );
  return rows.map((r) => {
    const seen = r.questionsSeen ?? 0;
    const correct = r.questionsCorrect ?? 0;
    const accuracy = seen > 0 ? correct / seen : 0;
    const weakTopics = Object.entries(r.topicAccuracy ?? {})
      .map(([topicId, t]) => ({
        topicId,
        // Backend doesn't ship the topic title in this response; the
        // subject-detail page fetches topics separately for rich UI.
        // Falling back to the id keeps the row functional if it's
        // rendered without a topic lookup.
        topicName: topicId,
        accuracy: t.seen > 0 ? t.correct / t.seen : 0,
      }))
      .filter((t) => t.accuracy < 0.6)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);
    return {
      subjectId: r.subjectId,
      subjectName: r.subject?.name ?? "Subject",
      accuracy,
      questionsAnswered: seen,
      lastStudiedAt: r.lastStudiedAt ?? null,
      weakTopics,
    };
  });
}

/**
 * User's "selected subjects" preference — subset of subjects they've
 * pinned as favourites. Empty = "no preference, show all".
 */
export async function getSelectedSubjectIds(
  accessToken: string,
): Promise<string[]> {
  const res = await apiServer<{ subjectIds: string[] }>(
    accessToken,
    "/users/me/subjects",
  );
  return res.subjectIds ?? [];
}

// --- Settings mutations ----------------------------------------------------

/**
 * `PATCH /users/me` — updates the whitelisted profile fields. Backend
 * rejects any extra fields (400 forbidNonWhitelisted). Returns the
 * refreshed SafeUser.
 */
export interface UpdateProfilePayload {
  fullName?: string;
  formLevel?: 1 | 2 | 3;
  schoolName?: string;
  region?: string;
  avatarUrl?: string;
}
export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<SafeUser> {
  return api<SafeUser>("/users/me", { method: "PATCH", body: payload });
}

/**
 * `PATCH /users/me/username` — enforces the 90-day cooldown after the
 * first change. Case-only re-cases don't consume the cooldown.
 */
export async function updateUsername(
  username: string,
): Promise<{ username: string; usernameChangedAt: string | null }> {
  return api<{ username: string; usernameChangedAt: string | null }>(
    "/users/me/username",
    { method: "PATCH", body: { username } },
  );
}

/**
 * `PATCH /users/me/email-preferences` — all fields optional; undefined
 * means "leave alone". Backend returns the post-update snapshot of
 * all four flags.
 */
export interface EmailPreferences {
  weeklyDigest: boolean;
  streakNudges: boolean;
  levelUp: boolean;
  marketing: boolean;
}
export async function updateEmailPreferences(
  payload: Partial<EmailPreferences>,
): Promise<EmailPreferences> {
  return api<EmailPreferences>("/users/me/email-preferences", {
    method: "PATCH",
    body: payload,
  });
}

/**
 * `PATCH /users/me/push-preferences` — same shape rules as email.
 */
export interface PushPreferences {
  reminders: boolean;
  streakNudges: boolean;
}
export async function updatePushPreferences(
  payload: Partial<PushPreferences>,
): Promise<PushPreferences> {
  return api<PushPreferences>("/users/me/push-preferences", {
    method: "PATCH",
    body: payload,
  });
}

/**
 * `PUT /users/me/subjects` — replace-all semantics. Backend rejects
 * more than 50 ids, inactive ids, and ids belonging to a different
 * examType.
 */
export async function setSelectedSubjectIds(
  subjectIds: string[],
): Promise<{ subjectIds: string[] }> {
  return api<{ subjectIds: string[] }>("/users/me/subjects", {
    method: "PUT",
    body: { subjectIds },
  });
}

/**
 * `DELETE /users/me` — soft-delete. Actual PII removal runs 30 days
 * later. Backend returns 204.
 */
export async function deleteMyAccount(): Promise<void> {
  await api<void>("/users/me", { method: "DELETE", raw: true });
}
