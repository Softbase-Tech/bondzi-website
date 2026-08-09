import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { NotificationPrefsForm } from "./NotificationPrefsForm";

export const metadata: Metadata = {
  title: "Notification preferences",
};

/**
 * Notification-preferences page. The SafeUser already carries every
 * toggle we render — no separate GET needed. Client component owns
 * the optimistic-flip UX + reconciles with the backend snapshot on
 * response.
 */
export default async function NotificationSettingsPage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");
  const profile = session.profile;

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-soft hover:text-ink transition-colors motion-reduce:transition-none"
      >
        <ArrowLeft size={14} />
        Back to settings
      </Link>

      <header>
        <h1 className="font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Notifications
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          Choose which emails and push notifications Bondzi sends. You
          can turn any topic off — account-critical mail (receipts,
          password resets, security notices) will always come through.
        </p>
      </header>

      <NotificationPrefsForm profile={profile} />
    </div>
  );
}
