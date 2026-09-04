"use client";

import { useState, useSyncExternalStore } from "react";
import { BellRing, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { usePushNotifications } from "@/lib/push/usePushNotifications";
import { PROMPT_DISMISSED_KEY } from "@/lib/push/firebase";

/** Don't re-show the card for 14 days after a dismissal. */
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

function isSnoozed(): boolean {
  try {
    const raw = localStorage.getItem(PROMPT_DISMISSED_KEY);
    if (!raw) return false;
    const at = Number.parseInt(raw, 10);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < SNOOZE_MS;
  } catch {
    // Storage unavailable — err on the quiet side and don't nag.
    return true;
  }
}

function snooze(): void {
  try {
    localStorage.setItem(PROMPT_DISMISSED_KEY, String(Date.now()));
  } catch {
    // Best-effort.
  }
}

/** localStorage has no change events we care about — re-read per render. */
const subscribeNoop = () => () => {};
/** During SSR assume snoozed so the card never flashes in and out. */
const snoozedOnServer = () => true;

/**
 * Small dismissible "Get study reminders" card. Surfaced ONLY after a
 * meaningful moment (the exam-result page — the student just finished a
 * session), never on cold page load, and the browser permission prompt
 * fires only from the explicit "Turn on" click.
 *
 * Hidden when: browser unsupported / Firebase unconfigured, permission
 * already granted+enabled, permission denied (nothing we can do), or
 * dismissed within the last 14 days.
 */
export function PushPromptCard() {
  const { ready, supported, permission, enabled, busy, enable } =
    usePushNotifications();
  const snoozed = useSyncExternalStore(subscribeNoop, isSnoozed, snoozedOnServer);
  // Snoozing writes localStorage, which emits no event — mirror the
  // dismissal in state so the card hides immediately on click.
  const [hidden, setHidden] = useState(false);

  if (
    !ready ||
    !supported ||
    enabled ||
    permission !== "default" ||
    snoozed ||
    hidden
  ) {
    return null;
  }

  const handleEnable = async () => {
    const result = await enable();
    if (result === "enabled") {
      toast.success("Study reminders are on", {
        description: "We'll nudge you when your streak's at risk.",
      });
    } else if (result === "denied") {
      snooze();
      setHidden(true);
      toast.error("Notifications are blocked", {
        description:
          "Allow notifications for Bondzi in your browser settings to turn them on.",
      });
    } else if (result === "error") {
      toast.error("Couldn't turn on reminders", {
        description: "Please try again in a moment.",
      });
    }
    // "dismissed" (browser prompt closed without choosing) — stay quiet.
  };

  const handleDismiss = () => {
    snooze();
    setHidden(true);
  };

  return (
    <Card emphasis className="relative p-4 sm:p-5">
      <button
        type="button"
        aria-label="Dismiss study-reminders prompt"
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-ink-mute hover:text-ink hover:bg-yellow-soft/60 transition-colors motion-reduce:transition-none"
      >
        <X size={15} />
      </button>
      <div className="flex items-start gap-3.5 pr-8">
        <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-soft text-orange-deep">
          <BellRing size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[17px] leading-tight text-ink">
            Get study reminders
          </div>
          <p className="mt-1 text-[13px] text-ink-soft max-w-[52ch]">
            A nudge when your streak&apos;s at risk and when reviews are
            due — right in this browser. No spam, and you can turn it off
            anytime in settings.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" loading={busy} onClick={handleEnable}>
              Turn on
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
