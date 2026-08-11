import {
  LayoutDashboard,
  Tag,
  Users,
  Wallet,
  User as UserIcon,
  ShieldAlert,
  Image as ImageIcon,
} from "lucide-react";

/**
 * Single source of truth for partner-portal nav. Sidebar (md+) shows
 * every entry; the mobile bottom-tab bar filters to `mobileTab: true`
 * so the row stays scannable at thumb distance — the header
 * dropdown covers Profile and other overflow.
 *
 * The Appeals entry uses `whenSuspended: true` so the tab only
 * surfaces when the partner needs it; everywhere else the sidebar
 * lists it as a discoverable link.
 */
export interface PartnerNavItem {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  /** Include in the mobile bottom-tab bar. */
  mobileTab: boolean;
  /** Show ONLY when the signed-in partner is currently suspended. */
  whenSuspended?: boolean;
}

export const PARTNER_NAV: PartnerNavItem[] = [
  {
    href: "/partner/dashboard",
    label: "Home",
    Icon: LayoutDashboard,
    mobileTab: true,
  },
  { href: "/partner/codes", label: "Codes", Icon: Tag, mobileTab: true },
  {
    href: "/partner/referrals",
    label: "Referrals",
    Icon: Users,
    mobileTab: true,
  },
  {
    href: "/partner/banners",
    label: "Banners",
    Icon: ImageIcon,
    mobileTab: true,
  },
  {
    href: "/partner/payouts",
    label: "Payouts",
    Icon: Wallet,
    mobileTab: true,
  },
  {
    href: "/partner/appeals",
    label: "Appeals",
    Icon: ShieldAlert,
    mobileTab: true,
    whenSuspended: true,
  },
  {
    href: "/partner/profile",
    label: "Profile",
    Icon: UserIcon,
    mobileTab: false,
  },
];
