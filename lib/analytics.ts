import { track } from "@vercel/analytics";

/**
 * Vercel Web Analytics — the typed layer on top of the raw SDK.
 *
 * Three jobs:
 *
 *   1. **A typed event catalogue.** `AnalyticsEventMap` is the single
 *      source of truth for every custom event the site emits. Call
 *      sites go through `trackEvent()`, so a typo in an event name or
 *      a missing property is a compile error rather than a silently
 *      malformed row in the dashboard.
 *
 *   2. **PII + secret redaction** (`redactAnalyticsUrl`). Wired into
 *      `<Analytics beforeSend>` — see `components/analytics/VercelAnalytics.tsx`.
 *
 *   3. **Cardinality control.** Vercel aggregates custom events by
 *      (name, property) pairs. A property carrying a UUID or free text
 *      produces one bucket per user and tells you nothing. Every
 *      property below is deliberately a small closed set; the helpers
 *      at the bottom bucket continuous values (scores, counts) before
 *      they're sent.
 *
 * Nothing here may ever throw into a render path — analytics is not
 * allowed to break the product. Every public function is total.
 */

// ---------------------------------------------------------------------------
// URL redaction
// ---------------------------------------------------------------------------

/**
 * Query params that are safe to keep verbatim in a pageview URL.
 *
 * This is an **allowlist, not a blocklist** — deliberately. A blocklist
 * has to be updated every time someone adds a new query param, and the
 * failure mode of forgetting is a silent PII leak into a third-party
 * analytics store. With an allowlist the failure mode of forgetting is
 * a `redacted` value in a dashboard, which someone notices and fixes.
 *
 * What's on the list and why:
 *   - `utm_*` / `ref`  — campaign attribution. The whole reason a
 *     marketing site runs analytics; low cardinality by convention.
 *   - `error`          — e.g. `/login?error=session_expired`. A closed
 *     set, and genuinely useful (it's how you spot a spike in kicked
 *     sessions).
 *   - `category`       — `/help/tickets/new?category=payment`. Closed
 *     set of four; a real funnel signal for support load.
 *   - `level`, `periodType`, `sort`, `tab`, `page`, `pending` — closed
 *     sets or small integers used for tab/filter state.
 *
 * Everything else — `email`, `phone`, `reference`, `otp`, `token`,
 * `subject`, `body`, `returnTo`, `subjectId`, `codeId`, `questionId`,
 * and anything added in future — has its value replaced. The key is
 * kept so the dashboard still shows *that* a param was present.
 */
const QUERY_ALLOWLIST: ReadonlySet<string> = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "error",
  "category",
  "level",
  "periodType",
  "sort",
  "tab",
  "page",
  "pending",
]);

const REDACTED = "redacted";

/**
 * Strip PII and secrets out of a URL before it reaches Vercel.
 *
 * Path segments are deliberately left alone: `@vercel/analytics/next`
 * already reports a normalised `route` (`/exam/[examId]`) computed from
 * Next's own route params, so re-masking the path here would be
 * duplicated work against a less reliable signal (a regex guess) than
 * the framework's.
 *
 * Pure and total — exported separately from the component so it can be
 * reasoned about (and tested) without a DOM.
 */
export function redactAnalyticsUrl(rawUrl: string): string {
  try {
    // The base only matters for relative inputs; it is never emitted
    // unless the caller gave us an absolute URL to begin with.
    const url = new URL(rawUrl, "https://bondzi.online");
    if (!url.search) return rawUrl;

    let mutated = false;
    // Snapshot the keys first — `set()` mutates the collection we'd
    // otherwise be iterating, and it collapses duplicate keys for free.
    for (const key of Array.from(url.searchParams.keys())) {
      if (QUERY_ALLOWLIST.has(key)) continue;
      url.searchParams.set(key, REDACTED);
      mutated = true;
    }
    if (!mutated) return rawUrl;

    // Preserve the shape we were handed: a relative URL stays relative.
    const isAbsolute = /^https?:\/\//i.test(rawUrl);
    return isAbsolute
      ? url.toString()
      : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    // Unparseable. Drop the query string wholesale rather than forward
    // something we were unable to inspect.
    const queryStart = rawUrl.indexOf("?");
    return queryStart === -1 ? rawUrl : rawUrl.slice(0, queryStart);
  }
}

// ---------------------------------------------------------------------------
// Event catalogue
// ---------------------------------------------------------------------------

/** Which surface a shared event fired from. Closed set — keep it that way. */
export type AnalyticsSurface =
  | "home"
  | "home_hero"
  | "home_get_app"
  | "blog_article_footer"
  | "blog_article_inline"
  | "pricing"
  | "header"
  | "footer"
  | "partners"
  | "blog"
  | "dashboard"
  | "subject_hub"
  | "paywall"
  | "plans"
  | "profile"
  | "referral"
  | "winners";

/**
 * Mirrors `ExamMode` in `lib/api/types.ts`. Kept as its own union
 * rather than re-exported so the analytics contract doesn't silently
 * change shape if the API union grows — adding a mode there should be
 * a deliberate decision here too. Six values; still low cardinality.
 */
export type ExamMode =
  | "past_paper"
  | "practice"
  | "topic_drill"
  | "pm_test"
  | "mock_exam"
  | "srs_review";
export type ExamLevel = "wassce" | "bece" | "novdec";
export type PaidAccount = "plus" | "pro";

