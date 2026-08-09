import { apiServer } from "./client";
import type { SubjectProgress, UserStats } from "./types";

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
