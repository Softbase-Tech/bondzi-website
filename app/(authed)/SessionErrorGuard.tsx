"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { appPath } from "@/lib/urls";

/**
 * Watches `session.error` and reacts to auth failures the NextAuth
 * jwt callback surfaces (DEVICE_KICKED from another sign-in,
 * refresh-token expiry, generic refresh failures). Behaviour matches
 * mobile's DeviceKickedSheet + unauthorizedHandler:
 *
 *   - DeviceKicked      → tear-down sign-out + descriptive toast so
 *                          the student understands what happened.
 *   - RefreshTokenExpired → silent sign-out; the toast reads as a
 *                          normal "session expired" rather than
 *                          something scary.
 *   - RefreshFailed      → generic sign-out + neutral toast (usually a
 *                          network hiccup during rotation).
 *   - MissingTokens      → same as RefreshFailed.
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
      error === "DeviceKicked"
        ? "You were signed in on another device."
        : error === "RefreshTokenExpired"
          ? "For your security, please sign in again."
          : "Please sign in again to continue.";

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
