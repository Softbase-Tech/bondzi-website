"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Mail, ArrowRight } from "lucide-react";

/**
 * Persistent banner reminding a signed-in student to verify their
 * email. Shows only when:
 *   - Session profile is loaded
 *   - `emailVerified` is false
 *   - The user actually has an email on file (phone-only accounts
 *     have nothing to verify here)
 *
 * Renders as a slim strip above the header. Rich enough to read on a
 * mobile status bar, quiet enough not to hijack attention on desktop.
 */
export function VerifyEmailBanner() {
  const { data: session } = useSession();
  const profile = session?.profile;
  if (!profile) return null;
  if (profile.emailVerified) return null;
  if (!profile.email) return null;

  return (
    <div className="w-full bg-yellow border-b border-yellow-soft">
      <Link
        href="/verify-email"
        className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-2.5 flex items-center gap-2 text-[13px] text-ink hover:text-orange-deep transition-colors"
      >
        <Mail size={16} className="shrink-0" />
        <span className="flex-1 truncate">
          Verify your email to unlock everything Bondzi has to offer.
        </span>
        <span className="hidden sm:inline font-semibold">Verify now</span>
        <ArrowRight size={14} className="shrink-0" />
      </Link>
    </div>
  );
}
