import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";

/**
 * Next 16's proxy (successor to middleware). Runs before every matched
 * request. Two responsibilities:
 *
 *   1. Route protection — the (authed) group requires a NextAuth session.
 *   2. Host-based split between the marketing domain and the app
 *      subdomain — the two brands share one Vercel project.
 *
 * Host split (production only — localhost is treated as "app host"
 * so dev sees every route):
 *
 *   bondzi.online         →  serves /, /blog/*  (marketing only)
 *                            redirects /login /register /dashboard etc.
 *                            to app.bondzi.online/…
 *
 *   app.bondzi.online     →  serves /login /register /dashboard etc.
 *   www.app.bondzi.online →  same behaviour — both bare and www-prefixed
 *                            forms are treated as app hosts so whichever
 *                            side Vercel canonicalises to also works.
 *                            redirects /  (unauthed) → /login
 *                                       (authed)   → /dashboard
 *                            redirects /blog/*  → bondzi.online/blog/*
 *
 *   partners.bondzi.online → mirrors app-host behaviour: `/` lands the
 *                            user on /partner/dashboard, unauthed requests
 *                            bounce to /login on the app host with a
 *                            returnTo. Uses the same session cookie as
 *                            the app host — cookies are scoped to
 *                            `.bondzi.online` in prod so signing in on
 *                            app.bondzi.online also signs in on
 *                            partners.bondzi.online.
 *
 * On localhost or a Vercel preview URL, the host-split branch is
 * skipped (`isMarketingHost` and `isAppHost` both false) so every
 * route stays reachable at every URL.
 */

const AUTH_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

// Marketing-only surfaces. Everything else on the marketing host that
// isn't in this set redirects to the app host.
const MARKETING_PUBLIC_PATHS = new Set(["/", "/partners"]);
const MARKETING_PUBLIC_PREFIXES = ["/blog"];

// Public prefixes that stay reachable everywhere (NextAuth's own
// route handler must never be redirected — it needs to reply on
// whatever host it was called from).
const ALWAYS_PUBLIC_PREFIXES = ["/api/auth"];

