"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { marketingPath, POST_LOGOUT_DEFAULT_PATH } from "@/lib/urls";
import { logout as apiLogout } from "@/lib/api/auth";
import { AUTHED_NAV } from "./nav-items";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/utils";

/**
 * Top bar for the authed area. Kept minimal in Phase 1 — logo on the
 * left, avatar + user menu on the right. Phase 2 will add a subject
 * search on desktop and a bottom tab bar on mobile.
 *
 * Sign-out flow:
 *   1. Call backend /auth/logout with the current refresh token so the
 *      device_sessions row is deleted server-side (matches mobile).
 *   2. Call NextAuth signOut() to clear the session cookie.
 *   3. Route to marketing home.
 * Failures on step 1 are non-blocking — the local session is still
 * torn down (matches mobile's belt-and-braces behaviour).
 */
export function AuthedHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const profile = session?.profile;
  const initials = getInitials(profile?.fullName ?? session?.user?.name ?? "");

  async function handleSignOut() {
    try {
      // Best-effort — server-side session teardown.
      if (session?.accessToken) {
        await apiLogout(undefined, session.accessToken).catch(() => undefined);
      }
    } finally {
      await signOut({
        redirect: true,
        redirectTo: marketingPath(POST_LOGOUT_DEFAULT_PATH),
      });
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70 border-b border-rule">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          aria-label="Bondzi dashboard"
          className="flex items-center gap-2.5"
        >
          <Image
            src="/brand/icon.png"
            alt=""
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="display text-[22px] font-medium tracking-tight text-ink">
            Bondzi
          </span>
        </Link>

        {/*
          Desktop nav — primary destinations only (same 5 as the mobile
          bottom bar). Secondary items are surfaced inside the profile
          dropdown so we don't have to fit 10 pills in one row.
        */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-0.5 flex-1 justify-center"
        >
          {AUTHED_NAV.filter((i) => i.mobileTab).map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[13px] font-medium transition-colors motion-reduce:transition-none",
                  isActive
                    ? "bg-yellow-soft/80 text-ink"
                    : "text-ink-soft hover:text-ink hover:bg-yellow-soft/40",
                )}
              >
                <Icon size={14} strokeWidth={2.25} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
        <NotificationBell />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 h-10 pl-1 pr-2.5 rounded-full hover:bg-yellow-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange transition-colors motion-reduce:transition-none"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange text-paper text-[13px] font-semibold">
                {initials}
              </span>
              <span className="hidden sm:inline text-[13.5px] font-medium text-ink truncate max-w-[140px]">
                {profile?.fullName ?? "You"}
              </span>
              <ChevronDown size={14} className="text-ink-mute" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="w-56 rounded-xl border border-rule bg-paper shadow-[0_20px_60px_-20px_rgba(20,20,20,0.35)] p-1.5 z-50 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out"
            >
              <div className="px-2.5 py-2 border-b border-rule mb-1">
                <div className="text-[13px] font-semibold text-ink truncate">
                  {profile?.fullName ?? "Student"}
                </div>
                {profile?.email ? (
                  <div className="text-[12px] text-ink-mute truncate">
                    {profile.email}
                  </div>
                ) : null}
              </div>
              <MenuItem href="/profile" icon={<UserIcon size={15} />}>
                Profile
              </MenuItem>
              <MenuItem href="/settings" icon={<Settings size={15} />}>
                Settings
              </MenuItem>
              <DropdownMenu.Separator className="my-1 h-px bg-rule" />
              <div className="px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-widest text-ink-mute">
                More
              </div>
              {AUTHED_NAV.filter((i) => !i.mobileTab).map(
                ({ href, label, Icon }) => (
                  <MenuItem
                    key={href}
                    href={href}
                    icon={<Icon size={15} />}
                  >
                    {label}
                  </MenuItem>
                ),
              )}
              <DropdownMenu.Separator className="my-1 h-px bg-rule" />
              <DropdownMenu.Item
                onSelect={(e) => {
                  e.preventDefault();
                  void handleSignOut().catch(() => {
                    toast.error("Couldn't sign out. Try again.");
                  });
                }}
                className="flex items-center gap-2 px-2.5 h-9 rounded-lg text-[13.5px] text-ink cursor-pointer outline-none data-[highlighted]:bg-yellow-soft/60"
              >
                <LogOut size={15} className="text-ink-mute" />
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

function MenuItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.Item asChild>
      <Link
        href={href}
        className="flex items-center gap-2 px-2.5 h-9 rounded-lg text-[13.5px] text-ink outline-none data-[highlighted]:bg-yellow-soft/60"
      >
        <span className="text-ink-mute">{icon}</span>
        {children}
      </Link>
    </DropdownMenu.Item>
  );
}

function getInitials(name: string): string {
  if (!name) return "•";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "•";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
