"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
    void signOut({
      redirect: false,
    }).finally(() => {
      // Login lives on the app subdomain in production. `appPath`
      // resolves to a relative "/login" in dev and to the full
      // https://app.bondzi.online/login in production.
      router.replace(appPath("/login"));
    });
  }, [session?.error, router]);

  return null;
}
