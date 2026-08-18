import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getWeaknessServer } from "@/lib/api/weakness";
import type { WeaknessBySource } from "@/lib/api/types";
import { WeaknessView } from "./WeaknessView";

export const metadata: Metadata = {
  title: "Weak spots",
  description:
    "The topics where you're losing the most marks — and an AI read on how to fix them.",
};

const EMPTY: WeaknessBySource = {
  pastPaperWeakTopics: [],
  syllabusWeakTopics: [],
};

export default async function WeaknessPage() {
  const session = await auth();
  if (!session?.accessToken || !session.user) redirect("/login");

  const res = await Promise.allSettled([
    getWeaknessServer(session.accessToken),
  ]);
  const initial: WeaknessBySource =
    res[0].status === "fulfilled" ? res[0].value : EMPTY;

  return (
    <div className="max-w-[760px] mx-auto space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
          Coaching · For you
        </p>
        <h1 className="mt-2 font-display text-[32px] sm:text-[40px] leading-tight text-ink">
          Weak spots
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          The topics where you&apos;re losing the most marks, ranked by your
          accuracy. Drill these first.
        </p>
      </header>
      <WeaknessView initial={initial} />
    </div>
  );
}
