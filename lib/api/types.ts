/**
 * Type contracts shared with the backend + the mobile app.
 *
 * Kept in a single file so the api/service layer, NextAuth session, and every
 * React Query consumer speak the same shapes. Names deliberately mirror
 * `mobile/types/api.ts` — the two clients hit the same endpoints and the
 * shapes must not drift.
 */

export type UserRole = "student" | "teacher" | "admin" | "superadmin";
export type ExamType = "bece" | "wassce" | "novdec";
export type SchoolLevel = "jhs" | "shs" | "remedial";
export type AccountType = "free" | "plus" | "pro";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export interface SafeUser {
  id: string;
  fullName: string;
  username: string | null;
  usernameChangedAt: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  examType: ExamType;
  schoolLevel: SchoolLevel;
  formLevel: 1 | 2 | 3 | null;
  schoolName: string | null;
  region: string | null;
  avatarUrl: string | null;
  countryCode: string | null;
  isActive: boolean;
  emailVerified: boolean;
  emailWeeklyDigestEnabled: boolean;
  emailStreakNudgesEnabled: boolean;
  emailLevelUpEnabled: boolean;
  emailMarketingEnabled: boolean;
  pushRemindersEnabled: boolean;
  pushStreakNudgesEnabled: boolean;
  gender: Gender | null;
  dateOfBirth: string | null;
  referralCode: string;
  referredBy: string | null;
  referralQualified: boolean;
  levelXp: number;
  spendableXp: number;
  currentLevel: number;
  streakDays: number;
  longestStreak: number;
  lastStudyDate: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string; // ISO
  refreshExpiresAt: string; // ISO
}

export interface AuthResponse {
  user: SafeUser;
  tokens: TokenPair;
}

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "cancelled"
  | "past_due"
  | "xp_credited";

export type PlanTier =
  | "free"
  | "monthly"
  | "termly"
  | "annual"
  | "xp_credit";

export interface Subscription {
  id: string;
  plan: PlanTier;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  startedAt: string | null;
  cancelledAt: string | null;
  source: "paystack" | "xp_credit";
  account?: AccountType;
  level?: ExamType;
}

/**
 * Backend response envelope from `TransformInterceptor` — every controller
 * response is wrapped as `{ data: T }` (occasionally with a `meta`). Our
 * client unwraps this to `T` before returning to callers.
 */
export interface Envelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Shape of the error body produced by the backend's `GlobalExceptionFilter`.
 * `code` is present only on exceptions that supplied one (currently
 * `DEVICE_KICKED`); everything else has just message + error.
 */
export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  code?: string;
  path?: string;
  timestamp?: string;
  requestId?: string;
}
