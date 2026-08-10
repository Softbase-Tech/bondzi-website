import {
  LayoutDashboard,
  Tag,
  Wallet,
  User as UserIcon,
} from "lucide-react";

/**
 * Single source of truth for partner-portal nav. Every entry appears
 * in BOTH the tablet+ sidebar and the mobile bottom-tab bar. Four
 * items — the whole app is intentionally shallow so nothing is more
 * than one tap away.
 */
export interface PartnerNavItem {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
}

export const PARTNER_NAV: PartnerNavItem[] = [
  { href: "/partner/dashboard", label: "Home", Icon: LayoutDashboard },
  { href: "/partner/codes", label: "Codes", Icon: Tag },
  { href: "/partner/payouts", label: "Payouts", Icon: Wallet },
  { href: "/partner/profile", label: "Profile", Icon: UserIcon },
];
