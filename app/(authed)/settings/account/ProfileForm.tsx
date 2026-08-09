"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateProfile } from "@/lib/api/user";
import type { SafeUser } from "@/lib/api/types";

interface Props {
  profile: SafeUser;
}

/**
 * Editable profile fields (whitelist matches backend UpdateProfileDto):
 * fullName, schoolName, region. Everything else lives on other pages
 * (username has cooldown rules; email/phone changes need OTP flows;
 * examType lives on its own screen).
 *
 * Success path also updates the NextAuth session so the header/menu
 * pick up the new name without a hard refresh.
 */
export function ProfileForm({ profile }: Props) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [schoolName, setSchoolName] = useState(profile.schoolName ?? "");
  const [region, setRegion] = useState(profile.region ?? "");
  const [error, setError] = useState<string | null>(null);

  const dirty =
    fullName.trim() !== (profile.fullName ?? "") ||
    schoolName.trim() !== (profile.schoolName ?? "") ||
    region.trim() !== (profile.region ?? "");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const nextName = fullName.trim();
    if (nextName.length < 2) {
      setError("Enter your full name.");
      return;
    }
    startTransition(async () => {
      try {
        const updated = await updateProfile({
          fullName: nextName,
          schoolName: schoolName.trim() || undefined,
          region: region.trim() || undefined,
        });
        // Reflect the new profile into the NextAuth session so
        // consumers of `useSession().profile` (header, dashboards)
        // see it immediately.
        await updateSession({ profile: updated });
        toast.success("Profile updated");
        router.refresh();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Couldn't save changes.";
        setError(msg);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        maxLength={120}
        autoComplete="name"
        required
      />
      <Input
        label="School name"
        value={schoolName}
        onChange={(e) => setSchoolName(e.target.value)}
        maxLength={120}
        placeholder="e.g. Achimota School"
        autoComplete="organization"
      />
      <Input
        label="Region"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        maxLength={60}
        placeholder="e.g. Greater Accra"
        autoComplete="address-level1"
      />
      {error ? (
        <p className="text-[13px] font-medium text-red-600">{error}</p>
      ) : null}
      <Button type="submit" loading={pending} disabled={!dirty}>
        Save profile
      </Button>
    </form>
  );
}
