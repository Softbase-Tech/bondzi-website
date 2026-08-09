import type { Subject } from "@/lib/api/types";

/**
 * Intersect a subject list with the student's selection.
 *
 * The soft-filter contract from the backend is "empty = show all", but
 * on the web we've flipped that at the UX layer — after onboarding
 * every student has picked ≥1 subject, and if they haven't, the
 * empty-state card prompts them to. So this helper simply narrows;
 * callers detect `selectedIds.length === 0` themselves and render the
 * "Choose subjects" CTA in that case.
 */
export function intersectWithSelected<T extends Subject>(
  all: T[],
  selectedIds: string[],
): T[] {
  if (selectedIds.length === 0) return [];
  const wanted = new Set(selectedIds);
  return all.filter((s) => wanted.has(s.id));
}

/**
 * True when the student has explicitly picked at least one subject.
 * When false the caller should render the "Choose subjects" empty
 * state instead of an unfiltered list — so a fresh account never
 * sees a barren dashboard.
 */
export function hasSelection(selectedIds: string[]): boolean {
  return selectedIds.length > 0;
}
