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
 * Sign-in form. Accepts either email or phone in a single field — the
 * component detects the mode live and switches keyboard type + autocomplete
 * hints. Same UX as the mobile app.
 *
 * Post-login routing:
 *   - `?returnTo=/foo` from proxy.ts → send them there
 *   - Otherwise → /dashboard (Phase 1 stub, real content in Phase 2)
 *
 * Errors:
 *   - Bad credentials / rate-limits / non-student role → generic
 *     "Sign in failed" toast (NextAuth swallows the specific reason
 *     to prevent enumeration).
 *   - NextAuth session `error === "DeviceKicked"` on the destination
 *     page is handled elsewhere; here we just show the toast.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";
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

    // Route the typed identifier into the correct credentials field.
    // The backend accepts either email or phone and resolves on
    // whichever is non-empty.
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

    // Device id has to be threaded through the credentials submit —
    // NextAuth's authorize() runs on the server (no `document`), so
    // we can't read the cookie in there. Backend rejects logins
    // without one to enforce the single-active-session rule.
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
        // Success — clear form state so a "back" tap doesn't leak the
        // last-typed password into a re-mount.
        setPassword("");
        // Prefer router.replace to avoid a bounceable /login entry
        // in history.
        router.replace(returnTo);
      } else {
        // NextAuth returns `error: "CredentialsSignin"` on any failure
        // from our authorize() (bad password, unknown user, non-
        // student role). Show a single friendly message.
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
            href="/forgot-password"
            className="text-[13px] font-medium text-orange hover:text-orange-deep transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" block size="lg" loading={submitting} disabled={!canSubmit}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-ink-soft">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-orange hover:text-orange-deep transition-colors"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
