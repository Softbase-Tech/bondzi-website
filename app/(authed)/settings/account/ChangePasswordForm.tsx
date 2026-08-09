"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { changePassword } from "@/lib/api/auth";
import {
  MIN_PASSWORD_LENGTH,
  passwordStrength,
  validatePasswordMin,
} from "@/lib/password";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const STRENGTH_LABELS = ["Too weak", "Getting there", "Good", "Strong"];
const STRENGTH_COLORS = ["bg-red-400", "bg-orange", "bg-orange", "bg-green-500"];

/**
 * Change-password form. Backend requires the CURRENT password (401
 * on mismatch) and enforces new-password ≥8 chars with at least one
 * letter + one digit. UI keeps the client checks in step so bad
 * submits don't cost a round-trip.
 */
export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = passwordStrength(newPw);
  const newPwError = newPw.length > 0 ? validatePasswordMin(newPw) : null;
  const meetsPolicy =
    newPw.length >= MIN_PASSWORD_LENGTH &&
    /[A-Za-z]/.test(newPw) &&
    /\d/.test(newPw);
  const confirmsMatch = confirmPw === newPw && newPw.length > 0;

  const canSubmit =
    currentPw.length > 0 && meetsPolicy && confirmsMatch && !pending;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!meetsPolicy) {
      setError("New password must include a letter and a digit.");
      return;
    }
    if (!confirmsMatch) {
      setError("Passwords don't match.");
      return;
    }
    if (currentPw === newPw) {
      setError("New password must differ from the current one.");
      return;
    }
    startTransition(async () => {
      try {
        await changePassword({
          currentPassword: currentPw,
          newPassword: newPw,
        });
        toast.success("Password updated");
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setError(err.message ?? "Current password is incorrect.");
          return;
        }
        setError(
          err instanceof Error ? err.message : "Couldn't change password.",
        );
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Current password"
        type={showCurrent ? "text" : "password"}
        value={currentPw}
        onChange={(e) => setCurrentPw(e.target.value)}
        autoComplete="current-password"
        rightAdornment={
          <button
            type="button"
            onClick={() => setShowCurrent((s) => !s)}
            aria-label={showCurrent ? "Hide password" : "Show password"}
            className="text-ink-mute hover:text-ink transition-colors motion-reduce:transition-none"
          >
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />
      <div>
        <Input
          label="New password"
          type={showNew ? "text" : "password"}
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          autoComplete="new-password"
          error={newPwError ?? undefined}
          rightAdornment={
            <button
              type="button"
              onClick={() => setShowNew((s) => !s)}
              aria-label={showNew ? "Hide password" : "Show password"}
              className="text-ink-mute hover:text-ink transition-colors motion-reduce:transition-none"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        {newPw.length > 0 ? (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-rule/60 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all motion-reduce:transition-none",
                  STRENGTH_COLORS[strength],
                )}
                style={{ width: `${((strength + 1) / 4) * 100}%` }}
              />
            </div>
            <div className="text-[11.5px] text-ink-soft w-24 text-right">
              {STRENGTH_LABELS[strength]}
            </div>
          </div>
        ) : (
          <p className="mt-1.5 text-[12px] text-ink-mute">
            At least {MIN_PASSWORD_LENGTH} chars, with a letter and a digit.
          </p>
        )}
      </div>
      <Input
        label="Confirm new password"
        type={showNew ? "text" : "password"}
        value={confirmPw}
        onChange={(e) => setConfirmPw(e.target.value)}
        autoComplete="new-password"
        error={
          confirmPw.length > 0 && !confirmsMatch ? "Doesn't match." : undefined
        }
      />
      {error ? (
        <p className="text-[13px] font-medium text-red-600">{error}</p>
      ) : null}
      <Button
        type="submit"
        loading={pending}
        disabled={!canSubmit}
        leftIcon={<KeyRound size={16} />}
      >
        Change password
      </Button>
    </form>
  );
}
