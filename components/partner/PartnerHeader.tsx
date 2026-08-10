"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut } from "lucide-react";
import { logout as apiLogout } from "@/lib/api/auth";

/**
 * Top bar for the partner portal. Mirrors AuthedHeader's grammar
 * (sticky, backdrop-blur) but rebranded slightly with the "Partner"
 * kicker so the operator knows they're in the partner surface, not
 * the student app. Sign-out follows the same 3-step teardown as the
 * main app.
 *
 * Post-logout landing: /partner/signed-out on the SAME host. The
 * partner surface is completely self-contained on partners.bondzi.
 * online — sign-in, register, forgot-password, session expiry all
 * live here, and the session cookie is host-scoped so there's no
 * cross-subdomain state leak.
 */
export function PartnerHeader() {
  const { data: session } = useSession();
  const profile = session?.profile;
  const initials = getInitials(
    profile?.fullName ?? session?.user?.name ?? "",
  );

  async function handleSignOut() {
    try {
      if (session?.accessToken) {
        await apiLogout(undefined, session.accessToken).catch(
          () => undefined,
        );
      }
    } finally {
      // Same-host relative URL — NextAuth converts to an absolute
      // URL against the current origin, so www.partners… stays on
      // www.partners… and the bare form stays on the bare form.
      await signOut({
        redirect: true,
        redirectTo: "/partner/signed-out",
      });
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70 border-b border-rule">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        <Link
          href="/partner/dashboard"
          className="flex items-center gap-2 min-w-0"
          aria-label="Bondzi Partner"
        >
          <span className="display text-[22px] sm:text-[26px]">Bondzi</span>
          <span className="hidden sm:inline-flex items-center rounded-full bg-yellow-soft px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase text-orange-deep">
            Partner
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-2.5 py-1.5 hover:border-rule-strong"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange text-paper text-[12px] font-bold">
                  {initials}
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className="text-ink-mute"
                />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="min-w-[200px] rounded-xl border border-rule bg-paper p-1 shadow-[0_10px_28px_-16px_rgba(20,20,20,0.25)]"
              >
                <DropdownMenu.Item asChild>
                  <Link
                    href="/partner/profile"
                    className="block rounded-lg px-3 py-2 text-[14px] text-ink hover:bg-yellow-soft/60 cursor-pointer"
                  >
                    Profile & MoMo
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-rule" />
                <DropdownMenu.Item
                  onSelect={(e) => {
                    e.preventDefault();
                    void handleSignOut();
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] text-ink hover:bg-yellow-soft/60 cursor-pointer"
                >
                  <LogOut size={14} />
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "P";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "P";
}
