import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getUserStats } from "@/lib/api/user";
import { getAchievementsServer } from "@/lib/api/achievements";
import { getMySubscription } from "@/lib/api/subscription";
import type {
  Achievement,
  Subscription,
  UserStats,
} from "@/lib/api/types";
import { ProfileView } from "./ProfileView";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Bondzi progress, level, streak and milestones.",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");

  const [statsRes, achRes, subRes] = await Promise.allSettled([
    getUserStats(session.accessToken),
    getAchievementsServer(session.accessToken),
    getMySubscription(session.accessToken),
  ]);

  const stats: UserStats | null =
    statsRes.status === "fulfilled" ? statsRes.value : null;
  const achievements: Achievement[] =
    achRes.status === "fulfilled" ? achRes.value : [];
  const subscription: Subscription | null =
    subRes.status === "fulfilled" ? subRes.value : null;

  return (
    <ProfileView
      profile={session.profile}
      initialStats={stats}
      initialAchievements={achievements}
      subscription={subscription}
    />
  );
}
