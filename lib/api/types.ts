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

// --- Subjects & topics -----------------------------------------------------

export interface Subject {
  id: string;
  name: string;
  code: string;
  examType: ExamType;
  category?: string | null;
  topicCount?: number;
  questionCount?: number;
  iconSlug?: string | null;
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  description?: string | null;
  /** Question count for this topic, when the backend has it precomputed. */
  questionCount?: number;
}

// --- User stats / progress -------------------------------------------------

/**
 * Shape the backend produces at `GET /users/me/stats`. Mirrors mobile's
 * `UserStats`. `accuracy` normalised to 0..1 on the client (backend
 * currently ships 0..100).
 */
export interface UserStats {
  totalQuestionsAttempted: number;
  accuracy: number;
  streakDays: number;
  longestStreak: number;
  /** 7-element array, monday..sunday of the user's local (Accra) week. */
  activeDaysLast7: boolean[];
  /** Index into `activeDaysLast7` for "today" — 0 = Monday. */
  todayIndex: number;
  streakAtRisk: boolean;
  streakBroken: boolean;
  lastStudyDate: string | null;
  xp: number;
  level: number;
  xpToNextLevel: number;
  questionsThisWeek: number;
  dailyGoal: number;
  dailyGoalProgress: number;
  studyMinutesToday: number;
}

export interface SubjectProgress {
  subjectId: string;
  subjectName: string;
  /** 0..1 */
  accuracy: number;
  questionsAnswered: number;
  lastStudiedAt: string | null;
  weakTopics: {
    topicId: string;
    topicName: string;
    accuracy: number;
  }[];
}

// --- Questions & exam sessions --------------------------------------------

export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "mcq" | "short_answer" | "true_false";

export interface QuestionOption {
  id: string;
  label: string;
  /** Plain text — the renderer falls back to this if `bodyHtml` is null. */
  body: string;
  /**
   * Pre-sanitised HTML from the backend's markdown → HTML pipeline
   * (KaTeX rendered inline). Trusted; rendered via
   * `dangerouslySetInnerHTML`. Sanitisation and math pre-render happen
   * on the backend so mobile + web share identical output.
   */
  bodyHtml?: string | null;
  imageUrl?: string | null;
}

export interface QuestionStimulus {
  id: string;
  text: string;
  /** Same trust rules as option `bodyHtml`. */
  textHtml?: string | null;
  imageUrl?: string | null;
}

export interface Question {
  id: string;
  subjectId: string;
  topicId: string | null;
  stimulusId?: string | null;
  stimulus?: QuestionStimulus | null;
  examType?: ExamType;
  /** Plain text — the renderer falls back to this if `bodyHtml` is null. */
  body: string;
  /** Pre-sanitised HTML (see `QuestionOption.bodyHtml`). */
  bodyHtml?: string | null;
  type: QuestionType;
  options: QuestionOption[];
  correctAnswer?: string | null;
  difficulty: Difficulty;
  year: number | null;
  paper?: string | null;
  source?: string | null;
  isVerified: boolean;
  imageUrl?: string | null;
}

export type ExamMode =
  | "past_paper"
  | "practice"
  | "topic_drill"
  | "pm_test"
  | "mock_exam"
  | "srs_review";

export interface ExamSession {
  id: string;
  userId: string;
  mode: ExamMode;
  questionPool: "past_paper" | "pm_test";
  questionCount: number;
  durationSeconds: number | null;
  startedAt: string;
  completedAt: string | null;
  abandonedAt: string | null;
  score: number | null;
  grade: string | null;
  questions: Question[];
  subjectIds: string[];
}

export interface ExamResult {
  examId: string;
  /** 0..100 */
  score: number;
  grade: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  xpEarned: number;
  durationSeconds: number;
  streakMaintained: boolean;
  byTopic: {
    topicId: string;
    topicName: string;
    /** 0..1 */
    accuracy: number;
    correctCount: number;
    totalCount: number;
  }[];
  wrongAnswers: {
    questionId: string;
    questionText: string;
    yourAnswer: string | null;
    correctAnswer: string;
  }[];
}

export interface AnswerResponse {
  isCorrect: boolean;
  correctOptionId: string | null;
}

// --- Explanations ----------------------------------------------------------

