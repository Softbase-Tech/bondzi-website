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
 *   bondzi.online         →  serves /, /blog/*, and the public legal
 *                            pages (/privacy-policy, /terms-of-service,
 *                            /account-deletion). Redirects /login
 *                            /register /dashboard etc. to
 *                            app.bondzi.online/…
 *
 *   app.bondzi.online     →  serves /login /register /dashboard etc.
 *   www.app.bondzi.online →  same behaviour — both bare and www-prefixed
 *                            forms are treated as app hosts so whichever
 *                            side Vercel canonicalises to also works.
 *                            redirects /  (unauthed) → /login
 *                                       (authed)   → /dashboard
 *                            redirects /blog/*  → bondzi.online/blog/*
 *
 *   partners.bondzi.online → fully self-contained. Every partner-side
 *                            auth path lives on this host —
 *                            /partner/signin, /partner/register,
 *                            /partner/forgot-password,
 *                            /partner/reset-password,
 *                            /partner/signed-out. Session cookies
 *                            are HOST-SCOPED (see lib/auth/config.ts)
 *                            so signing in here writes a cookie
 *                            visible only on this host; the partner
 *                            surface never redirects to app.bondzi.
 *                            online for anything.
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

// Public legal pages — canonical on the marketing host and reachable
// WITHOUT a session (app-store reviewers, logged-out users). Kept in one
// list because they're referenced twice: allowlisted on the marketing host
// below, and canonicalised marketing-ward from the app host.
const LEGAL_PUBLIC_PATHS = [
  "/privacy-policy",
  "/terms-of-service",
  "/account-deletion",
];

// Marketing-only surfaces. Everything else on the marketing host that
// isn't in this set redirects to the app host.
const MARKETING_PUBLIC_PATHS = new Set([
  "/",
  "/partners",
  "/pricing",
  ...LEGAL_PUBLIC_PATHS,
]);
// `/r/<CODE>` is the partner share link. It lives on the marketing host
// (that's the URL partners hand out) and is a Route Handler that sets the
// referral cookie and bounces to `/`.
const MARKETING_PUBLIC_PREFIXES = ["/blog", "/r/"];

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
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const originHere = `${proto}://${host}`;

  // CRITICAL — build every redirect Location as a plain absolute
  // string, NEVER pass a URL object.
  //
  // Why: this middleware is wrapped by NextAuth's `auth(...)`. On
  // Vercel, when NEXTAUTH_URL is set (ours points at app.bondzi.
  // online), NextAuth normalises BOTH `req.url` and `req.nextUrl` to
  // that host. Every `new URL("/partner/signin", req.nextUrl)` we
  // fed to NextResponse.redirect() silently produced
  // https://app.bondzi.online/partner/signin — even when the actual
  // browser was on partners.bondzi.online. Cost us hours.
  //
  // `x-forwarded-host` is set by Vercel Edge from the real incoming
  // request BEFORE NextAuth sees it, so it always reflects the
  // browsing host. Building `${proto}://${host}${path}` sidesteps
  // NextAuth's URL normalisation entirely.
  const redirectTo = (path: string): NextResponse =>
    NextResponse.redirect(`${originHere}${path}`);

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
    return NextResponse.redirect(
      `https://app.bondzi.online${pathname}${search}`,
      308,
    );
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
    // Every public partner route — reachable without a session.
    // Signin / register / forgot-password / reset-password /
    // signed-out are the full auth surface, all served from this
    // host. No path here ever redirects to app.bondzi.online.
    const PARTNER_PUBLIC_PATHS = new Set<string>([
      "/partner/signin",
      "/partner/register",
      "/partner/forgot-password",
      "/partner/reset-password",
      "/partner/signed-out",
    ]);

    // Bare "/" lands on the partner dashboard (authed) or the
    // partner-branded sign-in page.
    if (pathname === "/") {
      return redirectTo(
        isAuthed ? "/partner/dashboard" : "/partner/signin",
      );
    }

    // Only /partner/* paths are served on this host. Anything else
    // — including /login, /register, /dashboard etc. from the
    // student surface — 404s cleanly instead of redirecting off-
    // host, keeping the partner brand hermetically separate.
    if (!pathname.startsWith("/partner")) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (PARTNER_PUBLIC_PATHS.has(pathname)) {
      // Authed users hitting /partner/signin don't need to see a
      // signin form — send them to the dashboard.
      //
      // /partner/register is deliberately NOT auto-redirected here:
      // a signed-in user without a partner row needs to reach the
      // register page to become a partner, and the dashboard page
      // sends them here when `partner` is null. Auto-redirecting
      // register → dashboard produced ERR_TOO_MANY_REDIRECTS.
      // The register page's own server-side code short-circuits to
      // /partner/dashboard when the user already has a partner row.
      if (isAuthed && pathname === "/partner/signin") {
        return redirectTo("/partner/dashboard");
      }
      return NextResponse.next();
    }

    // Authed area — the app-facing /partner/* routes.
    if (!isAuthed) {
      const returnTo = encodeURIComponent(`${pathname}${search}`);
      return redirectTo(`/partner/signin?returnTo=${returnTo}`);
    }
    return NextResponse.next();
  }

  // -----------------------------------------------------------------
  // App host: authed area + auth screens.
  // -----------------------------------------------------------------
  if (isAppHost) {
    // Blog + Partners + legal pages landing on the app host →
    // canonicalise to the marketing host so SEO doesn't split rank
    // between the two, and so the legal pages are served publicly (the
    // app host would otherwise login-gate them).
    if (
      pathname.startsWith("/blog") ||
      pathname.startsWith("/r/") ||
      pathname === "/partners" ||
      LEGAL_PUBLIC_PATHS.includes(pathname)
    ) {
      return NextResponse.redirect(
        `https://bondzi.online${pathname}${search}`,
        308,
      );
    }
    // Marketing "/" on the app host → land on /dashboard (authed) or
    // /login (public).
    if (pathname === "/") {
      return redirectTo(isAuthed ? "/dashboard" : "/login");
    }
    // Signed-in user tries to hit /login etc. → send them to app.
    if (isAuthed && isAuthPath(pathname)) {
      return redirectTo("/dashboard");
    }
    // Auth screens — public.
    if (isAuthPath(pathname)) return NextResponse.next();
    // Everything else on app host is authed area.
    if (!isAuthed) {
      const returnTo = encodeURIComponent(`${pathname}${search}`);
      return redirectTo(`/login?returnTo=${returnTo}`);
    }
    return NextResponse.next();
  }

  // -----------------------------------------------------------------
  // localhost / preview / any other host: treat as combined
  // (marketing + app) so dev sees every route without needing DNS.
  // -----------------------------------------------------------------
  if (isAuthed && isAuthPath(pathname)) {
    return redirectTo("/dashboard");
  }
  if (isMarketingPath(pathname) || isAuthPath(pathname)) {
    return NextResponse.next();
  }
  if (isAppPath(pathname) && !isAuthed) {
    const returnTo = encodeURIComponent(`${pathname}${search}`);
    return redirectTo(`/login?returnTo=${returnTo}`);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/dev|favicon.ico|.*\\..*).*)",
  ],
};
