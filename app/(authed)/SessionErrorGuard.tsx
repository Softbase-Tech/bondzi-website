"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { appPath } from "@/lib/urls";

/**
 * Watches `session.error` and reacts to auth failures the NextAuth
 * jwt callback surfaces (DEVICE_KICKED from another sign-in,
 * refresh-token expiry, generic refresh failures).
 *
 * Copy stays deliberately neutral. The backend returns DEVICE_KICKED
 * whenever the refresh-JTI stops matching the current session row —
 * that includes cases the student caused themselves (opened the same
 * account in a second tab / signed in on a fresh device / a race
 * between two refresh cycles). Blaming "another device" reads as
 * accusatory when it might just be them across two tabs.
 *
 * `firedRef` prevents the effect from firing multiple times if a
 * session update flickers the error flag while sign-out is in flight.
 */
export function SessionErrorGuard() {
  const { data: session } = useSession();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    const error = session?.error;
    if (!error) return;
    firedRef.current = true;

    const description =
      error === "RefreshTokenExpired"
        ? "For your security, please sign in again."
        : "Sign back in to continue where you left off.";

    toast.info("Session ended", { description });

    // Hard navigation, NOT router.replace(): in production
    // `appPath("/login")` is the absolute
    // https://app.bondzi.online/login URL, which the App Router's
    // client router rejects — the old code threw here after the
    // toast, leaving the student "signed out" but stranded on the
    // page. A location replace always works, and it also drops every
    // bit of in-memory state (React Query caches etc.) built with the
    // dead session.
    const goToLogin = () => {
      window.location.replace(appPath("/login"));
    };
    // Failsafe: if the signOut round-trip hangs (flaky network), send
    // them to login anyway — the session cookie is already unusable.
    const failsafe = window.setTimeout(goToLogin, 3000);
    void signOut({ redirect: false })
      .catch(() => undefined)
      .finally(() => {
        window.clearTimeout(failsafe);
        goToLogin();
      });
  }, [session?.error]);

  return null;
}
