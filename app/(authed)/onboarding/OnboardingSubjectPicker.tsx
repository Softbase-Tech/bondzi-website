"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { setSelectedSubjectIds } from "@/lib/api/user";
import type { Subject } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { countBand, trackEvent } from "@/lib/analytics";

const MAX_SELECTIONS = 50;

interface Props {
  subjects: Subject[];
  initialSelected: string[];
}

/**
 * Onboarding subject picker. Cores are pre-selected so a student who
 * skims through still lands with a sensible default. Continue submits
 * the full set via `PUT /users/me/subjects`; Skip lets them through
 * with whatever they've toggled (or nothing, in which case the
 * dashboard empty-state card catches them).
 */
export function OnboardingSubjectPicker({
  subjects,
  initialSelected,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Set<string>>(() => {
    if (initialSelected.length > 0) return new Set(initialSelected);
    // Pre-check cores so the default tap is sensible for a rushed
    // student. Elective category (or absent category) stays off until
    // the student explicitly picks.
    return new Set(
      subjects.filter((s) => (s.category ?? "").toLowerCase() === "core")
        .map((s) => s.id),
    );
  });

  const grouped = useMemo(() => groupByCategory(subjects), [subjects]);
  const count = selected.size;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_SELECTIONS) {
          toast.error(`Pick at most ${MAX_SELECTIONS} subjects.`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  // `skipped` distinguishes the two callers — both land on the
  // dashboard and both persist whatever is currently toggled, so the
  // only difference is intent, and that's exactly the thing worth
  // measuring: how many students bail past the picker with only the
  // pre-checked cores.
  const save = (thenGo: "dashboard", { skipped }: { skipped: boolean }) => {
    startTransition(async () => {
      // Bucketed, not raw — the exact count is noise, the shape of the
      // distribution is what tells you whether the picker is working.
      trackEvent("onboarding_subjects_saved", {
        subjectCount: countBand(selected.size),
        skipped,
      });
      try {
        await setSelectedSubjectIds(Array.from(selected));
      } catch (err) {
        // Don't trap the student — dashboard will show the empty-state
        // CTA if the save failed and they can re-pick from Settings.
        toast.error(
          err instanceof Error
            ? err.message
            : "Couldn't save your picks. You can update them under Settings later.",
        );
      }
      router.replace(`/${thenGo}`);
    });
  };

  return (
    <div className="space-y-5">
      <Card className="p-3 flex items-center justify-between">
        <div className="text-[13px] font-medium text-ink">
          {count} selected
        </div>
        {count > 0 ? (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-[12px] text-ink-soft hover:text-ink underline underline-offset-2"
          >
            Clear
          </button>
        ) : null}
      </Card>

      {grouped.map((group) => (
        <section key={group.key} className="space-y-3">
          <div className="text-[13px] font-medium uppercase tracking-widest text-ink-mute">
            {group.label}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.rows.map((s) => {
              const isSelected = selected.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors motion-reduce:transition-none",
                    isSelected
                      ? "border-orange bg-yellow-soft/60"
                      : "border-rule-strong bg-paper hover:border-ink-soft",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-semibold",
                      isSelected
                        ? "bg-orange text-paper"
                        : "bg-yellow-soft text-orange",
                    )}
                    aria-hidden="true"
                  >
                    {isSelected ? "✓" : ""}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[15px] leading-tight text-ink truncate">
                      {s.name}
                    </div>
                    {typeof s.questionCount === "number" ? (
                      <div className="mt-0.5 text-[11.5px] text-ink-soft">
                        {s.questionCount.toLocaleString()} questions
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <Card className="p-3 flex flex-col sm:flex-row items-center gap-3">
        <Button
          block
          size="lg"
          loading={pending}
          onClick={() => save("dashboard", { skipped: false })}
          className="sm:flex-1"
        >
          {count > 0 ? `Continue with ${count} subjects` : "Continue"}
        </Button>
        <button
          type="button"
          onClick={() => save("dashboard", { skipped: true })}
          disabled={pending}
          className="text-[13px] text-ink-soft hover:text-ink underline underline-offset-2 disabled:opacity-60"
        >
          Skip for now
        </button>
      </Card>
    </div>
  );
}

function groupByCategory(subjects: Subject[]) {
  const buckets = new Map<string, Subject[]>();
  for (const s of subjects) {
    const key = (s.category ?? "").toLowerCase() || "other";
    const bucket = buckets.get(key) ?? [];
    bucket.push(s);
    buckets.set(key, bucket);
  }
  const ordered: Array<{ key: string; label: string; rows: Subject[] }> = [];
  const push = (key: string, label: string) => {
    const rows = buckets.get(key);
    if (!rows) return;
    rows.sort((a, b) => a.name.localeCompare(b.name));
    ordered.push({ key, label, rows });
  };
  push("core", "Core subjects");
  push("elective", "Electives");
  for (const [k, rows] of buckets) {
    if (k === "core" || k === "elective") continue;
    rows.sort((a, b) => a.name.localeCompare(b.name));
    ordered.push({
      key: k,
      label: k === "other" ? "Other subjects" : k.charAt(0).toUpperCase() + k.slice(1),
      rows,
    });
  }
  return ordered;
}
