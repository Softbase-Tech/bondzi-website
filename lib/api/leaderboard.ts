import { api, apiServer } from "./client";
import type {
  LeaderboardPeriodType,
  LeaderboardRow,
  MyRankResponse,
} from "./types";

/**
 * Leaderboard reads. The backend locks `examType` server-side to the
 * caller's account — never expose an override on the web (matches
 * mobile).
 *
 * Cached 5min in Redis backend-side; web adds a matching TanStack
 * Query `staleTime` to avoid hammering on tab-visibility changes.
 */

export interface LeaderboardQuery {
  periodType?: LeaderboardPeriodType;
  periodStart?: string;
  scope?: string;
}

/** Server-side variant used by RSC pages that want the initial data. */
export async function listLeaderboardServer(
  accessToken: string,
  query: LeaderboardQuery = {},
): Promise<LeaderboardRow[]> {
  return apiServer<LeaderboardRow[]>(accessToken, "/leaderboard", {
    query: {
      periodType: query.periodType,
      periodStart: query.periodStart,
      scope: query.scope,
    },
  });
}

/**
 * Client-side variant — powers the tab switcher + 5-minute polling.
 * TanStack Query wraps this so we get retry / dedup / visibility-based
 * pausing for free.
 */
export async function listLeaderboard(
  query: LeaderboardQuery = {},
): Promise<LeaderboardRow[]> {
  return api<LeaderboardRow[]>("/leaderboard", {
    query: {
      periodType: query.periodType,
      periodStart: query.periodStart,
      scope: query.scope,
    },
  });
}

/**
 * Not currently rendered on-screen (rank is derived from the list) but
 * exposed for the "capacity 100" empty state — when the list is full
 * we can call this to tell the user their true rank.
 */
export async function getMyRank(query: LeaderboardQuery = {}): Promise<MyRankResponse> {
  return api<MyRankResponse>("/leaderboard/my-rank", {
    query: {
      periodType: query.periodType,
      periodStart: query.periodStart,
      scope: query.scope,
    },
  });
}
