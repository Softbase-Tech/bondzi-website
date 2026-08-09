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
 *                            redirects /  (unauthed) → /login
 *                                       (authed)   → /dashboard
 *                            redirects /blog/*  → bondzi.online/blog/*
 *
 *   partners.bondzi.online → future: mirrors app-host behaviour with a
 *                            second NextAuth cookie. Nothing to do here
 *                            yet — the branch is a Phase-8+ addition.
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
const MARKETING_PUBLIC_PATHS = new Set(["/"]);
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

  const isMarketingHost = host === "bondzi.online" || host === "www.bondzi.online";
  const isAppHost = host === "app.bondzi.online";

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
  // App host: authed area + auth screens.
  // -----------------------------------------------------------------
  if (isAppHost) {
    // Blog on the app host → canonicalise to the marketing host so
    // SEO doesn't split rank between the two.
    if (pathname.startsWith("/blog")) {
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
