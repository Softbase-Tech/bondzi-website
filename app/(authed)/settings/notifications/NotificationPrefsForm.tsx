"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import {
  updateEmailPreferences,
  updatePushPreferences,
  type EmailPreferences,
  type PushPreferences,
} from "@/lib/api/user";
import type { SafeUser } from "@/lib/api/types";
import { usePushNotifications } from "@/lib/push/usePushNotifications";
import { cn } from "@/lib/utils";

interface Props {
  profile: SafeUser;
}

/**
 * Notification prefs. Two independent groups (email + push) driven by
 * SafeUser fields; every row is an optimistic PATCH that reconciles
 * against the backend snapshot on response, so a parallel change on
 * another device doesn't stale out this UI.
 */
export function NotificationPrefsForm({ profile }: Props) {
  const { update: updateSession } = useSession();

  const [email, setEmail] = useState<EmailPreferences>({
    weeklyDigest: profile.emailWeeklyDigestEnabled,
    streakNudges: profile.emailStreakNudgesEnabled,
    levelUp: profile.emailLevelUpEnabled,
    marketing: profile.emailMarketingEnabled,
  });
  const [push, setPush] = useState<PushPreferences>({
    reminders: profile.pushRemindersEnabled,
    streakNudges: profile.pushStreakNudgesEnabled,
  });
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const flipEmail = async <K extends keyof EmailPreferences>(
    key: K,
    next: boolean,
  ) => {
    const previous = email;
    const optimistic = { ...email, [key]: next };
    setEmail(optimistic);
    setBusy((b) => new Set(b).add(`email.${String(key)}`));
    try {
      const snap = await updateEmailPreferences({ [key]: next });
      setEmail(snap);
      // Mirror into the NextAuth session so a fresh page still
      // reflects the change.
      await updateSession({
        profile: {
          ...profile,
          emailWeeklyDigestEnabled: snap.weeklyDigest,
          emailStreakNudgesEnabled: snap.streakNudges,
          emailLevelUpEnabled: snap.levelUp,
          emailMarketingEnabled: snap.marketing,
        },
      });
    } catch (err) {
      setEmail(previous);
      toast.error(
        err instanceof Error
          ? err.message
          : "Couldn't update email preferences.",
      );
    } finally {
      setBusy((b) => {
        const n = new Set(b);
        n.delete(`email.${String(key)}`);
        return n;
      });
    }
  };

  const flipPush = async <K extends keyof PushPreferences>(
    key: K,
    next: boolean,
  ) => {
    const previous = push;
    const optimistic = { ...push, [key]: next };
    setPush(optimistic);
    setBusy((b) => new Set(b).add(`push.${String(key)}`));
    try {
      const snap = await updatePushPreferences({ [key]: next });
      setPush(snap);
      await updateSession({
        profile: {
          ...profile,
          pushRemindersEnabled: snap.reminders,
          pushStreakNudgesEnabled: snap.streakNudges,
        },
      });
    } catch (err) {
      setPush(previous);
      toast.error(
        err instanceof Error
          ? err.message
          : "Couldn't update push preferences.",
      );
    } finally {
      setBusy((b) => {
        const n = new Set(b);
        n.delete(`push.${String(key)}`);
        return n;
      });
    }
  };

  return (
    <div className="space-y-6">
      {profile.email ? (
        <Card className="p-4 sm:p-5">
          <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute mb-3">
            Email
          </div>
          <div className="divide-y divide-rule">
            <ToggleRow
              title="Weekly progress digest"
              body="A Monday-morning recap of your XP, streak, and accuracy."
              checked={email.weeklyDigest}
              disabled={busy.has("email.weeklyDigest")}
              onChange={(v) => flipEmail("weeklyDigest", v)}
            />
            <ToggleRow
              title="Streak-at-risk nudges"
              body="A gentle nudge on days you haven't studied by evening."
              checked={email.streakNudges}
              disabled={busy.has("email.streakNudges")}
              onChange={(v) => flipEmail("streakNudges", v)}
            />
            <ToggleRow
              title="Level-up celebrations"
              body="When you cross a new XP level."
              checked={email.levelUp}
              disabled={busy.has("email.levelUp")}
              onChange={(v) => flipEmail("levelUp", v)}
            />
            <ToggleRow
              title="Product announcements"
              body="New subjects, features, and offers from Bondzi."
              checked={email.marketing}
              disabled={busy.has("email.marketing")}
              onChange={(v) => flipEmail("marketing", v)}
            />
          </div>
        </Card>
      ) : (
        <Card className="p-4 sm:p-5 text-[13px] text-ink-soft">
          Add an email to your account to control email preferences.
        </Card>
      )}

      <Card className="p-4 sm:p-5">
        <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute mb-3">
          Push
        </div>
        <div className="divide-y divide-rule">
          <ToggleRow
            title="Daily reminders"
            body="A 10am ping suggesting today's study slot."
            checked={push.reminders}
            disabled={busy.has("push.reminders")}
            onChange={(v) => flipPush("reminders", v)}
          />
          <ToggleRow
            title="Streak nudges"
            body="Evening reminder when your streak is at risk."
            checked={push.streakNudges}
            disabled={busy.has("push.streakNudges")}
            onChange={(v) => flipPush("streakNudges", v)}
          />
        </div>
        <p className="mt-3 text-[12px] text-ink-mute">
          These choose WHICH pushes you get — delivery to this browser is
          controlled below.
        </p>
      </Card>

      <BrowserPushCard />

      <p className="text-[12px] text-ink-mute">
        Account-critical mail (receipts, password resets, security
        notices) cannot be disabled.
      </p>
    </div>
  );
}

