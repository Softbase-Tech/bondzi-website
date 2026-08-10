import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ApiError } from "../api/client";
import { login, refreshTokens } from "../api/auth";
import { ENV, assertServerEnv } from "../env";
import type { SafeUser } from "../api/types";

assertServerEnv();

/**
 * The Bondzi web project hosts two signed-in surfaces served from the
 * same codebase:
 *
 *   - app.bondzi.online       — students
 *   - partners.bondzi.online  — partners
 *
 * Isolation rule (deliberate): the session cookies are HOST-SCOPED,
 * not `.bondzi.online`-scoped. Signing in on one subdomain does not
 * leak a session to the other. One Bondzi account still — the
 * backend is one identity system — but two independent web sessions
 * per user. This eliminates every cross-subdomain redirect quirk and
 * lets us reason about each host as a self-contained application.
 *
 * The distinct cookie names (`student-…`) are historical; there's no
 * cross-host collision to avoid now that cookies are host-scoped,
 * but renaming would force every existing session to re-login. The
 * partner surface uses the same cookie name because it's running the
 * same NextAuth config — the browser scopes it to the partner host
 * automatically.
 *
 * `__Secure-` prefix in production is a browser-enforced flag that
 * requires the cookie to be set over HTTPS with the Secure attribute.
 * `__Host-` on the CSRF cookie additionally requires no Domain
 * attribute + Path=/ — both of which we satisfy — so its scope is
 * always implicit.
 */
const isProd =
  ENV.APP_ENV === "production" ||
  process.env.VERCEL_ENV === "production";
const STUDENT_SESSION_COOKIE_NAME = isProd
  ? "__Secure-authjs.student-session-token"
  : "authjs.student-session-token";
const STUDENT_CALLBACK_COOKIE_NAME = isProd
  ? "__Secure-authjs.student-callback-url"
  : "authjs.student-callback-url";
const STUDENT_CSRF_COOKIE_NAME = isProd
  ? "__Host-authjs.student-csrf-token"
  : "authjs.student-csrf-token";

/**
 * Access-token TTL is 15 minutes on the backend. We refresh a couple
 * of minutes early so the session's access token is never on the
 * edge of expiry when a client request goes out.
 */
const ACCESS_TOKEN_REFRESH_LEEWAY_MS = 60 * 1000; // 60s

/**
 * NextAuth v5 config for the student-facing web app.
 *
 * The backend already owns the identity store (users table, password
 * hashing, OTP flows, DEVICE_KICKED enforcement). NextAuth's role here
 * is:
 *
 *   1. Wrap the backend `/auth/login` call in a Credentials provider so
 *      React components can call `signIn("credentials", …)` and get a
 *      cookie-backed session in return.
 *   2. Persist the JWT pair (accessToken + refreshToken + user profile)
 *      in the session JWT itself, encrypted and HttpOnly.
 *   3. Refresh the access token when it approaches expiry, transparent
 *      to consumers.
 *   4. Sign the user out on refresh failure (session invalidated).
 *
 * The mobile app does the equivalent flow inline with SecureStore +
 * axios interceptor. Web centralises it here so the API client stays
 * dumb.
 */
