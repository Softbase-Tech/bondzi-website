"use client";

import { useSyncExternalStore } from "react";
import { ENV } from "./env";

/**
 * First-touch acquisition attribution.
 *
 * The problem this solves: a student lands on `bondzi.online` from a
 * Facebook post carrying `?utm_content=p02_novdec`, browses, then
 * clicks "Create account" — which sends them to a *different origin*,
 * `app.bondzi.online`. By the time the register form exists, the
 * campaign that produced the signup is gone.
 *
 * Two mechanisms, deliberately:
 *
 *   1. **A cookie scoped to `.bondzi.online`** (below). Survives the
 *      host hop, survives browsing around, survives coming back
 *      tomorrow. This is the durable record and the one the register
 *      call actually reads.
 *
 *      `localStorage` cannot do this job — it is partitioned per
 *      origin, so anything written on `bondzi.online` is invisible to
 *      `app.bondzi.online`. That is the whole reason this is a cookie.
 *
 *   2. **Query-param forwarding on cross-host links**
 *      (`withAttributionParams`). Belt-and-braces for the immediate
 *      hop, and it means the app host's own analytics sees the source
 *      too instead of reporting every signup as direct traffic.
 *
 * NOTE ON SCOPE: this cookie is deliberately shared across all three
 * hosts. The *session* cookies are deliberately NOT — they stay
 * host-scoped so a student session on app.bondzi.online and a partner
 * session on partners.bondzi.online remain independent. Nothing here
 * touches those; this cookie carries no identity and grants nothing.
 */

// ---------------------------------------------------------------------------
// Cookie plumbing
// ---------------------------------------------------------------------------

/** Campaign attribution. 90 days — a full exam-prep consideration cycle. */
const ATTR_COOKIE = "bondzi_attr";
const ATTR_MAX_AGE_DAYS = 90;

/**
 * Partner referral code, kept separate from campaign attribution.
 * Different system (partner_referral_codes, not users.referral_code),
 * different TTL, and it resolves against a different table server-side
 * — so conflating them into one cookie would only invite bugs.
 * 30 days matches the partner-portal plan.
 */
const PARTNER_COOKIE = "bondzi_partner_ref";
const PARTNER_MAX_AGE_DAYS = 30;

/**
 * Only set an explicit Domain in production.
 *
 * On localhost and on Vercel preview URLs the current host isn't a
 * subdomain of bondzi.online, and a browser silently drops any cookie
 * whose Domain doesn't match — so forcing it would break attribution
 * everywhere except prod, in a way that's invisible until you look.
 * Host-only cookies are correct in those environments.
 */
function cookieDomain(): string | null {
  return ENV.APP_ENV === "production" ? ".bondzi.online" : null;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const pair of document.cookie.split("; ")) {
    if (pair.startsWith(prefix)) {
      try {
        return decodeURIComponent(pair.slice(prefix.length));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeDays: number): void {
  if (typeof document === "undefined") return;
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAgeDays * 24 * 60 * 60}`,
    // Lax, not Strict: the user is arriving via a top-level navigation
    // from Facebook, and Strict would withhold the cookie on exactly
    // that first cross-site hop.
    "SameSite=Lax",
  ];
  const domain = cookieDomain();
  if (domain) parts.push(`Domain=${domain}`);
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    parts.push("Secure");
  }
  document.cookie = parts.join("; ");
}

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  signupReferrer?: string;
}

/** Query params carrying campaign attribution, in URL form. */
const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

/** `?ref=` carries a partner referral code. */
export const PARTNER_REF_PARAM = "ref";

const MAX_VALUE_CHARS = 128;
const MAX_REFERRER_CHARS = 512;

function clamp(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

/**
 * Read attribution off the current URL and persist it — first-touch.
 *
 * Called once per page load from `<AttributionCapture />`. Safe to call
 * repeatedly; it is a no-op once a value is stored.
 *
 * First-touch semantics matter here: a student who arrives from a
 * Facebook post, leaves, and comes back a week later by typing the URL
 * directly must still be credited to the post. So an existing cookie is
 * never overwritten, and a visit carrying no UTM never clears one.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);

    // --- partner code -----------------------------------------------
    const partnerCode = params.get(PARTNER_REF_PARAM);
    if (partnerCode && !readCookie(PARTNER_COOKIE)) {
      writeCookie(
        PARTNER_COOKIE,
        clamp(partnerCode.toUpperCase(), 32),
        PARTNER_MAX_AGE_DAYS,
      );
    }

    // --- campaign ---------------------------------------------------
    if (readCookie(ATTR_COOKIE)) return; // already have a first touch

    const found: Attribution = {};
    for (const param of UTM_PARAMS) {
      const value = params.get(param);
      if (!value) continue;
      // utm_source -> utmSource
      const key = param.replace(/_(.)/g, (_, c: string) =>
        c.toUpperCase(),
      ) as keyof Attribution;
      found[key] = clamp(value, MAX_VALUE_CHARS);
    }

    // An external referrer is worth keeping even with no UTM at all —
    // it's the only signal for an untagged share. Internal navigation
    // is skipped so we don't overwrite "came from Facebook" with
    // "came from our own homepage".
    const referrer = document.referrer;
    if (referrer && !isSameSite(referrer)) {
      found.signupReferrer = clamp(referrer, MAX_REFERRER_CHARS);
    }

    if (Object.keys(found).length === 0) return;
    writeCookie(ATTR_COOKIE, JSON.stringify(found), ATTR_MAX_AGE_DAYS);
  } catch {
    // Attribution is reporting, never a reason to break a page load.
  }
}

function isSameSite(referrer: string): boolean {
  try {
    const host = new URL(referrer).hostname;
    return host === window.location.hostname || host.endsWith(".bondzi.online");
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** The stored first-touch campaign attribution, or `{}`. */
export function getAttribution(): Attribution {
  const raw = readCookie(ATTR_COOKIE);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Attribution;
  } catch {
    return {};
  }
}

/** The stored partner referral code, if the student arrived via one. */
export function getPartnerRefCode(): string | null {
  return readCookie(PARTNER_COOKIE);
}

// ---------------------------------------------------------------------------
// Cross-host link forwarding
// ---------------------------------------------------------------------------

/**
 * Append the *current page's* campaign params to a cross-host link.
 *
 * Only the live URL's params, never the stored cookie's: the cookie is
 * the durable record, and pinning a months-old campaign onto a fresh
 * link would misreport traffic. Existing params on the target win, so
 * an explicitly-tagged link is never rewritten.
 */
export function withAttributionParams(href: string): string {
  if (typeof window === "undefined") return href;
  try {
    const current = new URLSearchParams(window.location.search);
    const carry = [...UTM_PARAMS, PARTNER_REF_PARAM].filter((p) =>
      current.has(p),
    );
    if (carry.length === 0) return href;

    const target = new URL(href, window.location.origin);
    for (const param of carry) {
      if (target.searchParams.has(param)) continue;
      target.searchParams.set(param, current.get(param) as string);
    }
    return /^https?:\/\//i.test(href)
      ? target.toString()
      : `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return href;
  }
}

