/**
 * Runtime env access, centralised so a missing var throws once at boot
 * rather than manifesting as a mysterious 401 in production.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time — safe to expose,
 * meant to be read from the browser. Server-only secrets
 * (NEXTAUTH_SECRET) MUST NOT carry the NEXT_PUBLIC_ prefix.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    // Only throw on the server. Client bundles inline the value at build
    // time; if it's missing at build, Next will substitute `undefined`
    // and the deployment is broken regardless.
    if (typeof window === "undefined") {
      throw new Error(
        `Missing required environment variable: ${name}. See .env.example.`,
      );
    }
    return "";
  }
  return value;
}

export const ENV = {
  API_URL:
    process.env.NEXT_PUBLIC_API_URL ??
    "https://api.bondzi.online/api/v1",
  AUTH_SECRET: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "",
  AUTH_URL: process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "",
  APP_ENV:
    (process.env.NEXT_PUBLIC_APP_ENV as
      | "development"
      | "preview"
      | "production") ?? "development",
};

/**
 * Server-only assertion — call from Server Components / Route Handlers /
 * server actions to fail loud when required secrets are missing.
 * Silently OK'd in the client bundle because `AUTH_SECRET` is
 * server-only.
 */
export function assertServerEnv(): void {
  required("NEXTAUTH_SECRET", ENV.AUTH_SECRET);
}
