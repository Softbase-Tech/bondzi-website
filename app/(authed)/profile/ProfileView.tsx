"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  CheckCircle2,
  Flame,
  Sparkles,
  Star,
  Trophy,
  Zap,
  Gift,
  History,
  CreditCard,
  Settings as SettingsIcon,
  LifeBuoy,
  ChevronRight,
} from "lucide-react";
import type {
  Achievement,
  SafeUser,
  Subscription,
  UserStats,
} from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const ACH_ICONS: Record<string, typeof Star> = {
  check: CheckCircle2,
  flame: Flame,
  sparkle: Sparkles,
  star: Star,
  trophy: Trophy,
  lightning: Zap,
};

function initials(fullName: string): string {
  const cleaned = fullName
    .replace(/^(mr|mrs|ms|dr|prof)\.?\s+/i, "")
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function tierLabel(sub: Subscription | null): "PRO" | "PLUS" | null {
  if (!sub || sub.status !== "active" || !sub.account) return null;
  if (sub.account === "pro") return "PRO";
  if (sub.account === "plus") return "PLUS";
  return null;
}

function examChip(user: SafeUser): string {
  const level =
    user.formLevel != null
      ? `Form ${user.formLevel}`
      : user.examType === "novdec"
        ? "Remedial"
        : "";
  return [user.examType.toUpperCase(), level].filter(Boolean).join(" · ");
}

export function ProfileView({
  profile,
  initialStats,
  initialAchievements,
  subscription,
}: {
  profile: SafeUser;
  initialStats: UserStats | null;
  initialAchievements: Achievement[];
  subscription: Subscription | null;
}) {
  // The server component re-fetches these on every navigation, so the props
  // are always fresh — no client query needed.
  const stats = initialStats;
  const achievements = initialAchievements;
  const tier = tierLabel(subscription);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const accuracyPct = stats ? Math.round(stats.accuracy * 100) : 0;
  const activeDays = stats?.activeDaysLast7 ?? [];
  const activeCount = activeDays.filter(Boolean).length;

  const subStatus = tier
    ? tier === "PRO"
      ? "Pro"
      : "Plus"
    : "Free";

  return (
    <div className="max-w-[760px] mx-auto space-y-6">
      {/* Email verify ribbon */}
      {profile.email && !profile.emailVerified ? (
        <Link
          href="/settings/account"
          className="flex items-center justify-between gap-3 rounded-xl border border-orange/30 bg-orange/5 px-4 py-3 text-[13.5px]"
        >
          <span className="text-ink-soft">
            Verify <span className="font-medium text-ink">{profile.email}</span>
          </span>
          <span className="font-semibold text-orange">Verify →</span>
        </Link>
      ) : null}

      {/* Hero identity */}
      <Card className="relative overflow-hidden bg-ink p-6 text-white">
        <div className="relative flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-orange text-[22px] font-bold text-white ring-4 ring-orange/25">
            {initials(profile.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[24px] leading-tight">
              {profile.fullName}
            </h1>
            {profile.username ? (
              <p className="text-[13px] text-white/60">@{profile.username}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
                {examChip(profile)}
              </span>
              {tier ? (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                    tier === "PRO"
                      ? "bg-orange text-white"
                      : "bg-yellow text-ink",
                  )}
                >
                  {tier}
                </span>
              ) : null}
              {profile.streakDays > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold">
                  <Flame size={12} className="text-orange" />
                  {profile.streakDays}
                </span>
              ) : null}
            </div>
          </div>
          <Link
            href="/settings/account"
            className="shrink-0 self-start rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-white/20 motion-reduce:transition-none"
          >
            Edit
          </Link>
        </div>
      </Card>

      {/* Readiness / progress */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
            Your progress
          </span>
          <span className="text-[11px] uppercase tracking-widest text-ink-mute">
            Last 7 days
          </span>
        </div>
        <div className="mt-4 flex items-center gap-5">
          <div className="relative shrink-0">
            <ProgressRing value={stats ? stats.accuracy : 0} size={84} />
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="font-display text-[20px] leading-none text-ink">
                  {accuracyPct}%
                </p>
                <p className="text-[10px] uppercase tracking-wide text-ink-mute">
                  Accuracy
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-end justify-between gap-1">
              {DAY_LABELS.map((d, i) => {
                const active = activeDays[i];
                const isToday = stats?.todayIndex === i;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-full rounded-md",
                        active
                          ? isToday
                            ? "bg-orange"
                            : "bg-yellow"
                          : "bg-rule",
                      )}
                      style={{ height: active ? 28 : 10 }}
                    />
                    <span
                      className={cn(
                        "text-[10px]",
                        isToday ? "font-bold text-orange" : "text-ink-mute",
                      )}
                    >
                      {d}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Questions" value={stats?.totalQuestionsAttempted ?? 0} />
          <Stat label="Active days" value={activeCount} />
        </div>
      </Card>

      {/* Level / XP */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ink text-center leading-none text-white">
            <span className="text-[9px] uppercase tracking-widest text-white/60">
              Lvl
            </span>
            <span className="font-display text-[20px]">
              {stats?.level ?? profile.currentLevel}
            </span>
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-ink">
              Level {stats?.level ?? profile.currentLevel}
            </p>
            <p className="text-[12.5px] text-ink-mute">
              {stats?.xpToNextLevel
                ? `${stats.xpToNextLevel.toLocaleString()} XP to level ${(stats.level ?? 1) + 1}`
                : "Keep going to level up"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-ink-mute">
              Spendable XP
            </p>
            <p className="font-display text-[26px] leading-none text-ink">
              {Number(profile.spendableXp ?? 0).toLocaleString()}
            </p>
          </div>
          <Button href="/subscription/redeem" size="sm" leftIcon={<Zap size={15} />}>
            Redeem
          </Button>
        </div>
      </Card>

      {/* Milestones */}
      {achievements.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
              Milestones
            </h2>
            <span className="text-[12px] text-ink-mute">
              {unlockedCount}/{achievements.length}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {achievements.map((a) => {
              const Icon = ACH_ICONS[a.iconKey] ?? CheckCircle2;
              return (
                <div
                  key={a.id}
                  className={cn(
                    "w-32 shrink-0 rounded-2xl border p-3 text-center",
                    a.unlocked
                      ? "border-rule bg-paper"
                      : "border-rule bg-bg/50 opacity-70",
                  )}
                >
                  <span
                    className={cn(
                      "mx-auto grid h-11 w-11 place-items-center rounded-xl",
                      a.unlocked ? "text-white" : "bg-rule text-ink-mute",
                    )}
                    style={
                      a.unlocked
                        ? {
                            backgroundImage: `linear-gradient(135deg, ${a.gradientStart}, ${a.gradientEnd})`,
                          }
                        : undefined
                    }
                  >
                    <Icon size={20} />
                  </span>
                  <p className="mt-2 line-clamp-2 text-[12.5px] font-semibold text-ink">
                    {a.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-mute">
                    {a.progressLabel}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Account links */}
      <Card className="p-2">
        <LinkRow
          href="/referral"
          Icon={Gift}
          label="Invite friends"
          hint="Share your code"
        />
        <LinkRow
          href="/subscription/manage"
          Icon={CreditCard}
          label="Subscription"
          hint={subStatus}
        />
        <LinkRow
          href="/sessions"
          Icon={History}
          label="Session history"
          hint=""
        />
        <LinkRow
          href="/settings"
          Icon={SettingsIcon}
          label="Settings"
          hint=""
        />
        <LinkRow href="/help" Icon={LifeBuoy} label="Help & feedback" hint="" />
        <LinkRow
          href="/notifications"
          Icon={History}
          label="Notifications"
          hint=""
          last
        />
      </Card>

      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/login" })}
        className="mx-auto block py-2 text-[13.5px] font-medium text-ink-mute transition-colors hover:text-ink motion-reduce:transition-none"
      >
        Sign out
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-rule bg-bg/40 px-4 py-3">
      <p className="font-display text-[20px] leading-none text-ink">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-ink-mute">
        {label}
      </p>
    </div>
  );
}

function LinkRow({
  href,
  Icon,
  label,
  hint,
  last,
}: {
  href: string;
  Icon: typeof Gift;
  label: string;
  hint: string;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-3.5 transition-colors hover:bg-bg/50 motion-reduce:transition-none rounded-xl",
        !last && "border-b border-rule",
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-bg text-ink-soft">
        <Icon size={17} />
      </span>
      <span className="flex-1 text-[14.5px] font-medium text-ink">{label}</span>
      {hint ? <span className="text-[12.5px] text-ink-mute">{hint}</span> : null}
      <ChevronRight size={16} className="text-ink-mute" />
    </Link>
  );
}
