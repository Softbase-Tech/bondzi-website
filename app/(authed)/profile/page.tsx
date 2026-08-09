import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Bondzi account details.",
};

/**
 * PHASE 1 STUB — read-only profile view confirming what the backend
 * knows about the signed-in student. Phase 7 turns this into a
 * full editable settings hub (change password, edit exam type,
 * notification preferences, subscription, etc.).
 */
export default async function ProfilePage() {
  const session = await auth();
  const profile = session?.profile;

  const rows: { label: string; value: string }[] = [
    { label: "Full name", value: profile?.fullName ?? "—" },
    { label: "Username", value: profile?.username ?? "Not set" },
    { label: "Email", value: profile?.email ?? "—" },
    { label: "Phone", value: profile?.phone ?? "—" },
    { label: "Exam", value: (profile?.examType ?? "—").toUpperCase() },
    {
      label: "Form",
      value:
        profile?.formLevel != null
          ? `Form ${profile.formLevel}`
          : "Not applicable",
    },
    { label: "Referral code", value: profile?.referralCode ?? "—" },
    {
      label: "Streak",
      value: `${profile?.streakDays ?? 0} days (longest ${profile?.longestStreak ?? 0})`,
    },
    { label: "Level XP", value: (profile?.levelXp ?? 0).toLocaleString() },
    {
      label: "Spendable XP",
      value: (profile?.spendableXp ?? 0).toLocaleString(),
    },
    {
      label: "Member since",
      value: profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString("en-GH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—",
    },
  ];

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <div>
        <p className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
          Account
        </p>
        <h1 className="mt-2 font-display text-[36px] leading-tight text-ink">
          Your profile
        </h1>
      </div>
      <Card>
        <ul className="divide-y divide-rule">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-5 py-4"
            >
              <span className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
                {row.label}
              </span>
              <span className="text-[15px] text-ink">{row.value}</span>
            </li>
          ))}
        </ul>
      </Card>
      <p className="text-[13.5px] text-ink-soft">
        Full account editing (change password, exam type, notification
        preferences) arrives in a later phase.
      </p>
    </div>
  );
}
