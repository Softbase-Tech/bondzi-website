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

  // IMPORTANT: use `req.nextUrl` — never `req.url` — as the base for
  // relative-URL redirects.
  //
  // When the middleware is wrapped by NextAuth's `auth(...)` (line ~80
  // above), `req.url` on Vercel gets normalised to whichever host
  // NEXTAUTH_URL points at (`app.bondzi.online` for us). That silently
  // rewrites every same-origin redirect on the partner subdomain onto
  // the app host — user goes to partners.bondzi.online/ and lands on
  // app.bondzi.online/partner/signin.
  //
  // `req.nextUrl` is the resolved incoming URL that respects
  // x-forwarded-host, so `new URL(path, req.nextUrl)` keeps the user
  // on the host they're actually browsing.

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
      return NextResponse.redirect(
        new URL(
          isAuthed ? "/partner/dashboard" : "/partner/signin",
          req.nextUrl,
        ),
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
      // Authed users hitting signin / register don't need the
      // signed-out flow — send them to the dashboard so they don't
      // get a stale form back.
      if (
        isAuthed &&
        (pathname === "/partner/signin" || pathname === "/partner/register")
      ) {
        return NextResponse.redirect(new URL("/partner/dashboard", req.nextUrl));
      }
      return NextResponse.next();
    }

    // Authed area — the app-facing /partner/* routes.
    if (!isAuthed) {
      const returnTo = encodeURIComponent(`${pathname}${search}`);
      return NextResponse.redirect(
        new URL(`/partner/signin?returnTo=${returnTo}`, req.nextUrl),
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
        new URL(isAuthed ? "/dashboard" : "/login", req.nextUrl),
      );
    }
    // Signed-in user tries to hit /login etc. → send them to app.
    if (isAuthed && isAuthPath(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    // Auth screens — public.
    if (isAuthPath(pathname)) return NextResponse.next();
    // Everything else on app host is authed area.
    if (!isAuthed) {
      const returnTo = encodeURIComponent(`${pathname}${search}`);
      return NextResponse.redirect(
        new URL(`/login?returnTo=${returnTo}`, req.nextUrl),
      );
    }
    return NextResponse.next();
  }

  // -----------------------------------------------------------------
  // localhost / preview / any other host: treat as combined
  // (marketing + app) so dev sees every route without needing DNS.
  // -----------------------------------------------------------------
  if (isAuthed && isAuthPath(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
  if (isMarketingPath(pathname) || isAuthPath(pathname)) {
    return NextResponse.next();
  }
  if (isAppPath(pathname) && !isAuthed) {
    const returnTo = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(
      new URL(`/login?returnTo=${returnTo}`, req.nextUrl),
    );
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/dev|favicon.ico|.*\\..*).*)",
  ],
};
