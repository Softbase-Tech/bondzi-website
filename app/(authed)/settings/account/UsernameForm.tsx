"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { checkUsernameAvailable } from "@/lib/api/auth";
import { updateUsername } from "@/lib/api/user";
import type { SafeUser } from "@/lib/api/types";

interface Props {
  profile: SafeUser;
}

const COOLDOWN_DAYS = 90;
const AVAILABILITY_DEBOUNCE_MS = 400;

/**
 * Username change form.
 *
 * Rules mirror backend:
 *   - 6..24 chars, [A-Za-z0-9] only
 *   - Case-insensitive uniqueness
 *   - First-time backfill (current username is null) is always free
 *   - Second-and-later changes: 90-day cooldown, checked server-side
 *
 * We surface the debounced availability check for UX polish; the
 * server is the authoritative gate.
 */
export function UsernameForm({ profile }: Props) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [value, setValue] = useState(profile.username ?? "");
  const [pending, startTransition] = useTransition();
  const [availability, setAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string | null;
  }>({ checking: false, available: null, message: null });
  const [error, setError] = useState<string | null>(null);
  const seqRef = useRef(0);

  const trimmed = value.trim();
  const unchangedIgnoringCase =
    (profile.username ?? "").toLowerCase() === trimmed.toLowerCase();
  const formatValid = /^[A-Za-z0-9]{6,24}$/.test(trimmed);

  const cooldownUntil = useMemo(() => {
    if (!profile.usernameChangedAt) return null;
    const changed = new Date(profile.usernameChangedAt);
    if (Number.isNaN(changed.getTime())) return null;
    const until = new Date(changed);
    until.setDate(until.getDate() + COOLDOWN_DAYS);
    return until;
  }, [profile.usernameChangedAt]);

  const cooldownActive =
    cooldownUntil !== null && cooldownUntil.getTime() > Date.now();

  useEffect(() => {
    // Skip availability check when the value is unchanged or invalid.
    if (unchangedIgnoringCase || !formatValid) {
      setAvailability({ checking: false, available: null, message: null });
      return;
    }
    const seq = ++seqRef.current;
    setAvailability({ checking: true, available: null, message: null });
    const handle = window.setTimeout(async () => {
      try {
        const res = await checkUsernameAvailable(trimmed);
        if (seqRef.current !== seq) return;
        setAvailability({
          checking: false,
          available: res.available,
          message: res.message ?? null,
        });
      } catch {
        if (seqRef.current !== seq) return;
        // Availability check is a UX nicety — treat failures as
        // "unknown" so the user can still submit and see the real
        // server response.
        setAvailability({ checking: false, available: null, message: null });
      }
    }, AVAILABILITY_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [trimmed, formatValid, unchangedIgnoringCase]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!formatValid) {
      setError("6–24 letters and numbers, no spaces or symbols.");
      return;
    }
    if (unchangedIgnoringCase && (profile.username ?? "") === trimmed) {
      setError("That's already your username.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await updateUsername(trimmed);
        await updateSession({
          profile: {
            ...profile,
            username: res.username,
            usernameChangedAt: res.usernameChangedAt,
          },
        });
        toast.success("Username updated");
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Couldn't update username.",
        );
      }
    });
  };

  const canSubmit =
    formatValid &&
    !unchangedIgnoringCase &&
    (availability.available ?? true) && // treat "unknown" as OK — server rejects if taken
    !cooldownActive;

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        label="Username"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={24}
        placeholder="e.g. kwameA9"
        hint={
          availability.checking ? (
            <span className="inline-flex items-center gap-1 text-ink-mute">
              <Loader2 size={11} className="animate-spin" />
              Checking availability…
            </span>
          ) : availability.available === false ? (
            <span className="text-red-600">
              {availability.message ?? "Not available."}
            </span>
          ) : availability.available === true ? (
            <span className="inline-flex items-center gap-1 text-orange">
              <Check size={11} />
              Available
            </span>
          ) : (
            "6–24 letters and numbers. Case doesn't matter for uniqueness."
          )
        }
      />
      {cooldownActive && cooldownUntil ? (
        <p className="text-[12.5px] text-ink-mute">
          You changed your username recently. Next change available{" "}
          {cooldownUntil.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          .
        </p>
      ) : null}
      {error ? (
        <p className="text-[13px] font-medium text-red-600">{error}</p>
      ) : null}
      <Button type="submit" loading={pending} disabled={!canSubmit}>
        {profile.username ? "Save username" : "Set username"}
      </Button>
    </form>
  );
}
