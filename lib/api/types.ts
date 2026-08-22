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

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}
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
  /**
   * ISO `YYYY-MM-DD` of the student's next exam sitting, or null when
   * unset. Backend enforces "future-only, within five years"; the
   * profile countdown card and `/settings/exam-date` share this field.
   */
  targetExamDate: string | null;
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

/**
 * `GET /subscriptions/me` and `GET /auth/me`'s embedded subscription
 * both return this exact shape. `plan` is the legacy PlanTier we
 * historically shipped in older responses — the backend still emits
 * `planId` (uuid) as the source of truth. Keep both so future callers
 * can migrate off the collapsed enum without a client-side type break.
 *
 * Cancellation notes: backend flips `status='cancelled'` on cancel
 * but preserves `expiresAt` so the user keeps access through the
 * paid-for window. There is NO `cancelledAt` timestamp — the UI
 * infers "cancelled — access ends {expiresAt}" from the two fields.
 */
export interface Subscription {
  id: string;
  userId?: string;
  planId?: string | null;
  billingInterval?: BillingInterval | null;
  provider?: "paystack" | "xp_credit" | null;
  providerReference?: string | null;
  providerSubscriptionId?: string | null;
  providerCustomerId?: string | null;
  xpRedemptionId?: string | null;
  amountGhs?: number | null;
  countryCode?: string;
  status: SubscriptionStatus;
  startsAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  account?: AccountType;
  level?: ExamType | null;
  paymentKind?: PaymentKind | null;
  /** Legacy — retained for older components that still branch on it. */
  plan?: PlanTier;
}

export type BillingInterval = "monthly" | "six_month" | "annual";
export type PaymentKind = "one_time" | "recurring";

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

/**
 * Backend serialises questions with `text` (not `body`). The value is
 * markdown with `$...$` math ALREADY expanded to inline SVG data URIs
 * (`![](data:image/svg+xml;utf8,...)`), so the renderer just needs to
 * convert the surrounding markdown to HTML — no separate math step.
 */
export interface QuestionOption {
  id: string;
  label: string;
  /** Markdown with math already inlined as SVG data URIs. */
  text: string;
  imageUrl?: string | null;
}

export interface QuestionStimulus {
  id: string;
  /** Markdown with math already inlined as SVG data URIs. */
  text: string;
  imageUrl?: string | null;
}

