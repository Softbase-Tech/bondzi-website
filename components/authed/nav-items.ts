import {
  Brain,
  Gift,
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Target,
  Timer,
  Trophy,
} from "lucide-react";

/**
 * Nav shape aligned with the mobile app. Mobile has five bottom
 * tabs: Home, Practice (= Subjects), Quiz, Rank (= Leaderboard),
 * Profile. Web mirrors these as the primary nav across desktop and
 * mobile.
 *
 * `secondary` items are surfaced under the profile dropdown / a
 * secondary menu instead of the primary nav row — they still exist
 * as routes and remain reachable, they just don't clutter the top
 * bar. That matches how mobile buries Past papers / Mock / Level
 * test / AI Review / Weak spots / Winners / Refer inside the
 * subject-hub and profile screens.
 */
export interface NavItem {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  /**
   * Show in the primary nav row (desktop top bar + mobile bottom
   * tabs). Non-primary items are still exported so the profile
   * dropdown / catch-all menus can list them.
   */
  primary: boolean;
}

export const AUTHED_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    Icon: LayoutDashboard,
    primary: true,
  },
  {
    href: "/subjects",
    label: "Subjects",
    Icon: BookOpen,
    primary: true,
  },
  {
    href: "/quiz",
    label: "Quiz",
    Icon: Sparkles,
    primary: true,
  },
  {
    href: "/leaderboard",
    label: "Rank",
    Icon: Trophy,
    primary: true,
  },
  // Everything below is a secondary destination — surfaced via
  // dropdowns / subject-hub / profile, not the top nav.
  {
    href: "/past-papers",
    label: "Past papers",
    Icon: BookOpen,
    primary: false,
  },
  {
    href: "/mock-exams",
    label: "Mock exam",
    Icon: Timer,
    primary: false,
  },
  {
    href: "/level-tests",
    label: "Level test",
    Icon: GraduationCap,
    primary: false,
  },
  {
    href: "/ai-review",
    label: "AI Review",
    Icon: Brain,
    primary: false,
  },
  {
    href: "/weakness",
    label: "Weak spots",
    Icon: Target,
    primary: false,
  },
  {
    href: "/winners",
    label: "Winners",
    Icon: Sparkles,
    primary: false,
  },
  {
    href: "/referral",
    label: "Refer",
    Icon: Gift,
    primary: false,
  },
];
