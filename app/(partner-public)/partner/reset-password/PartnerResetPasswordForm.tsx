"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { validatePasswordMin } from "@/lib/password";

/**
 * Partner reset step 2. Takes the OTP + a new password. Reads the
 * target identifier from the query string set by
 * /partner/forgot-password. On success sends the user to
 * /partner/signin.
 */
export function PartnerResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const phone = params.get("phone") || "";
  const channel: "email" | "phone" | null = email
    ? "email"
    : phone
      ? "phone"
      : null;

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  if (!channel) {
    return (
      <div className="space-y-4">
        <p className="text-[15px] text-ink-soft">
          We couldn&apos;t find the reset context. Request a fresh
          code and try again.
        </p>
        <Button href="/partner/forgot-password" block size="lg">
          Get a new code
        </Button>
      </div>
    );
  }

  const target = channel === "email" ? email : phone;
  const kind = channel === "email" ? "email" : "SMS";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setOtpError(null);
    setPasswordError(null);
    setConfirmError(null);
    if (otp.length !== 6) {
      setOtpError(`Enter the 6-digit ${kind} code.`);
      return;
    }
    const pwErr = validatePasswordMin(password);
    if (pwErr) {
      setPasswordError(pwErr);
      return;
    }
    if (password !== confirm) {
      setConfirmError("Re-enter the same password.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword({
        email: channel === "email" ? email : undefined,
        phone: channel === "phone" ? phone : undefined,
        otp,
        password,
      });
      toast.success("Password updated — sign in with your new password.");
      router.replace("/partner/signin");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Please check your connection and try again.";
      toast.error("Couldn't reset password", { description: msg });
      setSubmitting(false);
    }
  }

  return (
    <>
      <p className="mb-4 text-[14px] text-ink-soft">
        We sent a 6-digit code via {kind} to{" "}
        <span className="font-semibold text-ink">{target}</span>.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Verification code"
          placeholder="123456"
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          error={otpError}
        />
        <Input
          label="New password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
          rightAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md text-ink-mute hover:text-ink"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />
        <Input
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={confirmError}
        />
        <Button
          type="submit"
          block
          size="lg"
          loading={submitting}
          disabled={
            otp.length !== 6 ||
            password.length === 0 ||
            confirm.length === 0 ||
            submitting
          }
        >
          Set new password
        </Button>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-ink-soft">
        Didn&apos;t get the code?{" "}
        <Link
          href="/partner/forgot-password"
          className="font-semibold text-orange hover:text-orange-deep"
        >
          Resend it
        </Link>
      </p>
    </>
  );
}