/**
 * Per-device delivery switch for browser push (FCM Web Push). Distinct
 * from the topic toggles above: those are account-level backend prefs,
 * this one registers/unregisters THIS browser as a push target. The
 * browser's own permission prompt fires only from the explicit toggle
 * gesture — never on page load.
 */
function BrowserPushCard() {
  const { ready, supported, permission, enabled, busy, enable, disable } =
    usePushNotifications();

  // Detection runs client-side; render nothing until it has (avoids a
  // hydration flash of the wrong state).
  if (!ready) return null;

  const flip = async (next: boolean) => {
    if (!next) {
      await disable();
      toast("Push turned off for this browser");
      return;
    }
    const result = await enable();
    if (result === "enabled") {
      toast.success("Push notifications enabled", {
        description: "This browser will now receive Bondzi notifications.",
      });
    } else if (result === "denied") {
      toast.error("Notifications are blocked", {
        description:
          "Allow notifications for Bondzi in your browser settings, then try again.",
      });
    } else if (result === "error") {
      toast.error("Couldn't enable push notifications", {
        description: "Please try again in a moment.",
      });
    }
    // "dismissed" — the user closed the browser prompt; stay quiet.
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute mb-3">
        This browser
      </div>
      {!supported ? (
        <p className="text-[13px] text-ink-soft">
          Push notifications aren&apos;t available in this browser. On
          iPhone, add Bondzi to your Home Screen from the share menu
          first, then enable them here.
        </p>
      ) : (
        <>
          <ToggleRow
            title="Notifications on this device"
            body="Let this browser show Bondzi notifications, even when the tab is closed."
            checked={enabled}
            disabled={busy || permission === "denied"}
            onChange={flip}
          />
          {permission === "denied" ? (
            <p className="mt-2 text-[12px] text-red-600">
              Blocked in your browser settings. Allow notifications for
              this site (usually via the lock icon in the address bar),
              then reload and flip the toggle.
            </p>
          ) : null}
        </>
      )}
    </Card>
  );
}

function ToggleRow({
  title,
  body,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  body: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 py-3 cursor-pointer",
        disabled ? "opacity-70 cursor-not-allowed" : "",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="font-display text-[15.5px] text-ink leading-tight">
          {title}
        </div>
        <p className="mt-0.5 text-[12.5px] text-ink-soft">{body}</p>
      </div>
      <Toggle
        checked={checked}
        disabled={disabled}
        onChange={(v) => onChange(v)}
      />
    </label>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "shrink-0 relative inline-flex items-center h-6 w-11 rounded-full transition-colors motion-reduce:transition-none",
        checked ? "bg-orange" : "bg-rule-strong",
        disabled ? "opacity-70 cursor-not-allowed" : "",
      )}
    >
      <span
        className={cn(
          "inline-block w-5 h-5 rounded-full bg-paper shadow transform transition-transform motion-reduce:transition-none",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