/**
 * Hook form of `withAttributionParams`, for links rendered on a
 * statically-prerendered page.
 *
 * Returns the plain href on the server and on first client render, then
 * the decorated one after mount. Doing it in an effect rather than
 * during render is what avoids a hydration mismatch — the server has no
 * `window.location.search` to read, so computing it inline would
 * produce different markup on the two sides.
 *
 * The href stays a real attribute throughout, so middle-click and
 * "open in new tab" keep working; a click landing before hydration just
 * gets the undecorated URL, which the cookie already covers.
 */
export function useAttributedHref(href: string): string {
  return useSyncExternalStore(
    // The value only changes on navigation, which re-renders this
    // component anyway and re-reads the snapshot — so there is nothing
    // external to subscribe to.
    NEVER_CHANGES,
    // Client: decorated with the current URL's campaign params.
    () => withAttributionParams(href),
    // Server / hydration: the bare href, so both sides render the same
    // markup and the page stays statically prerenderable.
    () => href,
  );
}

/** No-op subscribe for a value that never changes outside of a render. */
const NEVER_CHANGES = () => () => {};

/**
 * Build the Play Store `referrer` value for an Android install.
 *
 * The UTM on a web link dies the moment the browser hands off to the
 * Play Store. Google's escape hatch is the install referrer: append an
 * encoded `key=value&key=value` string to the store URL, and the app can
 * read it back on first launch via the Play Install Referrer API — which
 * is the only way an install from a Facebook post is attributable at all.
 *
 * Prefers the live URL's params over the stored cookie, so a student who
 * arrives on a fresh campaign link and installs immediately is credited
 * to that campaign rather than to an older first touch.
 *
 * Returns "" when there's nothing to attribute, so callers can skip the
 * param entirely rather than append an empty one.
 */
export function buildInstallReferrer(): string {
  if (typeof window === "undefined") return "";
  try {
    const current = new URLSearchParams(window.location.search);
    const stored = getAttribution();
    const storedByParam: Record<string, string | undefined> = {
      utm_source: stored.utmSource,
      utm_medium: stored.utmMedium,
      utm_campaign: stored.utmCampaign,
      utm_content: stored.utmContent,
      utm_term: stored.utmTerm,
    };

    const out = new URLSearchParams();
    for (const param of UTM_PARAMS) {
      const value = current.get(param) ?? storedByParam[param];
      if (value) out.set(param, value);
    }
    const partner = current.get(PARTNER_REF_PARAM) ?? getPartnerRefCode();
    if (partner) out.set(PARTNER_REF_PARAM, partner);

    return out.toString();
  } catch {
    return "";
  }
}
