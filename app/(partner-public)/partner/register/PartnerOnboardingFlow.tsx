"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { register, requestEmailOtp } from "@/lib/api/auth";
import { registerAsPartner } from "@/lib/api/partner";
import type { MomoProvider } from "@/lib/api/types";
import { getWebDeviceId, getWebDeviceName } from "@/lib/device";
import {
  MIN_PASSWORD_LENGTH,
  validatePasswordMin,
} from "@/lib/password";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { trackEvent } from "@/lib/analytics";

/**
 * Partner onboarding flow. Two modes depending on `isSignedIn`:
 *
 *   Not signed in:
 *     Step 1  — Enter email → send 6-digit OTP.
 *     Step 2  — Verify OTP.
 *     Step 3  — Personal + password + MoMo + agreement in a single
 *              form (long but scannable).
 *     Submit — POST /auth/register (create Bondzi user) →
 *              signIn credentials (host-scoped cookie set on partner
 *              host) → POST /partner/register (create partner row) →
 *              /partner/dashboard.
 *
 *   Signed in:
 *     Skip straight to step 3, personal details prefilled from the
 *     account; submit only POSTs /partner/register.
 *
 * Everything happens on partners.bondzi.online. Zero cross-subdomain
 * redirects.
 */

const MOMO_OPTIONS: Array<{ value: MomoProvider; label: string }> = [
  { value: "mtn", label: "MTN MoMo" },
  { value: "airteltigo", label: "AirtelTigo Money" },
  { value: "telecel", label: "Telecel Cash" },
  { value: "other", label: "Other" },
];

type Step = "email" | "verify" | "details";