function isAlwaysPublic(pathname: string): boolean {
  return ALWAYS_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function isMarketingPath(pathname: string): boolean {
  if (MARKETING_PUBLIC_PATHS.has(pathname)) return true;
  return MARKETING_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function isAppPath(pathname: string): boolean {
  return !isMarketingPath(pathname);
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.has(pathname);
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname, search } = req.nextUrl;
  const session = req.auth as { user?: unknown } | null;
  const isAuthed = Boolean(session?.user);

  if (isAlwaysPublic(pathname)) return NextResponse.next();

  // Vercel populates `x-forwarded-host`; on localhost it's just the
  // Host header. We normalise to lower-case so the compare doesn't
  // trip on capitalisation.
  const forwardedHost =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const host = forwardedHost.toLowerCase().split(":")[0];

  const isMarketingHost =
    host === "bondzi.online" || host === "www.bondzi.online";
  // Both bare and www-prefixed forms of the app subdomain resolve to
  // the same project. Whichever one Vercel serves the project on (and
  // whichever one redirects to the other) both need to trigger the
  // app-host branch below so the routing works either way round.
  const isAppHost =
    host === "app.bondzi.online" || host === "www.app.bondzi.online";
  // Partner portal subdomain — carries the same NextAuth cookie as the
  // app host (`.bondzi.online`-scoped) so a signed-in user on either
  // subdomain is signed in on both.
  const isPartnerHost =
    host === "partners.bondzi.online" || host === "www.partners.bondzi.online";

  // -----------------------------------------------------------------
  // Marketing host: only marketing routes served here.
  // -----------------------------------------------------------------
  if (isMarketingHost) {
    if (isMarketingPath(pathname)) {
      return NextResponse.next();
    }
    // Everything else on marketing → forward to the app host.
    const target = new URL(`https://app.bondzi.online${pathname}${search}`);
    return NextResponse.redirect(target, 308);
  }

  // -----------------------------------------------------------------
  // Partner host: rewrites bare paths onto the /partner/* surface and
  // sends unauthed traffic to the app-host login with a returnTo.
  // Both bare (partners.bondzi.online) and www-prefixed
  // (www.partners.bondzi.online) enter this branch; the returnTo
  // preserves whichever host the user actually landed on so we don't
  // bounce them across subdomains during login.
  //
  // Public partner routes — paths under /partner/* that must remain
  // reachable without a session. `signed-out` is the post-logout
  // landing page; a user who just cleared their cookie must be able
  // to render it. Add more here (e.g. a public terms preview) as the
  // surface grows.
  // -----------------------------------------------------------------
  if (isPartnerHost) {
    // Public partner routes — reachable without a session so we
    // don't infinite-loop a signed-out visitor. `signin` is the
    // partner-branded login; `signed-out` is the post-logout
    // landing. Both live in the (partner-public) route group with
    // no auth guard in their layout.
    const PARTNER_PUBLIC_PATHS = new Set<string>([
      "/partner/signin",
      "/partner/signed-out",
    ]);
    // Bare "/" lands on the partner dashboard (authed) or on the
    // partner-branded sign-in page (public). Everything stays on
    // the partner host — no cross-subdomain roundtrip means no
    // cookie-scoping dependency at all.
    if (pathname === "/") {
      return NextResponse.redirect(
        new URL(
          isAuthed ? "/partner/dashboard" : "/partner/signin",
          req.url,
        ),
      );
    }
    // Public partner pages are reachable without a session.
    if (PARTNER_PUBLIC_PATHS.has(pathname)) {
      // If an already-authed user hits /partner/signin, send them
      // straight to the dashboard — no reason to re-render a login
      // they don't need.
      if (pathname === "/partner/signin" && isAuthed) {
        return NextResponse.redirect(new URL("/partner/dashboard", req.url));
      }
      return NextResponse.next();
    }
    // Student auth routes (/login, /register, /forgot-password, …)
    // canonicalise to the app host — students shouldn't sign in on
    // the partner subdomain, and this keeps SEO clean.
    if (isAuthPath(pathname)) {
      return NextResponse.redirect(
        new URL(`https://app.bondzi.online${pathname}${search}`),
        308,
      );
    }
    if (!pathname.startsWith("/partner")) {
      // Anything not under /partner belongs on the app host —
      // shuttle the request there instead of 404ing.
      return NextResponse.redirect(
        new URL(`https://app.bondzi.online${pathname}${search}`),
        308,
      );
    }
    if (!isAuthed) {
      // Same-host redirect — bounce to the partner-branded signin
      // and preserve where they were going via returnTo. Keeping
      // the user on partners.bondzi.online means the cookie the
      // browser writes on login is on the same host they're
      // browsing, eliminating cross-subdomain scoping risk.
      const returnTo = encodeURIComponent(`${pathname}${search}`);
      return NextResponse.redirect(
        new URL(`/partner/signin?returnTo=${returnTo}`, req.url),
      );
    }
    return NextResponse.next();
  }

  // -----------------------------------------------------------------
  // App host: authed area + auth screens.
  // -----------------------------------------------------------------
  if (isAppHost) {
    // Blog + Partners landing on the app host → canonicalise to the
    // marketing host so SEO doesn't split rank between the two.
    if (pathname.startsWith("/blog") || pathname === "/partners") {
      return NextResponse.redirect(
        new URL(`https://bondzi.online${pathname}${search}`),
        308,
      );
    }
    // Marketing "/" on the app host → land on /dashboard (authed) or
    // /login (public).
    if (pathname === "/") {
      return NextResponse.redirect(
        new URL(isAuthed ? "/dashboard" : "/login", req.url),
      );
    }
    // Signed-in user tries to hit /login etc. → send them to app.
    if (isAuthed && isAuthPath(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // Auth screens — public.
    if (isAuthPath(pathname)) return NextResponse.next();
    // Everything else on app host is authed area.
    if (!isAuthed) {
      const returnTo = encodeURIComponent(`${pathname}${search}`);
      return NextResponse.redirect(
        new URL(`/login?returnTo=${returnTo}`, req.url),
      );
    }
    return NextResponse.next();
  }

  // -----------------------------------------------------------------
  // localhost / preview / any other host: treat as combined
  // (marketing + app) so dev sees every route without needing DNS.
  // -----------------------------------------------------------------
  if (isAuthed && isAuthPath(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (isMarketingPath(pathname) || isAuthPath(pathname)) {
    return NextResponse.next();
  }
  if (isAppPath(pathname) && !isAuthed) {
    const returnTo = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(
      new URL(`/login?returnTo=${returnTo}`, req.url),
    );
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/dev|favicon.ico|.*\\..*).*)",
  ],
};