export interface Explanation {
  questionId: string;
  /** Raw markdown source. */
  markdown: string;
  /** Pre-rendered HTML (same trust rules as question bodyHtml). */
  contentHtml?: string | null;
  source: "ai" | "human";
  generatedAt: string;
  upvotes?: number;
  downvotes?: number;
}

// --- Quiz (PM Test) + Syllabus catalogue -----------------------------------

/**
 * Row on the `/pm-test/subjects` endpoint — one per subject the
 * signed-in student can take an adaptive Quiz session on. `accuracy`
 * arrives from the backend as 0..1 (unlike the other endpoints which
 * ship 0..100); we pass it through as-is because the UI uses it
 * directly as a fraction.
 */
export interface PmTestSubjectSummary {
  subjectId: string;
  subjectName: string;
  iconSlug?: string | null;
  activeQuestionCount: number;
  lastAttemptedAt: string | null;
  accuracy: number | null;
}

/**
 * A single syllabus-catalogue topic — used by the Level Test picker.
 * Different from `Topic` (which is a subject's question-bank grouping);
 * syllabus topics are curated by admin against the WAEC syllabus and
 * flow into pm_test question generation.
 */
export interface SyllabusTopic {
  id: string;
  subjectId: string;
  examType: ExamType;
  formLevel: 1 | 2 | 3;
  title: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

// --- Leaderboard -----------------------------------------------------------

export type LeaderboardPeriodType = "weekly" | "monthly";

/**
 * Row on the backend `/leaderboard` array response. Backend caps at 100
 * rows per period, ordered by `score DESC`. `username` takes precedence
 * over `fullName` for display; treat `Student` as the ultimate fallback.
 */
export interface LeaderboardRow {
  userId: string;
  username: string | null;
  fullName: string;
  score: number;
  rank: number;
}

/**
 * Backend `/leaderboard/my-rank` response. Never called by mobile (it
 * derives from the list) but useful for the "not on the list yet"
 * empty-state message when the list itself is at capacity.
 */
export interface MyRankResponse {
  userId: string;
  rank: number | null;
  weeklyXp: number;
  total: number;
  periodStart: string;
  periodType: LeaderboardPeriodType;
  scope: string;
  examType: ExamType;
}

// --- Winners / Hall of Fame ------------------------------------------------

/**
 * Row from `/leaderboard/winners`. Winners are admin-selected (not
 * automatic) — rank gaps can occur when anti-cheat rules disqualify a
 * user, so never re-number the array client-side.
 */
export interface WinnerRow {
  id: string;
  userId: string;
  userName: string;
  username: string | null;
  examType: ExamType;
  periodType: LeaderboardPeriodType;
  periodStart: string;
  rank: number;
  xpEarned: number;
  xpIssued: boolean;
  xpIssuedAt: string | null;
  createdAt: string;
  updatedAt: string;
  selectedAt: string | null;
}

/**
 * Row from `/leaderboard/winners/all-time`. Aggregates lifetime wins per
 * user — the actual "Hall of Fame" spine. Only rows with issued XP are
 * counted so unclaimed selections don't inflate the board.
 */
export interface AllTimeWinnerRow {
  userId: string;
  fullName: string;
  username: string | null;
  examType: ExamType;
  totalWins: number;
  totalXpFromPrizes: number;
}

// --- Referrals -------------------------------------------------------------

/**
 * `/referrals/me` — the raw backend shape. Web presents derived fields
 * (`pending`, share message, hardcoded rates) at the component layer
 * instead of duplicating mobile's "massage into stats object" step.
 */
export interface ReferralStats {
  referralCode: string;
  referredCount: number;
  qualifiedCount: number;
  pendingCount: number;
  referralQualified: boolean;
}

/**
 * `/referrals/events` — a single referral event log entry. Backend does
 * NOT return the referred user's name (privacy + no cheap join); web
 * displays "Friend" the same way mobile does today.
 */
export interface ReferralEvent {
  id: string;
  referrerId: string;
  referredId: string;
  referralCode: string;
  signupXpIssued: boolean;
  qualifyXpIssued: boolean;
  qualifiedAt: string | null;
  createdAt: string;
}

// --- Notifications ---------------------------------------------------------

/**
 * `/notifications` — the shape the mobile client sees, synthesised by
 * the backend controller so `readAt` is derived from `is_read=true` and
 * `type` falls back from `data.type` to the channel string.
 */
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}
