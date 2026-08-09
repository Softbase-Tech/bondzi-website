import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a subtle hover lift — use for interactive cards (subject tiles, past-paper cards). */
  interactive?: boolean;
  /** Emphasises the border for cards that need to attract attention (paywall CTAs). */
  emphasis?: boolean;
}

/**
 * Content container using the paper/ink token vocabulary. Cards are the
 * dominant grouping element for the authed area (subjects, past-paper
 * lists, session summaries) so they need to look precise, not fancy.
 *
 * The `interactive` variant adds hover + focus states — meant for
 * cards wrapping a link or button. Cards used purely for grouping
 * static content stay unlifted.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, emphasis = false, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-paper rounded-2xl",
        emphasis ? "border border-orange/40" : "border border-rule",
        "shadow-[0_1px_0_rgba(20,20,20,0.03)]",
        interactive && [
          "transition-[transform,border-color,box-shadow] duration-200 ease-out",
          "hover:border-rule-strong",
          "hover:shadow-[0_1px_0_rgba(20,20,20,0.04),0_10px_28px_-16px_rgba(20,20,20,0.15)]",
          "focus-within:border-orange/60 focus-within:shadow-[0_1px_0_rgba(20,20,20,0.04),0_10px_28px_-16px_rgba(212,75,26,0.25)]",
          "motion-reduce:transition-none",
        ],
        className,
      )}
      {...rest}
    />
  );
});

/**
 * Convenience header slot. Kept thin so callers compose freely — no
 * enforced typography or padding that would rob layout flexibility.
 */
export function CardHeader({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 pt-5 pb-2", className)} {...rest} />
  );
}

export function CardBody({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...rest} />;
}

export function CardFooter({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 pt-2 pb-5 flex items-center gap-3 border-t border-rule/60",
        className,
      )}
      {...rest}
    />
  );
}
