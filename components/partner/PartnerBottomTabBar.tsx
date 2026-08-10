"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PARTNER_NAV } from "./nav-items";
import { cn } from "@/lib/utils";

/**
 * Bottom tab bar for the partner portal on mobile. Same visual
 * grammar as the main-app BottomTabBar so a student who's also a
 * partner switches contexts without re-learning navigation.
 *
 * Filters `whenSuspended` items so the 4-icon happy-path row stays
 * scannable at thumb distance; the Appeals tab only slides in when
 * the partner is currently suspended.
 */
export function PartnerBottomTabBar({
  showAppeals,
}: {
  showAppeals: boolean;
}) {
  const pathname = usePathname();
  const items = PARTNER_NAV.filter(
    (i) => i.mobileTab && (!i.whenSuspended || showAppeals),
  );
  return (
    <nav
      aria-label="Partner navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-rule bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85 pb-[env(safe-area-inset-bottom)]"
    >
      <ul
        className="grid text-[11px] font-medium"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map(({ href, label, Icon }) => {
          const isActive =
            pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <li key={href} className="contents">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 transition-colors motion-reduce:transition-none",
                  isActive
                    ? "text-ink"
                    : "text-ink-mute active:text-ink",
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-9 h-7 rounded-full transition-colors motion-reduce:transition-none",
                    isActive ? "bg-yellow-soft/80 text-orange" : "",
                  )}
                >
                  <Icon size={16} strokeWidth={2.25} />
                </span>
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
