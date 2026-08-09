import { api, apiServer } from "./client";
import type {
  AllTimeWinnerRow,
  LeaderboardPeriodType,
  WinnerRow,
} from "./types";

/**
 * Winners / Hall of Fame reads. `examType` is locked server-side to
 * the caller — do not expose an override.
 *
 * IMPORTANT: `/leaderboard/winners` without a `periodStart` returns
 * up to 200 rows across ALL past periods (backend `listPast`). To
 * scope the "This week" / "This month" tabs correctly, the caller
 * MUST supply `periodStart` for the current period. Otherwise the
 * tabs show historical winners which reads as broken data.
 */

export interface WinnersQuery {
  periodType: LeaderboardPeriodType;
  periodStart?: string;
}

/**
 * Current week's Monday (Africa/Accra, UTC+0) in `YYYY-MM-DD`. Backend
 * period_start columns are stamped in the same timezone, so a naive
 * UTC computation is safe — Ghana never shifts off UTC.
 */
export function currentWeekPeriodStart(now: Date = new Date()): string {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const day = d.getUTCDay(); // Sunday=0 … Saturday=6
  const daysSinceMonday = (day + 6) % 7; // 0 for Monday, 6 for Sunday
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d.toISOString().slice(0, 10);
}

/** First of the current month (Africa/Accra, UTC+0) in `YYYY-MM-DD`. */
export function currentMonthPeriodStart(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function currentPeriodStart(period: LeaderboardPeriodType): string {
  return period === "weekly"
    ? currentWeekPeriodStart()
    : currentMonthPeriodStart();
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
