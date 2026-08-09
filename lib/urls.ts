import { ENV } from "./env";

/**
 * Cross-subdomain URL helper. On the marketing host (bondzi.online)
 * the "Sign in" / "Get started" CTAs need to jump to the app host
 * (app.bondzi.online) in production. In development everything runs
 * on `localhost` so we return a relative path.
 *
 * Usage:
 *   <Link href={appPath("/login")}> → "/login" in dev, "https://app.bondzi.online/login" in prod
 */
export function appPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (ENV.APP_ENV === "production") {
    return `https://app.bondzi.online${normalized}`;
  }
  return normalized;
}

export function marketingPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (ENV.APP_ENV === "production") {
    return `https://bondzi.online${normalized}`;
  }
  return normalized;
}

/**
 * Where to send an authed user after signIn / signOut. Kept centralised
 * so the login page, register page, and NextAuth's `pages.signIn`
 * don't drift.
 */
export const POST_LOGIN_DEFAULT_PATH = "/dashboard";
export const POST_LOGOUT_DEFAULT_PATH = "/";
