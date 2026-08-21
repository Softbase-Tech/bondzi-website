"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUTHED_NAV } from "./nav-items";
import { cn } from "@/lib/utils";

/**
 * Compact mobile tab bar — pinned to the bottom of the viewport,
 * respects iOS safe-area. Hidden on md+ (desktop uses the top nav).
 *
 * Uses the same `AUTHED_NAV` source as the header — filters to items
 * flagged `mobileTab: true` so the row stays scannable at thumb
 * distance. If the user is deep on a related route (say
 * /mock-exams/[subjectId]) we highlight the parent tab so the "you
 * are here" hint doesn't disappear.
 */
export function BottomTabBar() {
  const pathname = usePathname();
  const items = AUTHED_NAV.filter((i) => i.primary);

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-rule bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85 pb-[env(safe-area-inset-bottom)]"
    >
      <ul
        className="grid text-[11px] font-medium"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
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
