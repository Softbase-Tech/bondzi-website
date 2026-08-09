import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { listSubjects } from "@/lib/api/subjects";
import { getSelectedSubjectIds } from "@/lib/api/user";
import { Card } from "@/components/ui/Card";
import type { Subject } from "@/lib/api/types";
import { SubjectSelectionForm } from "./SubjectSelectionForm";

export const metadata: Metadata = {
  title: "Study focus",
};

/**
 * Subject-selection page. RSC pre-loads the full subject catalogue
 * (scoped to the student's exam type by the backend) plus their
 * current selection. Client component owns the toggle state + save
 * button.
 *
 * Empty selection is valid — backend treats it as "no filter, show
 * everything." We surface that explicitly so users know they can
 * clear their picks.
 */
export default async function SubjectSelectionPage() {
  const session = await auth();
  if (!session?.accessToken || !session.profile) redirect("/login");
  const profile = session.profile;

  const [subjectsRes, selectedRes] = await Promise.allSettled([
    listSubjects(session.accessToken, profile.examType),
    getSelectedSubjectIds(session.accessToken),
  ]);
  const subjects: Subject[] =
    subjectsRes.status === "fulfilled" ? subjectsRes.value : [];
  const selected: string[] =
    selectedRes.status === "fulfilled" ? selectedRes.value : [];

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-soft hover:text-ink transition-colors motion-reduce:transition-none"
      >
        <ArrowLeft size={14} />
        Back to settings
      </Link>

      <header>
        <h1 className="font-display text-[32px] sm:text-[42px] leading-[1.05] text-ink">
          Study focus
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft max-w-[62ch]">
          Pick the {profile.examType.toUpperCase()} subjects you&apos;re
          preparing for. We&apos;ll surface those first on your
          dashboard. Leave it empty to see everything.
        </p>
      </header>

      {subjects.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-[13.5px] text-ink-soft">
            No subjects available for {profile.examType.toUpperCase()} yet.
          </p>
        </Card>
      ) : (
        <SubjectSelectionForm
          subjects={subjects}
          initialSelected={selected}
        />
      )}
    </div>
  );
}
