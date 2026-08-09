import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Idiomatic className merger. `clsx` handles conditional strings and arrays;
 * `twMerge` deduplicates conflicting Tailwind utilities so a caller can override
 * a component's default classes without fighting specificity (`cn("px-4", "px-6")`
 * yields `px-6`, not `px-4 px-6`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