export function PartnerOnboardingFlow({
  isSignedIn,
  prefill,
  termsBody,
  termsVersion,
}: {
  isSignedIn: boolean;
  prefill: { email: string; fullName: string; phone: string };
  /**
   * Pre-rendered markdown body from the server (via MarkdownBody).
   * Client components can't safely run `marked` at render time —
   * pulling the parser into the client bundle blows up the JS
   * payload — so the server renders it once and we slot it in.
   */
  termsBody: React.ReactNode | null;
  termsVersion: number | null;
}) {
  const router = useRouter();

  // Skip to details if the caller is already signed in — they've
  // proven identity already.
  const [step, setStep] = useState<Step>(isSignedIn ? "details" : "email");
  const [pending, startTransition] = useTransition();

  // Step 1 / 2 state
  const [email, setEmail] = useState(prefill.email);
  const [emailOtp, setEmailOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  // Step 3 state
  const [fullName, setFullName] = useState(prefill.fullName);
  const [phone, setPhone] = useState(prefill.phone);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [momoProvider, setMomoProvider] = useState<MomoProvider>("mtn");
  const [momoNumber, setMomoNumber] = useState("");
  const [momoAccountName, setMomoAccountName] = useState(prefill.fullName);
  const [accepted, setAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // -- Step 1: send OTP -----------------------------------------------
  async function sendCode() {
    const value = email.trim().toLowerCase();
    if (!value.includes("@") || value.length < 5) {
      toast.error("Enter a valid email address.");
      return;
    }
    setSendingOtp(true);
    try {
      await requestEmailOtp({ email: value });
      setEmail(value);
      setStep("verify");
      toast.success("Code sent — check your inbox.");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Please check your connection and try again.";
      toast.error("Couldn't send code", { description: msg });
    } finally {
      setSendingOtp(false);
    }
  }

  function continueFromCode() {
    if (!/^\d{6}$/.test(emailOtp)) {
      toast.error("Enter the 6-digit code from the email.");
      return;
    }
    setStep("details");
  }

  // -- Step 3: submit final form --------------------------------------
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!accepted) {
      setFormError("Please read and accept the partner agreement.");
      return;
    }
    if (!isSignedIn) {
      if (!validatePasswordMin(password)) {
        setFormError(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        );
        return;
      }
    }
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !momoNumber.trim() ||
      !momoAccountName.trim()
    ) {
      setFormError("Please fill in every required field.");
      return;
    }

    startTransition(async () => {
      const deviceId = getWebDeviceId() ?? "";
      const deviceName = getWebDeviceName();

      try {
        // Unauthed → create the Bondzi user first, then auto-sign-in
        // on partners.bondzi.online (host-scoped cookie).
        if (!isSignedIn) {
          const username = suggestUsername(fullName, email);
          await register({
            fullName: fullName.trim(),
            username,
            email,
            emailOtp,
            password,
            // Partners typically won't study on Bondzi but the
            // backend requires a value here. WASSCE is the safest
            // default — matches the largest content pool.
            examType: "wassce",
            deviceId,
            deviceName,
          });
          const signInResult = await signIn("credentials", {
            email,
            password,
            deviceId,
            deviceName,
            redirect: false,
          });
          if (!signInResult?.ok) {
            throw new Error(
              "Account created but sign-in failed. Please sign in manually.",
            );
          }
        }

        // Now create the partner row. The `api` client picks up the
        // fresh NextAuth session automatically for authenticated
        // calls.
        await registerAsPartner({
          email: email.trim(),
          phone: phone.trim(),
          fullName: fullName.trim(),
          momoProvider,
          momoNumber: momoNumber.trim(),
          momoAccountName: momoAccountName.trim(),
        });

        // `hadAccount` splits the two onboarding paths: an existing
        // Bondzi student becoming a partner vs a cold signup. They
        // convert very differently and the copy is tuned per path.
        trackEvent("partner_signup_completed", { hadAccount: isSignedIn });
        toast.success("Partner account created — welcome!");
        router.replace("/partner/dashboard");
        router.refresh();
      } catch (err) {
        const message =
          err instanceof ApiError
            ? Array.isArray(err.body?.message)
              ? err.body?.message[0] ?? err.message
              : err.body?.message ?? err.message
            : err instanceof Error
              ? err.message
              : "Something went wrong.";
        setFormError(message);
      }
    });
  }

  // ==================================================================
  // Render
  // ==================================================================

  if (step === "email") {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-[16px] font-semibold text-ink">
            Step 1 · Your email
          </h2>
          <p className="text-[13px] text-ink-mute mt-1">
            We&apos;ll send you a 6-digit code to confirm the address.
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            type="button"
            block
            loading={sendingOtp}
            disabled={sendingOtp || email.trim().length < 5}
            onClick={sendCode}
          >
            Send code
          </Button>
          <p className="text-center text-[13px] text-ink-mute">
            Already have a Bondzi account?{" "}
            <Link
              href="/partner/signin?returnTo=%2Fpartner%2Fregister"
              className="font-medium text-orange hover:text-orange-deep"
            >
              Sign in first
            </Link>
          </p>
        </CardBody>
      </Card>
    );
  }

  if (step === "verify") {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-[16px] font-semibold text-ink">
            Step 2 · Enter the code
          </h2>
          <p className="text-[13px] text-ink-mute mt-1">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-ink">{email}</span>.
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={emailOtp}
            onChange={(e) =>
              setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
          />
          <Button
            type="button"
            block
            onClick={continueFromCode}
            disabled={emailOtp.length !== 6}
          >
            Continue
          </Button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="w-full text-center text-[13px] text-ink-mute hover:text-ink"
          >
            Change email
          </button>
        </CardBody>
      </Card>
    );
  }

  // step === "details"
  return (
    <form onSubmit={submit} className="space-y-6">
      {termsVersion !== null ? (
        <Card>
          <CardHeader>
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <h2 className="text-[16px] font-semibold text-ink">
                Partner agreement
              </h2>
              <span className="text-[12px] font-mono uppercase tracking-wider text-ink-mute">
                v{termsVersion}
              </span>
            </div>
          </CardHeader>
          {termsBody ? (
            <CardBody>
              <details className="rounded-lg border border-rule bg-yellow-soft/30 p-3 sm:p-4">
                <summary className="cursor-pointer text-[13px] font-medium text-ink-soft">
                  Read the full terms
                </summary>
                <div className="mt-4">{termsBody}</div>
              </details>
            </CardBody>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="text-[16px] font-semibold text-ink">
            {isSignedIn
              ? "Your details"
              : "Step 3 · Your details & payout"}
          </h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Full name (must match your MoMo account)"
            autoComplete="name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              // Sync MoMo name unless the user has edited it
              // independently.
              if (
                momoAccountName === prefill.fullName ||
                momoAccountName === ""
              ) {
                setMomoAccountName(e.target.value);
              }
            }}
          />
          <Input
            label="Phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {!isSignedIn ? (
            <Input
              label={`Password (${MIN_PASSWORD_LENGTH}+ characters)`}
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md text-ink-mute hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-[16px] font-semibold text-ink">
            Payout details (MoMo)
          </h2>
          <p className="text-[13px] text-ink-mute mt-1">
            Weekly payouts land here. The account name MUST match the
            MoMo number.
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="momo-provider"
                className="block text-[13px] font-medium text-ink-soft mb-1.5"
              >
                MoMo provider
              </label>
              <div className="rounded-xl border border-rule-strong bg-paper focus-within:border-orange focus-within:ring-2 focus-within:ring-orange/20">
                <select
                  id="momo-provider"
                  className="w-full appearance-none bg-transparent min-h-12 px-3.5 py-2.5 text-[16px] text-ink outline-none"
                  value={momoProvider}
                  onChange={(e) =>
                    setMomoProvider(e.target.value as MomoProvider)
                  }
                >
                  {MOMO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Input
              label="MoMo number"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="0244123456"
              value={momoNumber}
              onChange={(e) => setMomoNumber(e.target.value)}
            />
          </div>
          <Input
            label="MoMo account name"
            autoComplete="name"
            hint="Must match the name registered against the MoMo number above."
            value={momoAccountName}
            onChange={(e) => setMomoAccountName(e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-orange"
            />
            <span className="text-[14px] text-ink leading-relaxed">
              I&apos;ve read and accept the Bondzi partner agreement
              {termsVersion ? ` (version ${termsVersion})` : ""}.
            </span>
          </label>
          {formError ? (
            <p
              className="text-[13px] font-medium text-red-600"
              role="alert"
            >
              {formError}
            </p>
          ) : null}
          <Button type="submit" variant="primary" block loading={pending}>
            {isSignedIn ? "Become a partner" : "Create partner account"}
          </Button>
        </CardBody>
      </Card>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Deterministic-ish username derivation. Backend requires a username
 * on register; the partner path doesn't ask for one interactively —
 * we synthesise from the local-part of the email plus a short random
 * suffix so a collision on plain "kwame" doesn't dead-end onboarding.
 */
function suggestUsername(fullName: string, email: string): string {
  const localPart = email.split("@")[0] ?? "partner";
  const base = localPart
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);
  const seed =
    (fullName.length + email.length + Date.now()).toString(36).slice(-4);
  return `${base || "partner"}${seed}`;
}
