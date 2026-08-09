import { handlers } from "@/lib/auth/config";

/**
 * NextAuth v5 catch-all route handler. Exposes the standard endpoints:
 *   GET  /api/auth/session           — current session
 *   POST /api/auth/signin/credentials
 *   POST /api/auth/signout
 *   GET  /api/auth/callback/credentials
 *   GET  /api/auth/csrf
 * etc.
 *
 * All actual logic lives in `lib/auth/config.ts` — this file exists
 * only because Next 16 requires the route to be defined at the URL
 * NextAuth expects (`/api/auth/*`).
 */
export const { GET, POST } = handlers;
