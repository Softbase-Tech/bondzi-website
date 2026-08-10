"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PARTNER_NAV } from "./nav-items";
import { cn } from "@/lib/utils";

/**
 * Vertical sidebar shown on md+ screens. Sticky to the top of the
 * viewport so scrolling the main pane doesn't lose the nav. Mobile
 * gets the BottomTabBar instead — mounted alongside in the layout,
 * hidden past md.
 *
 * The sidebar always shows every entry on md+ — screen real estate
 * is cheap on tablets and desktop. The Appeals link is present but
 * the layout only surfaces it visually as a state-of-account nudge
 * when suspended (via `showAppeals`). Everywhere else it's a
 * discoverable "just in case" link.
 */
export function PartnerSidebar({
  showAppeals,
}: {
  showAppeals: boolean;
}) {
  const pathname = usePathname();
  const items = PARTNER_NAV.filter(
    (i) => !i.whenSuspended || showAppeals,
  );
  return (
    <aside
      aria-label="Partner navigation"
      className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col gap-1 sticky top-16 self-start max-h-[calc(100dvh-4rem)] overflow-y-auto pr-3 py-6"
    >
      <div className="px-3 pb-3">
        <p className="kicker">Partner portal</p>
      </div>
      <ul className="flex flex-col gap-0.5">
        {items.map(({ href, label, Icon }) => {
          const isActive =
            pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium",
                  "transition-colors motion-reduce:transition-none",
                  isActive
                    ? "bg-yellow-soft/80 text-ink"
                    : "text-ink-soft hover:bg-yellow-soft/40 hover:text-ink",
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={2.25}
                  className={cn(
                    isActive ? "text-orange" : "text-ink-mute",
                  )}
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
