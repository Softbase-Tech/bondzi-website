import { api, apiServer } from "./client";
import type {
  AllTimeWinnerRow,
  LeaderboardPeriodType,
  WinnerRow,
} from "./types";

/**
 * Winners / Hall of Fame reads. `examType` is locked server-side to
 * the caller — do not expose an override.
 */

export interface WinnersQuery {
  periodType: LeaderboardPeriodType;
  periodStart?: string;
}

/** Server-side — used to prefetch the initial period on the RSC page. */
export async function listWinnersServer(
  accessToken: string,
  query: WinnersQuery,
): Promise<WinnerRow[]> {
  return apiServer<WinnerRow[]>(accessToken, "/leaderboard/winners", {
    query: {
      periodType: query.periodType,
      periodStart: query.periodStart,
    },
  });
}

export async function listWinners(query: WinnersQuery): Promise<WinnerRow[]> {
  return api<WinnerRow[]>("/leaderboard/winners", {
    query: {
      periodType: query.periodType,
      periodStart: query.periodStart,
    },
  });
}

/**
 * All-time Hall of Fame — aggregated by user across periods. Only
 * counts winners whose XP was successfully issued.
 */
export async function listAllTimeWinnersServer(
  accessToken: string,
): Promise<AllTimeWinnerRow[]> {
  return apiServer<AllTimeWinnerRow[]>(
    accessToken,
    "/leaderboard/winners/all-time",
  );
}

export async function listAllTimeWinners(): Promise<AllTimeWinnerRow[]> {
  return api<AllTimeWinnerRow[]>("/leaderboard/winners/all-time");
}
