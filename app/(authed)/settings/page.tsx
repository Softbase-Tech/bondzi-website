import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronRight,
  User as UserIcon,
  Bell,
  BookOpen,
  GraduationCap,
  Sparkles,
  CalendarClock,
  Receipt,
} from "lucide-react";
import { auth } from "@/lib/auth/config";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Bondzi account, notifications, and study focus.",
};

/**
 * Settings hub landing. Simple list of section cards — each links to a
 * dedicated page so the surface stays scannable at any breakpoint.
 * Ordering mirrors the mobile app: Account first (highest-signal
 * writes), then per-topic prefs, then subscription at the bottom for
 * discoverability.
 */
function examDateSubtitle(iso: string): string {
  const ts = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(ts)) return "Set the day we count down to on your profile";
  const days = Math.max(0, Math.ceil((ts - Date.now()) / 86_400_000));
  const label = new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${days} day${days === 1 ? "" : "s"} away · ${label}`;
}

export default async function SettingsHubPage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");
  const profile = session.profile;

  const rows: {
    href: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
  }[] = [
    {
      href: "/settings/account",
      icon: <UserIcon size={18} />,
      title: "Account",
      subtitle: "Name, username, school, password — and danger zone",
    },
    {
      href: "/settings/notifications",
      icon: <Bell size={18} />,
      title: "Notifications",
      subtitle: "Email + push preferences",
    },
    {
      href: "/settings/subjects",
      icon: <BookOpen size={18} />,
      title: "Study focus",
      subtitle: "Pick the subjects you want on your dashboard",
    },
    {
      href: "/settings/exam-type",
      icon: <GraduationCap size={18} />,
      title: "Exam type",
      subtitle: `Currently ${profile.examType.toUpperCase()}${profile.formLevel ? ` · Form ${profile.formLevel}` : ""}`,
    },
    {
      href: "/settings/exam-date",
      icon: <CalendarClock size={18} />,
      title: "Exam date",
      subtitle: profile.targetExamDate
        ? examDateSubtitle(profile.targetExamDate)
        : "Set the day we count down to on your profile",
    },
    {
      href: "/subscription/manage",
      icon: <Sparkles size={18} />,
      title: "Subscription",
      subtitle: "Current plan, entitlements, cancellation",
    },
    {
      href: "/settings/payment-history",
      icon: <Receipt size={18} />,
      title: "Payment history",
      subtitle: "Every checkout attempt on your account",
    },
  ];

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <header>
        <h1 className="font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Settings
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          Signed in as{" "}
          <span className="text-ink font-medium">{profile.fullName}</span>
          {profile.email ? (
            <span className="text-ink-mute"> · {profile.email}</span>
          ) : null}
        </p>
      </header>

      <Card className="divide-y divide-rule">
        {rows.map((row) => (
          <Link
            key={row.href}
            href={row.href}
            className="group flex items-center gap-4 p-4 transition-colors motion-reduce:transition-none hover:bg-yellow-soft/40"
          >
            <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-soft text-orange">
              {row.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[16.5px] text-ink leading-tight">
                {row.title}
              </div>
              <div className="mt-0.5 text-[12.5px] text-ink-soft">
                {row.subtitle}
              </div>
            </div>
            <ChevronRight
              size={18}
              className="shrink-0 text-ink-mute group-hover:text-ink transition-colors motion-reduce:transition-none"
            />
          </Link>
        ))}
      </Card>

      <p className="text-[12px] text-ink-mute text-center">
        Need help? Reach out at{" "}
        <a
          href="mailto:hello@bondzi.online"
          className="text-orange hover:text-orange-deep underline underline-offset-4"
        >
          hello@bondzi.online
        </a>
      </p>
    </div>
  );
}
