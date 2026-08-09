"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  requestEmailVerification,
  verifyEmailCode,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

/**
 * Post-account email verification — same OTP flow as register step 2,
 * but this is for an already-signed-in user (e.g. a legacy account
 * whose email was never verified, or a fresh signup that skipped this
 * step and is being nudged from the banner on the dashboard).
 *
 * On mount we auto-request a code (best-effort; if we're rate-limited
 * the user can hit "Resend" for a real error message). Server-side
 * throttle is 3 per 10 min so opening this screen back-to-back is
 * fine.
 */
const RESEND_LOCKOUT_SECONDS = 30;

export function VerifyEmailForm() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const accessToken = session?.accessToken;
  const userEmail = session?.profile?.email ?? null;
  const alreadyVerified = session?.profile?.emailVerified ?? false;

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [initialSendDone, setInitialSendDone] = useState(false);

  const maskedEmail = useMemo(() => {
    if (!userEmail) return null;
    const [local, domain] = userEmail.split("@");
    if (!domain) return userEmail;
    return `${local.slice(0, 1)}${"*".repeat(Math.max(1, local.length - 1))}@${domain}`;
  }, [userEmail]);

  // Auto-send on mount if we have a session with an unverified email.
  useEffect(() => {
    if (initialSendDone) return;
    if (!accessToken || !userEmail || alreadyVerified) return;
    setInitialSendDone(true);
    (async () => {
      try {
        await requestEmailVerification(accessToken);
        setCooldown(RESEND_LOCKOUT_SECONDS);
      } catch {
        // Silent — the user can hit "Resend" for a real error.
      }
    })();
  }, [accessToken, userEmail, alreadyVerified, initialSendDone]);

  // Countdown tick.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function submit() {
    if (!accessToken) return;
    const clean = code.replace(/\D/g, "").slice(0, 6);
    if (clean.length !== 6) {
      toast.error("Enter the 6-digit code", {
        description: "Check the email we sent and type it exactly.",
      });
      return;
    }
    setSubmitting(true);
    try {
      await verifyEmailCode(clean, accessToken);
      // Force a NextAuth session refresh so `session.profile.emailVerified`
      // flips true across the app.
      await update();
      toast.success("Email verified", {
        description: "You're all set.",
      });
      router.replace("/dashboard");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Please check your connection and try again.";
      toast.error("Couldn't verify", { description: msg });
      setCode("");
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    if (!accessToken || cooldown > 0 || resending) return;
    setResending(true);
    try {
      await requestEmailVerification(accessToken);
      setCooldown(RESEND_LOCKOUT_SECONDS);
      toast.success("Code re-sent", {
        description: "Check your inbox in a moment.",
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Please check your connection and try again.";
      toast.error("Couldn't resend", { description: msg });
    } finally {
      setResending(false);
    }
  }

  if (alreadyVerified) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-[28px] leading-tight text-ink">
          Email already verified
        </h1>
        <p className="text-[15px] text-ink-soft">
          Your email is verified. Nothing more to do here.
        </p>
        <Button href="/dashboard" block size="lg">
          Go to dashboard
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-[32px] leading-tight text-ink">
          Verify your email
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-ink">
            {maskedEmail ?? "your inbox"}
          </span>
          . Enter it below to confirm your address.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <Input
          label="6-digit code"
          placeholder="123456"
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          enterKeyHint="go"
          maxLength={6}
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
        />
        <Button
          type="submit"
          block
          size="lg"
          loading={submitting}
          disabled={code.length !== 6 || submitting}
        >
          Verify
        </Button>
      </form>
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || resending}
          className={`text-[13px] font-semibold transition-colors ${
            cooldown > 0 || resending
              ? "text-ink-mute cursor-not-allowed"
              : "text-orange hover:text-orange-deep"
          }`}
        >
          {resending
            ? "Sending…"
            : cooldown > 0
              ? `Resend code in ${cooldown}s`
              : "Resend code"}
        </button>
      </div>
    </>
  );
}
