import {
  LayoutDashboard,
  Tag,
  Wallet,
  User as UserIcon,
  ShieldAlert,
} from "lucide-react";

/**
 * Single source of truth for partner-portal nav. Four primary
 * destinations always visible; the Appeals tab only surfaces when
 * the partner needs it (suspended state) via the `whenSuspended`
 * flag — that keeps the mobile tab bar at four icons for the happy
 * path and expands to five only when it matters.
 */
export interface PartnerNavItem {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  /** Show ONLY when the signed-in partner is currently suspended. */
  whenSuspended?: boolean;
}

export const PARTNER_NAV: PartnerNavItem[] = [
  { href: "/partner/dashboard", label: "Home", Icon: LayoutDashboard },
  { href: "/partner/codes", label: "Codes", Icon: Tag },
  { href: "/partner/payouts", label: "Payouts", Icon: Wallet },
  {
    href: "/partner/appeals",
    label: "Appeals",
    Icon: ShieldAlert,
    whenSuspended: true,
  },
  { href: "/partner/profile", label: "Profile", Icon: UserIcon },
];
