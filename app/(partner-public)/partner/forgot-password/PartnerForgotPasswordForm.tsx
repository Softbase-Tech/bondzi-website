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
 * Partner "forgot password" step 1. Same backend + same UX rules as
 * the student ForgotPasswordForm (anti-enumeration: any successful
 * round-trip lands on the reset page regardless of whether the
 * identifier maps to a real account), but every link stays on the
 * partner host.
 */
export function PartnerForgotPasswordForm() {
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
        router.push(
          `/partner/reset-password?phone=${encodeURIComponent(e164)}`,
        );
      } else {
        const email = identifier.trim().toLowerCase();
        if (!email.includes("@")) {
          setSubmitting(false);
          setFieldError("Enter the email you used to sign up.");
          return;
        }
        await forgotPassword({ email });
        router.push(
          `/partner/reset-password?email=${encodeURIComponent(email)}`,
        );
      }
    } catch (err) {
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
          href="/partner/signin"
          className="font-semibold text-orange hover:text-orange-deep"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}
