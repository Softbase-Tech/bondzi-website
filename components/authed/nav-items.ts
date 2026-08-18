import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Dumbbell,
  Sparkles,
  Timer,
  GraduationCap,
  Trophy,
  Gift,
  Brain,
  Target,
} from "lucide-react";

/**
 * Single source of truth for the authed nav — the desktop header row
 * and the mobile bottom-tab bar both derive their entries from this
 * array so a new destination lives in one place. `mobileTab: true`
 * marks the five primary destinations we surface on the bottom bar
 * (dashboard, past papers, quiz, mock exams, subjects) since a mobile
 * tab bar with more than five icons stops being scannable at thumb
 * distance.
 */
export interface NavItem {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  /** Also include in the compact 5-slot mobile bottom tab bar. */
  mobileTab: boolean;
}

export const AUTHED_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    Icon: LayoutDashboard,
    mobileTab: true,
  },
  {
    href: "/subjects",
    label: "Subjects",
    Icon: BookOpen,
    mobileTab: true,
  },
  {
    href: "/past-papers",
    label: "Past papers",
    Icon: FileText,
    mobileTab: true,
  },
  {
    href: "/practice",
    label: "Practice",
    Icon: Dumbbell,
    mobileTab: false,
  },
  {
    href: "/quiz",
    label: "Quiz",
    Icon: Sparkles,
    mobileTab: true,
  },
  {
    href: "/mock-exams",
    label: "Mock",
    Icon: Timer,
    mobileTab: false,
  },
  {
    href: "/level-tests",
    label: "Level test",
    Icon: GraduationCap,
    mobileTab: false,
  },
  {
    href: "/ai-review",
    label: "AI Review",
    Icon: Brain,
    mobileTab: false,
  },
  {
    href: "/weakness",
    label: "Weak spots",
    Icon: Target,
    mobileTab: false,
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    Icon: Trophy,
    mobileTab: true,
  },
  {
    href: "/winners",
    label: "Winners",
    Icon: Sparkles,
    mobileTab: false,
  },
  {
    href: "/referral",
    label: "Refer",
    Icon: Gift,
    mobileTab: false,
  },
];