export interface Question {
  id: string;
  subjectId: string;
  topicId: string | null;
  stimulusId?: string | null;
  stimulus?: QuestionStimulus | null;
  examType?: ExamType;
  /** Markdown with math already inlined as SVG data URIs. */
  text: string;
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

// --- Plans + subscriptions -------------------------------------------------

/**
 * One cadence of a plan. `available` = "a Paystack plan_code has been
 * seeded for this cadence" — Plus rows never have any (they're
 * one-time), so `available` is false on all three cadences and the UI
 * uses `pricing.monthly.price` as the single lifetime headline.
 */
export interface PlanPricing {
  price: number;
  durationDays: number;
  available: boolean;
}

/**
 * Row from `GET /plans` — one per (account, level) combination. Six
 * total in Ghana today: {plus, pro} × {bece, wassce, novdec}. Web
 * groups by level for the current student's examType first, then
 * shows other levels below.
 */
export interface PublicPlan {
  id: string;
  name: string;
  description: string | null;
  account: AccountType;
  level: ExamType;
  paymentKind: PaymentKind;
  vatRatePct: number;
  countryCode: string;
  currency: string;
  isDefault: boolean;
  pricing: {
    monthly: PlanPricing;
    sixMonth: PlanPricing;
    annual: PlanPricing;
  };
}

/**
 * Row from `GET /subscriptions/entitlements` — a per-level view of
 * what the student is entitled to right now, including grace windows
 * for cancelled-but-not-yet-expired rows.
 */
export interface SubscriptionEntitlement {
  level: ExamType;
  account: AccountType | "free";
  expiresAt: string | null;
  subscriptionId: string | null;
  /** Row is CANCELLED but still in prepaid grace (expiresAt > now). */
  cancelled: boolean;
  /**
   * A separate active Plus row exists below the Pro entitlement on
   * the same level — matters when we display cancel copy for Pro
   * ("Plus access continues after Pro ends").
   */
  dormantPlusOnLevel: boolean;
}

/**
 * Response from `POST /subscriptions/initiate`. `reference` is
 * server-issued and passed verbatim to Paystack Inline JS + backend
 * verify. `authorizationUrl` is the Paystack hosted-checkout URL —
 * we use it only as a fallback when Inline JS fails to load.
 */
export interface InitiateSubscriptionResponse {
  authorizationUrl: string;
  reference: string;
  promoApplied?: {
    code: string;
    discountAmount: number;
  };
}

/**
 * Structured 409 body the backend returns when the user has a
 * PENDING attempt from the last 5 minutes. UI should recover this
 * reference and re-open the checkout instead of starting a fresh one.
 */
export interface CheckoutInProgressError {
  code: "CHECKOUT_IN_PROGRESS";
  message: string;
  reference: string;
}

// --- XP economy ------------------------------------------------------------

/** Row from `GET /xp/tiers` — admin-editable in the DB. */
export interface XpRedemptionTier {
  id: string;
  tierKey: string;
  label: string;
  xpCost: number;
  creditDays: number;
  isActive: boolean;
}

/**
 * Actual shape of the `POST /xp/redeem` response — matches the backend,
 * NOT the mobile's (out-of-date) type definition.
 */
export interface XpRedeemResult {
  success: true;
  tierKey: string;
  xpSpent: number;
  creditDays: number;
  newSpendableXp: number;
  subscriptionExpiresAt: string;
}

export interface XpWalletSnapshot {
  levelXp: number;
  spendableXp: number;
  currentLevel: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  streakDays: number;
  longestStreak: number;
  tiers: XpRedemptionTier[];
  rates: unknown[];
}

// ============================================================================
// Partner portal
// ----------------------------------------------------------------------------
// Consumed by lib/api/partner.ts + every screen under app/(partner)/*. Shape
// mirrors backend `src/modules/partners/entities/*.entity.ts` — keep in sync
// with `common/types/enums.ts` on the backend when new statuses land.
// ============================================================================

export type PartnerStatus = "pending" | "active" | "suspended" | "banned";
export type MomoProvider = "mtn" | "airteltigo" | "telecel" | "other";

export interface PartnerProfile {
  id: string;
  userId: string | null;
  email: string;
  phone: string;
  fullName: string;
  countryCode: string;
  momoProvider: MomoProvider;
  momoNumber: string;
  momoAccountName: string;
  status: PartnerStatus;
  agreedTermsVersionId: string;
  fraudFlagCount: number;
  approvedAt: string | null;
  approvedBy: string | null;
  suspendedAt: string | null;
  bannedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerReferralCode {
  id: string;
  partnerId: string;
  code: string;
  label: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface PartnerTerms {
  id: string;
  version: number;
  title: string;
  bodyMd: string;
  plusWassce: string;
  plusNovdec: string;
  plusBece: string;
  signupBatchSize: number;
  signupBatchAmountGhs: string;
  signupMinCompletedAnswers: number;
  answersBonusThreshold: number;
  answersBonusAmountGhs: string;
  attributionWindowDays: number;
  maxFraudFlagsBeforeBlock: number;
  maxAppeals: number;
  effectiveFrom: string;
  createdAt: string;
}

export type PartnerCommissionType =
  | "plus_subscription"
  | "signup_batch"
  | "answers_bonus"
  | "plus_subscription_clawback";

export type PartnerCommissionStatus =
  | "pending"
  | "approved"
  | "flagged"
  | "clawed_back"
  | "paid";

export interface PartnerCommission {
  id: string;
  partnerId: string;
  type: PartnerCommissionType;
  amountGhs: string;
  currency: string;
  status: PartnerCommissionStatus;
  earnedAt: string;
  paidOutId: string | null;
  termsVersionId: string;
  subscriptionId: string | null;
  userId: string | null;
  batchUserIds: string[] | null;
  flagReason: string | null;
  flaggedAt: string | null;
  dedupKey: string;
  eligibilityMeta: Record<string, unknown>;
  createdAt: string;
}

export type PartnerPayoutStatus = "pending" | "paid" | "failed";

export interface PartnerPayout {
  id: string;
  partnerId: string;
  weekOf: string;
  amountGhs: string;
  status: PartnerPayoutStatus;
  invoiceNumber: string;
  invoicePdfUrl: string | null;
  momoProvider: MomoProvider;
  momoNumber: string;
  momoReference: string | null;
  markedPaidBy: string | null;
  markedPaidAt: string | null;
  notes: string | null;
  createdAt: string;
}

/**
 * `GET /partner/payouts/preview` — envelope the backend returns for
 * "what would you pay right now" queries. Same shape whether admin or
 * partner-side.
 */
export interface PartnerPayoutPreview {
  partnerId: string;
  totalGhs: string;
  commissionCount: number;
  commissions: PartnerCommission[];
}

/**
 * `POST /partner/register` body. Backend enforces GH-only for MoMo
 * providers; we surface the same enum here so the picker can't select
 * something the server rejects.
 */
export interface RegisterPartnerPayload {
  email: string;
  phone: string;
  fullName: string;
  momoProvider: MomoProvider;
  momoNumber: string;
  momoAccountName: string;
}

export interface UpdatePartnerMomoPayload {
  momoProvider?: MomoProvider;
  momoNumber?: string;
  momoAccountName?: string;
}

export interface CreateReferralCodePayload {
  label: string;
}

export type PartnerReferralEngagement = "new" | "engaged" | "committed";

export type PartnerReferralCommissionStatus =
  | "none"
  | "pending"
  | "approved"
  | "flagged"
  | "paid"
  | "clawed_back";

export interface PartnerReferralRow {
  userId: string;
  handle: string;
  attributedAt: string;
  codeId: string;
  code: string;
  codeLabel: string;
  isDefaultCode: boolean;
  answerCount: number;
  engagementBucket: PartnerReferralEngagement;
  hasPaidPlus: boolean;
  commissionsEarnedGhs: string;
  commissionsPaidGhs: string;
  commissionStatus: PartnerReferralCommissionStatus;
}

export interface PartnerReferralsResult {
  items: PartnerReferralRow[];
  totals: {
    totalReferrals: number;
    activeUsers: number;
    paidPlus: number;
    earnedGhs: string;
    paidGhs: string;
  };
}

export type PartnerReferralSort = "recent" | "engaged" | "earning";

export type PartnerAppealStatus = "open" | "upheld" | "denied";

export interface PartnerAppeal {
  id: string;
  partnerId: string;
  appealNumber: number;
  openedAt: string;
  body: string;
  attachments: string[];
  status: PartnerAppealStatus;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
}

export interface SubmitAppealPayload {
  body: string;
  attachments?: string[];
}

export type PartnerBannerAspect = "square" | "story" | "landscape";

export interface PartnerBanner {
  id: string;
  label: string;
  description: string | null;
  imageUrl: string;
  aspect: PartnerBannerAspect;
  widthPx: number | null;
  heightPx: number | null;
  sortOrder: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- AI Study Review ---

export type AiReviewMode = "bootstrap" | "personalised";

export interface AiReviewListItem {
  id: string;
  subjectScope: string; // 'all' or a subject uuid
  summary: string;
  mode: AiReviewMode;
  model: string;
  generatedAt: string; // ISO
}

export interface AiReviewFull extends AiReviewListItem {
  content: string; // full 6-section markdown
}

export interface AiReviewQuota {
  tier: AccountType;
  limit: number; // monthly allowance; 0 for free
  used: number; // personalised reviews this month
  remaining: number;
  canGenerate: boolean;
  latest: AiReviewListItem | null;
}

export interface GenerateAiReviewResult {
  review: AiReviewFull;
  quota: AiReviewQuota;
}

// --- Weakness / progress coaching ---

export interface PastPaperWeakTopic {
  topicId: string;
  title: string;
  subjectId: string;
  subjectName: string;
  answered: number;
  correct: number;
  accuracy: number; // 0..1
}

export interface SyllabusWeakTopic {
  syllabusTopicId: string;
  title: string;
  subjectId: string;
  subjectName: string;
  formLevel: number | null;
  answered: number;
  correct: number;
  accuracy: number; // 0..1
}

export interface WeaknessBySource {
  pastPaperWeakTopics: PastPaperWeakTopic[];
  syllabusWeakTopics: SyllabusWeakTopic[];
}

export interface WeaknessNarrative {
  narrative: string;
  generatedAt: string;
  mode: AiReviewMode;
  model: string;
  cached: boolean;
  subjectScope: string;
}

// --- Achievements / milestones ---

export type AchievementMetric =
  | "answers_count"
  | "streak_max"
  | "longest_streak"
  | "accuracy_pct"
  | "level";

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string | null;
  iconKey: string;
  gradientStart: string;
  gradientEnd: string;
  metricKey: AchievementMetric;
  thresholdValue: number;
  minAnswers: number | null;
  sortOrder: number;
  progressCurrent: number;
  progressTarget: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progressLabel: string;
}
