import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

/**
 * Skeleton loader — the default "waiting" state for content the app is
 * fetching. Renders a pale block that shimmers subtly so users get an
 * immediate cue "something's coming here" without a jarring spinner.
 *
 * Uses `bg-yellow-soft` (very desaturated warm cream) as the base so
 * the skeleton reads as part of the paper aesthetic, not a foreign
 * grey. Shimmer is a plain CSS animation — no JS, no framer.
 * `motion-reduce` disables the shimmer for users who ask for reduced
 * motion (block still visible so the layout intent is preserved).
 */
export function Skeleton({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-yellow-soft/70",
        "motion-safe:before:absolute motion-safe:before:inset-0",
        "motion-safe:before:-translate-x-full",
        "motion-safe:before:animate-[shimmer_1.4s_ease-in-out_infinite]",
        "motion-safe:before:bg-gradient-to-r",
        "motion-safe:before:from-transparent motion-safe:before:via-paper/60 motion-safe:before:to-transparent",
        className,
      )}
      {...rest}
    />
  );
}
