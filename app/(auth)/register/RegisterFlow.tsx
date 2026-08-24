"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogActions } from "@/components/ui/Dialog";
import { register, requestEmailOtp } from "@/lib/api/auth";
import { getWebDeviceId, getWebDeviceName } from "@/lib/device";
import { ApiError } from "@/lib/api/client";
import {
  MIN_PASSWORD_LENGTH,
  passwordStrength,
  validatePasswordMin,
} from "@/lib/password";
import { trackEvent } from "@/lib/analytics";
import type { ExamType, Gender } from "@/lib/api/types";

/**
 * Three-step account creation, mirroring the mobile flow:
 *   1. Email  — user types their address, we send them a 6-digit OTP
 *   2. Verify — user types the code (also stashed so the register
 *               call includes it as `emailOtp` — the backend
 *               atomically verifies + creates the account)
 *   3. Profile — full name, username, password, exam type, form level,
 *                DOB, gender, optional referral
 *
 * On success we call signIn("credentials", …) with the just-set
 * credentials so the user lands on /dashboard with a live session —
 * no "please sign in with your new account" round-trip.
 */

type Step = "email" | "verify" | "profile";

const EXAM_OPTIONS: readonly {
  key: ExamType;
  title: string;
  blurb: string;
}[] = [
  { key: "bece", title: "BECE", blurb: "Junior High School (JHS 1–3)" },
  { key: "wassce", title: "WASSCE", blurb: "Senior High School (SHS 1–3)" },
  {
    key: "novdec",
    title: "NOVDEC",
    blurb: "Remedial — same syllabus as WASSCE",
  },
];

const GENDER_OPTIONS: { key: Gender; label: string }[] = [
  { key: "female", label: "Female" },
  { key: "male", label: "Male" },
  { key: "other", label: "Other" },
  { key: "prefer_not_to_say", label: "Prefer not to say" },
];

