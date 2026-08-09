/**
 * Typed fetch client used by every service module + React Query hook.
 *
 * Contract with the mobile app (which hits the same backend):
 *   - Sends `Authorization: Bearer <accessToken>` from the current
 *     NextAuth session.
 *   - Sends `X-Device-ID` + `X-Device-Name` so the backend's device-
 *     bound session enforcement can tell "web" from the same user's
 *     mobile install.
 *   - Unwraps the `{ data: T }` envelope produced by the backend's
 *     TransformInterceptor.
 *   - Surfaces the backend's `ApiErrorBody` shape (with `code` when
 *     present) so callers can branch on `code === "DEVICE_KICKED"`
 *     etc. without string-matching the message.
 *
 * Two façades:
 *   - `api()` — client-side, reads the token from the NextAuth session
 *     via `useSession`. The 401 → refresh cycle is delegated to NextAuth's
 *     `jwt` callback (which calls `/auth/refresh` when the access has
 *     expired). This client only handles the request/response part.
 *   - `apiServer()` — server-side, reads the token from `auth()` at
 *     call time. For Server Actions and Route Handlers.
 *
 * Both share the same underlying `request()` helper.
 */

import { ENV } from "../env";
import { getWebDeviceId, getWebDeviceName } from "../device";
import type { ApiErrorBody, Envelope } from "./types";

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  accessToken?: string | null;
  signal?: AbortSignal;
  /**
   * Skip envelope unwrapping. A few endpoints (auth/logout,
   * NO_CONTENT responses) return no body — we want the caller to
   * receive `undefined` rather than a parse error.
   */
  raw?: boolean;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;
  readonly code: string | null;
  readonly requestId: string | null;
  constructor(
    status: number,
    body: ApiErrorBody | null,
    requestId: string | null,
  ) {
    const message = extractApiErrorMessage(body) ?? `HTTP ${status}`;
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.code = body?.code ?? null;
    this.requestId = requestId;
  }
}

function extractApiErrorMessage(body: ApiErrorBody | null): string | null {
  if (!body) return null;
  if (Array.isArray(body.message)) return body.message[0] ?? null;
  return body.message ?? body.error ?? null;
}

function buildUrl(
  path: string,
  query: ApiRequestOptions["query"],
): string {
  const base = ENV.API_URL.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${suffix}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Core request helper. Server callers pass `accessToken` explicitly
 * (from `auth()`); client callers rely on the higher-level `api()`
 * wrapper which handles that.
 */
async function request<T>(
  path: string,
  opts: ApiRequestOptions = {},
): Promise<T> {
  const method = opts.method ?? "GET";
  const url = buildUrl(path, opts.query);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers ?? {}),
  };
  if (opts.accessToken) {
    headers["Authorization"] = `Bearer ${opts.accessToken}`;
  }
  // Device headers are best-effort — SSR calls (no `document`) will
  // omit them; the backend accepts requests without them on non-device-
  // bound endpoints.
  if (typeof window !== "undefined") {
    const deviceId = getWebDeviceId();
    if (deviceId) headers["X-Device-ID"] = deviceId;
    headers["X-Device-Name"] = getWebDeviceName();
  }

  const init: RequestInit = {
    method,
    headers,
    // Backend cookies aren't used for auth (we use Bearer) — omit to
    // avoid CORS complexity.
    credentials: "omit",
    signal: opts.signal,
  };
  if (opts.body !== undefined && method !== "GET") {
    init.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, init);
  const requestId = res.headers.get("x-request-id");

  // 204 / other no-body successes.
  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let parsed: unknown = undefined;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // Non-JSON body on error path is treated as a raw string message.
      parsed = { message: text };
    }
  }

  if (!res.ok) {
    const errorBody = (parsed as ApiErrorBody | undefined) ?? null;
    throw new ApiError(res.status, errorBody, requestId);
  }

  if (opts.raw) return parsed as T;
  // Unwrap the backend's `{ data, meta }` envelope. If the body doesn't
  // match that shape (e.g. an already-flat response from a rare
  // endpoint) return it as-is.
  if (
    parsed &&
    typeof parsed === "object" &&
    "data" in (parsed as Record<string, unknown>)
  ) {
    return (parsed as Envelope<T>).data;
  }
  return parsed as T;
}

/**
 * Client-side entry point. Reads the current NextAuth session's
 * access token via `getSession()` (works in both browser and server
 * components; on server it reads the request cookie automatically).
 *
 * Callers that already have the token in hand (e.g. inside a NextAuth
 * callback that has just refreshed it) should use `requestRaw()`.
 */
export async function api<T>(
  path: string,
  opts: ApiRequestOptions = {},
): Promise<T> {
  // Lazy import so this module stays server-safe (next-auth/react
  // pulls in browser-only bits).
  const { getSession } = await import("next-auth/react");
  const session = await getSession();
  const accessToken =
    (session as unknown as { accessToken?: string } | null)?.accessToken ??
    null;
  return request<T>(path, { ...opts, accessToken });
}

/**
 * Low-level entry point for callers that supply the token themselves.
 * Used by:
 *   - NextAuth's Credentials `authorize()` — no session yet.
 *   - Server actions that already ran `auth()`.
 *   - The refresh-cycle handler inside NextAuth's `jwt` callback.
 */
export async function requestRaw<T>(
  path: string,
  opts: ApiRequestOptions = {},
): Promise<T> {
  return request<T>(path, opts);
}

/**
 * Server-side wrapper — reads the token from `auth()`. Import from
 * `@/lib/auth/config` in your route handler / server action; keep this
 * standalone helper so `lib/api` doesn't grow a hard dep on the auth
 * config (circular-import risk).
 */
export async function apiServer<T>(
  accessToken: string | null,
  path: string,
  opts: Omit<ApiRequestOptions, "accessToken"> = {},
): Promise<T> {
  return request<T>(path, { ...opts, accessToken });
}
