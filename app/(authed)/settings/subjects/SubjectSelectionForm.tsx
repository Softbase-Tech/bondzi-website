"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { setSelectedSubjectIds } from "@/lib/api/user";
import type { Subject } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const MAX_SELECTIONS = 50;

interface Props {
  subjects: Subject[];
  initialSelected: string[];
}

/**
 * Subject picker. Groups by category (Core / Elective / uncategorised)
 * so the choice is visually sorted the way WAEC organises papers.
 * `MAX_SELECTIONS` matches the backend `@ArrayMaxSize(50)`.
 */
export function SubjectSelectionForm({ subjects, initialSelected }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected),
  );

  const grouped = useMemo(() => {
    const buckets = new Map<string, Subject[]>();
    for (const s of subjects) {
      const key = (s.category ?? "").toLowerCase() || "other";
      const bucket = buckets.get(key) ?? [];
      bucket.push(s);
      buckets.set(key, bucket);
    }
    // Sort within bucket and put "core" first, "elective" next,
    // everything else after.
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
        label: k === "other" ? "Other subjects" : capitalise(k),
        rows,
      });
    }
    return ordered;
  }, [subjects]);

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

  const clear = () => setSelected(new Set());

  const dirty = useMemo(() => {
    if (selected.size !== initialSelected.length) return true;
    for (const id of initialSelected) if (!selected.has(id)) return true;
    return false;
  }, [selected, initialSelected]);

  const onSave = () => {
    startTransition(async () => {
      try {
        const res = await setSelectedSubjectIds(Array.from(selected));
        setSelected(new Set(res.subjectIds));
        toast.success("Study focus updated");
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't save selection.",
        );
      }
    });
  };

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-ink-mute" />
          <div className="text-[13px] font-medium text-ink">
            {selected.size} of {subjects.length} selected
          </div>
          {selected.size > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="ml-auto text-[12px] text-ink-soft hover:text-ink underline underline-offset-2"
            >
              Clear
            </button>
          ) : null}
        </div>
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

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+90px)] md:bottom-4 z-10">
        <Card className="p-3">
          <Button
            block
            size="lg"
            loading={pending}
            disabled={!dirty}
            onClick={onSave}
          >
            {selected.size === 0 ? "Save (show all subjects)" : "Save focus"}
          </Button>
        </Card>
      </div>
    </div>
  );
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
