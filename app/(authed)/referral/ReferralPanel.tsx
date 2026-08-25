"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle, Share2, Users } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  REFERRAL_REWARDS,
  buildReferralMessage,
  normalizeReferralCode,
} from "@/lib/api/referrals";
import type { ReferralEvent, ReferralStats } from "@/lib/api/types";
import { trackEvent } from "@/lib/analytics";

interface Props {
  stats: ReferralStats;
  events: ReferralEvent[];
}

/**
 * The share + history surface. Structure mirrors mobile:
 *
 *   1. Code + Copy + WhatsApp + Share buttons
 *   2. Message preview so the student sees exactly what will be sent
 *   3. Stat chips
 *   4. How-it-works (2 steps + XP rates)
 *   5. History list
 *
 * WhatsApp deep link uses the universal `wa.me` URL — opens WhatsApp
 * app on mobile, WhatsApp Web on desktop. Native share falls back to
 * clipboard when neither is available.
 */
export function ReferralPanel({ stats, events }: Props) {
  // Normalise the code on read. The backend migration strips
  // `PM-` + dashes on rollout, but until it lands in prod some
  // users' stored codes are still `PM-XXXX-YYY`. Doing it here
  // means the display, the clipboard copy, the WhatsApp deep-link
  // message, and the aria-label all match.
  const displayCode = normalizeReferralCode(stats.referralCode);
  const message = buildReferralMessage(displayCode);
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
      trackEvent("referral_shared", { channel: "clipboard" });
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Long-press the code to copy manually.");
    }
  };

  const openWhatsApp = () => {
    trackEvent("referral_shared", { channel: "whatsapp" });
    // Opens WhatsApp mobile app when installed on mobile browsers and
    // falls through to WhatsApp Web on desktop.
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const nativeShare = async () => {
    const nav: (Navigator & { share?: (d: ShareData) => Promise<void> }) | null =
      typeof navigator !== "undefined" ? navigator : null;
    try {
      if (nav?.share) {
        await nav.share({ text: message });
        trackEvent("referral_shared", { channel: "native" });
        return;
      }
      await nav?.clipboard.writeText(message);
      trackEvent("referral_shared", { channel: "clipboard" });
      toast.success("Copied — paste and send");
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      toast.error("Couldn't open share sheet. Try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Code + share row */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
          Your referral code
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div
            className="flex-1 min-w-0 flex items-center justify-center sm:justify-start px-4 py-3 rounded-2xl bg-yellow-soft border-2 border-orange/40 font-display text-[28px] sm:text-[32px] tracking-[0.3em] text-orange"
            aria-label={`Your referral code is ${displayCode.split("").join(" ")}`}
          >
            {displayCode}
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl bg-paper text-ink border border-rule-strong font-medium text-[14px] hover:border-ink-soft transition-colors motion-reduce:transition-none"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            onClick={openWhatsApp}
            block
            leftIcon={<MessageCircle size={16} />}
          >
            Share on WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={nativeShare}
            block
            leftIcon={<Share2 size={16} />}
          >
            More ways to share
          </Button>
        </div>
      </Card>

      {/* Message preview */}
      <Card className="p-4">
        <div className="text-[12px] font-medium uppercase tracking-widest text-ink-mute mb-1.5">
          Preview
        </div>
        <p className="text-[13.5px] leading-relaxed text-ink whitespace-pre-line">
          {message}
        </p>
      </Card>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatChip
          label="Invited"
          value={stats.referredCount.toLocaleString()}
        />
        <StatChip
          label="Qualified"
          value={stats.qualifiedCount.toLocaleString()}
          accent
        />
        <StatChip
          label="Pending"
          value={stats.pendingCount.toLocaleString()}
        />
      </section>

      {/* How it works */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
          How it works
        </div>
        <ol className="space-y-3">
          <Step
            n={1}
            title="Share your code"
            body="Send your code (or link) to a friend prepping for WASSCE or BECE."
          />
          <Step
            n={2}
            title="They sign up with your code"
            body={`You both earn +${REFERRAL_REWARDS.signupXp} XP the moment they register.`}
          />
          <Step
            n={3}
            title="They stick with it"
            body={`Once they answer ${REFERRAL_REWARDS.qualifyThreshold} questions you get another +${REFERRAL_REWARDS.qualifyXp} XP.`}
          />
        </ol>
      </Card>

      {/* History */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-ink-mute" />
          <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
            Your referrals
          </div>
          <div className="ml-auto text-[11.5px] text-ink-mute">
            {events.length.toLocaleString()} total
          </div>
        </div>
        {events.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-ink-soft">
            No referrals yet. Share your code to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <ReferralEventRow key={e.id} event={e} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatChip({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "p-4 rounded-2xl bg-orange text-on-brand"
          : "p-4 rounded-2xl bg-paper border border-rule-strong"
      }
    >
      <div
        className={
          accent
            ? "text-[10.5px] font-semibold uppercase tracking-widest text-on-brand/80"
            : "text-[10.5px] font-semibold uppercase tracking-widest text-ink-mute"
        }
      >
        {label}
      </div>
      <div
        className={
          accent
            ? "mt-1 font-display text-[26px] leading-none"
            : "mt-1 font-display text-[26px] text-ink leading-none"
        }
      >
        {value}
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-soft text-orange font-display text-[14px]">
        {n}
      </span>
      <div className="min-w-0">
        <div className="font-display text-[15.5px] text-ink leading-tight">
          {title}
        </div>
        <p className="mt-0.5 text-[13px] text-ink-soft">{body}</p>
      </div>
    </li>
  );
}

function ReferralEventRow({ event }: { event: ReferralEvent }) {
  const qualified = event.qualifyXpIssued;
  const joined = new Date(event.createdAt);
  const joinedLabel = Number.isNaN(joined.getTime())
    ? "Recently"
    : joined.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year:
          joined.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
      });
  return (
    <li className="flex items-center gap-3 p-3 rounded-xl border border-rule bg-paper">
      <span
        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-yellow-soft text-orange text-[13px] font-semibold"
        aria-hidden="true"
      >
        F
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-ink">Friend</div>
        <div className="text-[12px] text-ink-soft">Joined {joinedLabel}</div>
      </div>
      {qualified ? (
        <span className="shrink-0 inline-flex items-center h-7 px-2.5 rounded-full bg-orange text-on-brand text-[11.5px] font-semibold uppercase tracking-widest">
          +{REFERRAL_REWARDS.qualifyXp} XP
        </span>
      ) : (
        <span className="shrink-0 inline-flex items-center h-7 px-2.5 rounded-full bg-yellow-soft text-orange text-[11.5px] font-semibold uppercase tracking-widest">
          Pending
        </span>
      )}
    </li>
  );
}