/**
 * Every custom event the site can emit, with its exact property shape.
 *
 * Naming convention: `domain_object_verb`, lower snake case. It sorts
 * into coherent groups in the Vercel dashboard, which matters once the
 * list is more than a screen long.
 */
export interface AnalyticsEventMap {
  /** Any marketing/nav call-to-action click. */
  cta_click: { surface: AnalyticsSurface; target: string };
  /** Mobile app acquisition — the primary conversion on the marketing site. */
  app_download_click: { platform: "android" | "ios"; surface: AnalyticsSurface };

  // -- Signup funnel. The pageview on /register is the denominator, so
  //    there's deliberately no `signup_started` event duplicating it. --
  auth_signup_otp_sent: Record<string, never>;
  auth_signup_otp_verified: Record<string, never>;
  auth_signup_completed: { level: ExamLevel; withReferral: boolean };
  auth_signup_failed: { reason: "email_taken" | "error" };
  auth_signin_completed: Record<string, never>;

  // -- Activation --
  onboarding_subjects_saved: { subjectCount: number; skipped: boolean };

  // -- Core study loop --
  exam_started: { mode: ExamMode; level: ExamLevel };
  exam_completed: { mode: ExamMode; scoreBand: ScoreBand; reason: "manual" | "timeout" };
  exam_abandoned: { mode: ExamMode };
  explanation_opened: { source: "exam" | "result" | "deeplink" };

  // -- Monetisation --
  paywall_shown: { feature: PaywallFeature };
  paywall_upgrade_clicked: { feature: PaywallFeature };
  checkout_initiated: { account: PaidAccount; level: ExamLevel; cadence: Cadence };
  checkout_completed: { account: PaidAccount; level: ExamLevel; cadence: Cadence };
  checkout_dismissed: { account: PaidAccount; level: ExamLevel };
  checkout_failed: { account: PaidAccount; level: ExamLevel; stage: "initiate" | "verify" };
  checkout_resumed: { account: PaidAccount; level: ExamLevel };
  subscription_cancelled: { account: PaidAccount };
  xp_redeemed: { creditDays: number };

  // -- Growth loops --
  referral_shared: { channel: "whatsapp" | "native" | "clipboard" };
  winner_shared: { periodType: "weekly" | "monthly" };
  partner_signup_completed: { hadAccount: boolean };

  // -- AI features (each one costs money — worth knowing the demand) --
  ai_review_generated: Record<string, never>;
  ai_insight_requested: Record<string, never>;
}

export type PaywallFeature =
  | "explanation"
  | "quiz"
  | "mock-exam"
  | "level-test"
  | "unlimited-past-papers";

export type Cadence = "monthly" | "six_month" | "annual" | "lifetime";

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

/** Vercel rejects nested values; this is the full set it accepts. */
type AllowedPropertyValue = string | number | boolean | null | undefined;

/**
 * Defensive cap on string property values.
 *
 * Nothing in the catalogue above *should* carry free text, but a cap
 * means a future call site that passes a subject line or a name can't
 * turn into an unbounded set of dashboard buckets — or quietly ship
 * user-authored text off-site.
 */
const MAX_PROPERTY_CHARS = 64;

function sanitiseValue(value: unknown): AllowedPropertyValue {
  if (value === null || value === undefined) return value as null | undefined;
  if (typeof value === "boolean" || typeof value === "number") {
    return Number.isFinite(value as number) || typeof value === "boolean"
      ? (value as boolean | number)
      : null;
  }
  if (typeof value === "string") {
    return value.length > MAX_PROPERTY_CHARS
      ? value.slice(0, MAX_PROPERTY_CHARS)
      : value;
  }
  // Objects/arrays/functions are not representable — drop rather than
  // let the SDK stringify something unintended.
  return null;
}

/**
 * Emit a custom event.
 *
 * Safe to call from anywhere in a client component, including inside a
 * `catch`. No-ops during SSR and swallows any SDK error: a failed
 * beacon must never surface to a student mid-exam.
 */
export function trackEvent<K extends keyof AnalyticsEventMap>(
  name: K,
  properties?: AnalyticsEventMap[K],
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: Record<string, AllowedPropertyValue> = {};
    for (const [key, value] of Object.entries(properties ?? {})) {
      payload[key] = sanitiseValue(value);
    }
    track(name, payload);
  } catch {
    // Intentionally silent.
  }
}

// ---------------------------------------------------------------------------
// Bucketing helpers — keep continuous values out of the property space
// ---------------------------------------------------------------------------

export type ScoreBand = "0-39" | "40-54" | "55-69" | "70-84" | "85-100";

/** Bucket a 0..1 exam score into a WAEC-ish grade band. */
export function scoreBand(fraction: number): ScoreBand {
  const pct = Math.round(Math.max(0, Math.min(1, fraction || 0)) * 100);
  if (pct < 40) return "0-39";
  if (pct < 55) return "40-54";
  if (pct < 70) return "55-69";
  if (pct < 85) return "70-84";
  return "85-100";
}

/**
 * Bucket a count into an order-of-magnitude band. Used for things like
 * "how many subjects did they pick" where the exact number is noise but
 * the shape of the distribution is not.
 */
export function countBand(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n <= 5) return n;
  if (n <= 10) return 10;
  if (n <= 20) return 20;
  return 50;
}
