import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { Card } from "@/components/ui/Card";
import { ProfileForm } from "./ProfileForm";
import { UsernameForm } from "./UsernameForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { DangerZone } from "./DangerZone";

export const metadata: Metadata = {
  title: "Account settings",
};

/**
 * Account settings — profile fields, username, password, and the
 * danger-zone actions. Server-fetches the current SafeUser through
 * `auth()` so the initial paint has all defaults filled.
 */
export default async function AccountSettingsPage() {
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
          Account
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          Update your profile, choose a username, or change your
          password. Changes take effect immediately.
        </p>
      </header>

      <Card className="p-5 sm:p-6">
        <SectionTitle>Profile</SectionTitle>
        <ProfileForm profile={profile} />
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionTitle>Username</SectionTitle>
        <UsernameForm profile={profile} />
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionTitle>Password</SectionTitle>
        <ChangePasswordForm />
      </Card>

      <Card className="p-5 sm:p-6 border-red-200">
        <SectionTitle>Danger zone</SectionTitle>
        <DangerZone />
      </Card>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute mb-4">
      {children}
    </div>
  );
}