export const authConfig: NextAuthConfig = {
  // NextAuth v5 auto-detects the URL when unset in Vercel-style
  // deployments; explicit override supported via NEXTAUTH_URL for
  // local dev + custom infra.
  ...(ENV.AUTH_URL ? { basePath: "/api/auth" } : {}),
  secret: ENV.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    // Refresh TTL on the backend is 90d. The NextAuth session mirrors
    // that so a returning user isn't kicked prematurely; the actual
    // stop condition is the refresh-token expiry stored inside the
    // session JWT.
    maxAge: 90 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  cookies: {
    // No `domain` on any of these — cookies are host-scoped. A
    // session set on partners.bondzi.online never becomes visible on
    // app.bondzi.online, and vice versa.
    sessionToken: {
      name: STUDENT_SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
    callbackUrl: {
      name: STUDENT_CALLBACK_COOKIE_NAME,
      options: {
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
    csrfToken: {
      name: STUDENT_CSRF_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        phone: { label: "Phone", type: "tel" },
        password: { label: "Password", type: "password" },
        deviceId: { label: "Device ID", type: "text" },
        deviceName: { label: "Device Name", type: "text" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : undefined;
        const phone =
          typeof credentials?.phone === "string"
            ? credentials.phone.trim()
            : undefined;
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        // Backend requires `deviceId` (single-active-session enforcement)
        // — we can't read it from a cookie here because NextAuth runs
        // this callback server-side. LoginForm threads it in via the
        // signIn() credentials.
        const deviceId =
          typeof credentials?.deviceId === "string" && credentials.deviceId.length > 0
            ? credentials.deviceId
            : undefined;
        const deviceName =
          typeof credentials?.deviceName === "string" && credentials.deviceName.length > 0
            ? credentials.deviceName
            : undefined;
        if ((!email && !phone) || !password) return null;

        try {
          const res = await login({
            email: email && email.length > 0 ? email : undefined,
            phone: phone && phone.length > 0 ? phone : undefined,
            password,
            deviceId,
            deviceName,
          });
          // Role gate: mobile is student-only; the web app follows the
          // same rule. Staff must use /admin.
          if (res.user.role !== "student") {
            // Returning null triggers NextAuth's generic
            // CredentialsSignin error — the login page renders our
            // own copy for the non-student case via the returned
            // `error` query param check.
            throw new Error("NON_STUDENT_ROLE");
          }
          // NextAuth uses the returned object as the initial `user`
          // in the `jwt` callback below. We pack the JWT pair alongside
          // the user profile.
          return {
            id: res.user.id,
            email: res.user.email ?? undefined,
            name: res.user.fullName,
            image: res.user.avatarUrl ?? undefined,
            profile: res.user,
            accessToken: res.tokens.accessToken,
            refreshToken: res.tokens.refreshToken,
            accessExpiresAt: res.tokens.accessExpiresAt,
            refreshExpiresAt: res.tokens.refreshExpiresAt,
          } as unknown as import("next-auth").User;
        } catch (err) {
          if (err instanceof ApiError) {
            // Bad credentials + rate-limits + validation failures all
            // manifest as an ApiError; NextAuth swallows the message
            // and just returns a generic "CredentialsSignin" error to
            // the sign-in page. Callers use the /login screen's
            // "?error=" handling to render specific copy.
            return null;
          }
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    /**
     * Runs on every request to /api/auth/session and on every
     * sign-in. Owns the refresh cycle: if the stored access token is
     * about to expire, hit /auth/refresh and store the new pair.
     *
     * Also handles the explicit `update` trigger fired by
     * `useSession().update(...)` — used today by the exam-type switch
     * screen, which receives a brand-new token pair from
     * `PATCH /auth/me/exam-type` and needs to swap the session
     * tokens without a full sign-out + sign-in.
     */
    async jwt({ token, user, trigger, session }) {
      // Explicit update from the client with a fresh token pair and/or
      // profile snapshot. Trust it — the client only invokes this after
      // a successful backend mutation. Merge in whatever was supplied
      // and leave the rest of the token untouched.
      if (trigger === "update" && session && typeof session === "object") {
        const patch = session as {
          accessToken?: string;
          refreshToken?: string;
          accessExpiresAt?: string;
          refreshExpiresAt?: string;
          profile?: SafeUser;
        };
        if (patch.accessToken) token.accessToken = patch.accessToken;
        if (patch.refreshToken) token.refreshToken = patch.refreshToken;
        if (patch.accessExpiresAt) token.accessExpiresAt = patch.accessExpiresAt;
        if (patch.refreshExpiresAt) token.refreshExpiresAt = patch.refreshExpiresAt;
        if (patch.profile) token.profile = patch.profile;
        delete (token as { error?: string }).error;
        return token;
      }

      // First call after sign-in: `user` is populated from
      // Credentials.authorize.
      if (user) {
        const authed = user as unknown as {
          accessToken: string;
          refreshToken: string;
          accessExpiresAt: string;
          refreshExpiresAt: string;
          profile: SafeUser;
        };
        token.accessToken = authed.accessToken;
        token.refreshToken = authed.refreshToken;
        token.accessExpiresAt = authed.accessExpiresAt;
        token.refreshExpiresAt = authed.refreshExpiresAt;
        token.profile = authed.profile;
        return token;
      }

      // Subsequent calls: check if we need to refresh.
      const accessExpiresAt = token.accessExpiresAt as string | undefined;
      const refreshToken = token.refreshToken as string | undefined;
      if (!accessExpiresAt || !refreshToken) {
        // No access recorded — this session predates the refresh
        // machinery or was hydrated without one. Force sign-out.
        return { ...token, error: "MissingTokens" };
      }
      const accessExpiryMs = Date.parse(accessExpiresAt);
      const nowMs = Date.now();
      if (nowMs + ACCESS_TOKEN_REFRESH_LEEWAY_MS < accessExpiryMs) {
        // Still fresh enough — no work.
        return token;
      }

      // Access token needs rotation. If refresh itself has expired,
      // sign out.
      const refreshExpiresAt = token.refreshExpiresAt as string | undefined;
      if (refreshExpiresAt && Date.parse(refreshExpiresAt) < nowMs) {
        return { ...token, error: "RefreshTokenExpired" };
      }

      try {
        const fresh = await refreshTokens(refreshToken);
        token.accessToken = fresh.accessToken;
        token.refreshToken = fresh.refreshToken;
        token.accessExpiresAt = fresh.accessExpiresAt;
        token.refreshExpiresAt = fresh.refreshExpiresAt;
        // Clear any transient error from a previous cycle.
        delete (token as { error?: string }).error;
        return token;
      } catch (err) {
        // Distinguish DEVICE_KICKED (specific sign-out reason) from a
        // generic refresh failure. The session client-side reads
        // `session.error` and shows the appropriate UX.
        if (err instanceof ApiError && err.code === "DEVICE_KICKED") {
          return { ...token, error: "DeviceKicked" };
        }
        return { ...token, error: "RefreshFailed" };
      }
    },
    /**
     * The session object is what `useSession()` / `auth()` return to
     * the app. We surface the access token (needed by the client fetch
     * layer), the current user profile, and any error flag from the
     * jwt callback so the UI can react (redirect to /login with a
     * "kicked from another device" toast, etc.).
     */
    async session({ session, token }) {
      // The typed jwt callback stashes strongly-typed fields on the
      // token, but the `session` callback receives them widened to
      // `unknown` because NextAuth doesn't infer through the JWT
      // module augmentation for this callback. Cast at the boundary
      // — `types/next-auth.d.ts` establishes the union types and the
      // jwt callback only ever writes those exact tags.
      session.accessToken = token.accessToken as string | undefined;
      session.profile = token.profile as
        | import("@/lib/api/types").SafeUser
        | undefined;
      session.error = token.error as import("next-auth").Session["error"];
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
