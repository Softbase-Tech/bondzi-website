"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { detectAuthMode, normalizeGhanaPhone } from "@/lib/auth-input";
import { getWebDeviceId, getWebDeviceName } from "@/lib/device";

/**
 * Partner sign-in form. Structurally identical to the student
 * LoginForm — same credentials provider, same email/phone-mode
 * detection, same device-header threading — but:
 *
 *   - Post-login destination defaults to `/partner/dashboard`
 *     (never `/dashboard`).
 *   - `returnTo` query param is same-host relative-path only. This
 *     page lives on partners.bondzi.online, so a cross-origin
 *     `returnTo` would be a security smell and is deliberately
 *     rejected — anything absolute or protocol-relative falls back
 *     to /partner/dashboard.
 *   - No "Create an account" link — partner registration requires an
 *     existing Bondzi account first.
 */

function sanitizeReturnTo(raw: string | null): string {
  const FALLBACK = "/partner/dashboard";
  if (!raw) return FALLBACK;
  // Same-host relative paths only. Everything else — absolute URLs
  // (even to trusted hosts), protocol-relative `//`, malformed —
  // falls back to /partner/dashboard.
  if (!raw.startsWith("/") || raw.startsWith("//")) return FALLBACK;
  return raw;
}

export function PartnerSigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const externalError = searchParams.get("error");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const mode = useMemo(() => detectAuthMode(identifier), [identifier]);

  const canSubmit =
    identifier.trim().length > 0 && password.trim().length > 0 && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setFieldError(null);
    setSubmitting(true);

    let email: string | undefined;
    let phone: string | undefined;
    if (mode === "phone") {
      const e164 = normalizeGhanaPhone(identifier);
      if (!e164) {
        setSubmitting(false);
        setFieldError("Use a Ghana number, e.g. 0205778299.");
        return;
      }
      phone = e164;
    } else {
      email = identifier.trim().toLowerCase();
    }

    const deviceId = getWebDeviceId() ?? "";
    const deviceName = getWebDeviceName();

    try {
      const res = await signIn("credentials", {
        email,
        phone,
        password,
        deviceId,
        deviceName,
        redirect: false,
      });
      if (res?.ok) {
        setPassword("");
        // Same-host destination — router.replace works fine (no
        // cross-origin worry here because the page is on the partner
        // host and returnTo is sanitized to same-host paths only).
        router.replace(returnTo);
      } else {
        toast.error("Sign in failed", {
          description:
            "Check your email/phone and password, then try again.",
        });
        setSubmitting(false);
      }
    } catch {
      toast.error("Couldn't sign in", {
        description: "Please check your connection and try again.",
      });
      setSubmitting(false);
    }
  }

  return (
    <>
      {externalError ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700"
        >
          Sign in failed. Please try again.
        </div>
      ) : null}
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
          enterKeyHint="next"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={fieldError}
        />
        <Input
          label="Password"
          placeholder="Your password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          enterKeyHint="go"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          rightAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md text-ink-mute hover:text-ink hover:bg-yellow-soft/60 transition-colors motion-reduce:transition-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />
        <div className="flex justify-end">
          <Link
            href="/partner/forgot-password"
            className="text-[13px] font-medium text-orange hover:text-orange-deep transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" block size="lg" loading={submitting} disabled={!canSubmit}>
          Sign in
        </Button>
      </form>
    </>
  );
}