export function RegisterFlow() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");

  // Step 1 state
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  // Step 3 state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [formLevel, setFormLevel] = useState<1 | 2 | 3 | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailTakenOpen, setEmailTakenOpen] = useState(false);

  const needsFormLevel = examType !== null && examType !== "novdec";

  const dateOfBirthIso: string | null = (() => {
    const d = parseInt(dobDay, 10);
    const m = parseInt(dobMonth, 10);
    const y = parseInt(dobYear, 10);
    if (!d || !m || !y) return null;
    if (y < 1900 || y > new Date().getFullYear()) return null;
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;
    const iso = `${y.toString().padStart(4, "0")}-${m
      .toString()
      .padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
    const ts = Date.parse(`${iso}T00:00:00Z`);
    if (Number.isNaN(ts)) return null;
    const ageMs = Date.now() - ts;
    if (ageMs < 8 * 365.25 * 24 * 60 * 60 * 1000) return null;
    if (ageMs > 100 * 365.25 * 24 * 60 * 60 * 1000) return null;
    return iso;
  })();

  const strength = passwordStrength(password);
  const strengthColor = ["bg-red-400", "bg-red-400", "bg-yellow", "bg-orange"][
    strength
  ];

  const readyToSubmit =
    examType !== null &&
    (!needsFormLevel || formLevel !== null) &&
    fullName.trim().length >= 2 &&
    username.trim().length >= 4 &&
    password.length >= MIN_PASSWORD_LENGTH &&
    gender !== null &&
    dateOfBirthIso !== null;

  // -- Step 1 handler ---------------------------------------------------------
  async function sendCode() {
    const value = email.trim().toLowerCase();
    if (!value.includes("@") || value.length < 5) {
      toast.error("Invalid email", {
        description: "Enter a valid email address.",
      });
      return;
    }
    setSendingOtp(true);
    try {
      await requestEmailOtp({ email: value });
      trackEvent("auth_signup_otp_sent");
      setEmail(value);
      setStep("verify");
      toast.success("Code sent", {
        description: "Check your inbox for the 6-digit code.",
      });
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

  // -- Step 2 handler ---------------------------------------------------------
  function continueFromCode() {
    if (!/^\d{6}$/.test(emailOtp)) {
      toast.error("Invalid code", {
        description: "Enter the 6-digit code from the email.",
      });
      return;
    }
    // Client-side format check only — the code isn't validated against
    // the server until `register()` consumes it as `emailOtp`. This
    // measures "reached the profile step", which is where the real
    // drop-off is (it's the longest form in the flow).
    trackEvent("auth_signup_otp_verified");
    setStep("profile");
  }

  // -- Step 3 handler ---------------------------------------------------------
  async function submitProfile() {
    if (!readyToSubmit || submitting) return;
    setSubmitting(true);
    // Backend requires `deviceId` on register + login (single-active-
    // session gate). LoginForm has the same thread — see the note in
    // lib/api/auth.ts login().
    const deviceId = getWebDeviceId() ?? "";
    const deviceName = getWebDeviceName();

    try {
      await register({
        fullName: fullName.trim(),
        username: username.trim(),
        email,
        emailOtp,
        password,
        examType: examType as ExamType,
        gender: gender as Gender,
        dateOfBirth: dateOfBirthIso as string,
        deviceId,
        deviceName,
        ...(needsFormLevel && formLevel !== null ? { formLevel } : {}),
        ...(referralCode.trim() ? { referralCode: referralCode.trim() } : {}),
      });
      trackEvent("auth_signup_completed", {
        level: examType as ExamType,
        // Boolean, never the code itself — a referral code identifies
        // the referrer and has no place in an analytics property.
        withReferral: referralCode.trim().length > 0,
      });
      // Auto-sign-in with the credentials we just set. The register
      // endpoint returns tokens too but NextAuth needs its own
      // Credentials handshake to establish the session cookie — we
      // burn one extra login round-trip for the cleaner state model.
      const signInResult = await signIn("credentials", {
        email,
        password,
        deviceId,
        deviceName,
        redirect: false,
      });
      if (signInResult?.ok) {
        router.replace("/onboarding");
      } else {
        // Extreme edge — account was created but the immediate
        // signIn failed. Fall back to the login screen.
        toast.success("Account created", {
          description: "Please sign in to continue.",
        });
        router.replace("/login");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        trackEvent("auth_signup_failed", { reason: "email_taken" });
        setEmailTakenOpen(true);
      } else {
        trackEvent("auth_signup_failed", { reason: "error" });
        const msg =
          err instanceof ApiError
            ? err.message
            : "Please check your connection and try again.";
        toast.error("Sign up failed", { description: msg });
      }
      setSubmitting(false);
    }
  }

  return (
    <>
      {step === "email" ? (
        <EmailStep
          email={email}
          onChange={setEmail}
          onSubmit={sendCode}
          loading={sendingOtp}
        />
      ) : null}

      {step === "verify" ? (
        <VerifyStep
          email={email}
          code={emailOtp}
          onChange={setEmailOtp}
          onSubmit={continueFromCode}
          onResend={sendCode}
          resending={sendingOtp}
          onBack={() => setStep("email")}
        />
      ) : null}

      {step === "profile" ? (
        <>
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setStep("verify")}
              className="text-[13px] font-medium text-ink-mute hover:text-ink transition-colors"
            >
              ← Back
            </button>
            <h1 className="mt-2 font-display text-[28px] leading-tight text-ink">
              A few more details
            </h1>
            <p className="mt-1 text-[15px] text-ink-soft">
              We&apos;ll use these to tailor your revision.
            </p>
          </div>
          <div className="space-y-5">
            <div>
              <div className="text-[13px] font-medium text-ink-soft mb-2">
                Which exam are you preparing for?
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {EXAM_OPTIONS.slice(0, 2).map((opt) => (
                  <ExamTile
                    key={opt.key}
                    option={opt}
                    selected={examType === opt.key}
                    onClick={() => {
                      setExamType(opt.key);
                      setFormLevel(opt.key === "bece" ? 3 : 2);
                    }}
                  />
                ))}
              </div>
              <div className="mt-2.5">
                <ExamTile
                  option={EXAM_OPTIONS[2]}
                  selected={examType === "novdec"}
                  onClick={() => {
                    setExamType("novdec");
                    setFormLevel(null);
                  }}
                />
              </div>
            </div>

            {needsFormLevel ? (
              <div>
                <div className="text-[13px] font-medium text-ink-soft mb-2">
                  {examType === "bece" ? "JHS Form" : "SHS Form"}
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <Chip
                      key={n}
                      label={`Form ${n}`}
                      selected={formLevel === n}
                      onClick={() => setFormLevel(n as 1 | 2 | 3)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {examType && (!needsFormLevel || formLevel) ? (
              <>
                <Input
                  label="Full name"
                  placeholder="Kwame Nkrumah"
                  autoComplete="name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <Input
                  label="Username"
                  placeholder="kwame_n"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="next"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  hint="You can change your username once every 90 days."
                />
                <div>
                  <Input
                    label="Password"
                    placeholder="At least 8 characters"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    enterKeyHint="next"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    rightAdornment={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="inline-flex items-center justify-center w-9 h-9 rounded-md text-ink-mute hover:text-ink hover:bg-yellow-soft/60 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                  />
                  <div className="mt-2 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1.5 rounded-full ${
                          i < strength ? strengthColor : "bg-rule"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[13px] font-medium text-ink-soft mb-2">
                    Date of birth
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="DD"
                      inputMode="numeric"
                      autoComplete="bday-day"
                      maxLength={2}
                      value={dobDay}
                      onChange={(e) =>
                        setDobDay(e.target.value.replace(/\D/g, "").slice(0, 2))
                      }
                    />
                    <Input
                      placeholder="MM"
                      inputMode="numeric"
                      autoComplete="bday-month"
                      maxLength={2}
                      value={dobMonth}
                      onChange={(e) =>
                        setDobMonth(
                          e.target.value.replace(/\D/g, "").slice(0, 2),
                        )
                      }
                    />
                    <Input
                      placeholder="YYYY"
                      inputMode="numeric"
                      autoComplete="bday-year"
                      maxLength={4}
                      value={dobYear}
                      onChange={(e) =>
                        setDobYear(
                          e.target.value.replace(/\D/g, "").slice(0, 4),
                        )
                      }
                    />
                  </div>
                  {(dobDay || dobMonth || dobYear) && !dateOfBirthIso ? (
                    <p className="mt-1.5 text-[12.5px] font-medium text-red-600">
                      Enter a valid date — students must be at least 8.
                    </p>
                  ) : null}
                </div>

                <div>
                  <div className="text-[13px] font-medium text-ink-soft mb-2">
                    Gender
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {GENDER_OPTIONS.map((g) => (
                      <Chip
                        key={g.key}
                        label={g.label}
                        selected={gender === g.key}
                        onClick={() => setGender(g.key)}
                      />
                    ))}
                  </div>
                </div>

                <Input
                  label="Referral code (optional)"
                  placeholder="e.g. A1B2CJO"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="go"
                  value={referralCode}
                  onChange={(e) =>
                    // Strip legacy formatting on the way in so a
                    // student pasting a pre-migration `PM-XXXX-YYY`
                    // still resolves against the new stored codes.
                    setReferralCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/^PM-/, "")
                        .replace(/-/g, ""),
                    )
                  }
                />

                <Button
                  block
                  size="lg"
                  onClick={submitProfile}
                  loading={submitting}
                  disabled={!readyToSubmit || submitting}
                >
                  Create my account
                </Button>
                <p className="text-[12px] text-ink-mute text-center">
                  By continuing you agree to our{" "}
                  <span className="font-semibold text-orange">Terms</span>.
                </p>
              </>
            ) : null}
          </div>
        </>
      ) : null}

      <p className="mt-6 text-center text-[13.5px] text-ink-soft">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-orange hover:text-orange-deep transition-colors"
        >
          Sign in
        </Link>
      </p>

      <Dialog
        open={emailTakenOpen}
        onOpenChange={setEmailTakenOpen}
        title="This email is already registered"
        description={`An account with ${email} already exists. Sign in with your password, or use "Forgot password" if you can't remember it.`}
      >
        <DialogActions>
          <Button
            variant="outline"
            onClick={() => {
              setEmailTakenOpen(false);
              setStep("email");
              setEmail("");
              setEmailOtp("");
            }}
          >
            Use a different email
          </Button>
          <Button
            onClick={() => {
              setEmailTakenOpen(false);
              router.replace("/login");
            }}
          >
            Go to sign in
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ---------- sub-components -------------------------------------------------

function EmailStep({
  email,
  onChange,
  onSubmit,
  loading,
}: {
  email: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-[32px] leading-tight text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          We&apos;ll send a 6-digit code to verify your email.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <Input
          label="Email"
          placeholder="you@example.com"
          type="email"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="email"
          autoComplete="email"
          enterKeyHint="send"
          value={email}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          type="submit"
          block
          size="lg"
          loading={loading}
          disabled={email.trim().length === 0 || loading}
        >
          Send verification code
        </Button>
      </form>
    </>
  );
}

function VerifyStep({
  email,
  code,
  onChange,
  onSubmit,
  onResend,
  resending,
  onBack,
}: {
  email: string;
  code: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  resending: boolean;
  onBack: () => void;
}) {
  return (
    <>
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="text-[13px] font-medium text-ink-mute hover:text-ink transition-colors"
        >
          ← Back
        </button>
        <h1 className="mt-2 font-display text-[28px] leading-tight text-ink">
          Enter the code
        </h1>
        <p className="mt-1 text-[15px] text-ink-soft">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-ink">{email}</span>.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <Input
          label="Verification code"
          placeholder="123456"
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          enterKeyHint="go"
          maxLength={6}
          value={code}
          onChange={(e) =>
            onChange(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
        />
        <Button
          type="submit"
          block
          size="lg"
          disabled={code.length !== 6}
        >
          Continue
        </Button>
      </form>
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={resending ? undefined : onResend}
          disabled={resending}
          className="text-[13px] font-semibold text-orange hover:text-orange-deep transition-colors disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
      </div>
    </>
  );
}

function ExamTile({
  option,
  selected,
  onClick,
}: {
  option: { key: ExamType; title: string; blurb: string };
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-colors ${
        selected
          ? "border-orange bg-yellow-soft/50"
          : "border-rule-strong bg-paper hover:border-ink-soft"
      }`}
    >
      <div
        className={`font-display text-[22px] leading-tight ${
          selected ? "text-orange" : "text-ink"
        }`}
      >
        {option.title}
      </div>
      <div className="mt-0.5 text-[12.5px] text-ink-soft">{option.blurb}</div>
    </button>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center min-h-9 px-3.5 rounded-full text-[13.5px] font-medium border transition-colors ${
        selected
          ? "border-orange bg-orange text-paper"
          : "border-rule-strong bg-paper text-ink hover:border-ink-soft"
      }`}
    >
      {label}
    </button>
  );
}
