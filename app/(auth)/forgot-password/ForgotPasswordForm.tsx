"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { detectAuthMode, normalizeGhanaPhone } from "@/lib/auth-input";

/**
 * Forgot-password step 1: user types email or phone; we POST to
 * `/auth/forgot-password`. The backend always returns 204
 * (anti-enumeration) regardless of whether the identifier maps to a
 * user, so on any successful HTTP round-trip we route to
 * /reset-password with the target in the query string.
 *
 * The reset-password screen shows "we sent a code to X" without any
 * confirmation that X was a real account — an attacker who types
 * random emails gets the same UX as a legitimate user.
 */
export function ForgotPasswordForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const mode = useMemo(() => detectAuthMode(identifier), [identifier]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (identifier.trim().length === 0 || submitting) return;
    setFieldError(null);
    setSubmitting(true);

    try {
      if (mode === "phone") {
        const e164 = normalizeGhanaPhone(identifier);
        if (!e164) {
          setSubmitting(false);
          setFieldError("Use a Ghana number, e.g. 0205778299.");
          return;
        }
        await forgotPassword({ phone: e164 });
        router.push(`/reset-password?phone=${encodeURIComponent(e164)}`);
      } else {
        const email = identifier.trim().toLowerCase();
        if (!email.includes("@")) {
          setSubmitting(false);
          setFieldError("Enter the email you used to sign up.");
          return;
        }
        await forgotPassword({ email });
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }
    } catch (err) {
      // Non-204 failure — rate-limited (429), server error (5xx), or
      // network. Surface the specific message when the backend
      // supplied one; otherwise stay generic to preserve anti-
      // enumeration.
      const msg =
        err instanceof ApiError
          ? err.message
          : "Please check your connection and try again.";
      toast.error("Couldn't send reset code", { description: msg });
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email or phone"
          placeholder="you@example.com or 0205778299"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode={mode === "phone" ? "tel" : "email"}
          autoComplete={mode === "phone" ? "tel" : "email"}
          enterKeyHint="send"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={fieldError}
          hint={
            mode === "phone"
              ? "We'll text you a 6-digit code."
              : mode === "email"
                ? "We'll email you a 6-digit code."
                : undefined
          }
        />
        <Button
          type="submit"
          block
          size="lg"
          loading={submitting}
          disabled={identifier.trim().length === 0 || submitting}
        >
          {mode === "phone" ? "Send SMS code" : "Send email code"}
        </Button>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-ink-soft">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-semibold text-orange hover:text-orange-deep transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}
