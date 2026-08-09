import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders as a Next `<Link>` when set. Wraps whatever ref logic the callers pass. */
  href?: string;
  /** External link (opens in new tab, `noreferrer noopener`). */
  external?: boolean;
  /** Full-width block on mobile — the default for form CTAs. */
  block?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

const BASE = [
  // Layout + touch target. `min-h-11` = 44px, iOS Human Interface's
  // tap-target minimum. On desktop the visual size uses the padding
  // instead so buttons don't feel oversized in nav bars.
  "inline-flex items-center justify-center gap-2",
  "font-medium leading-none whitespace-nowrap",
  "select-none",
  "transition-[transform,background-color,border-color,color,box-shadow]",
  "duration-150 ease-out",
  // Tap feedback + accessibility.
  "active:scale-[0.98]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  "focus-visible:ring-orange focus-visible:ring-offset-bg",
  // Disabled state.
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
  // Respect prefers-reduced-motion.
  "motion-reduce:transition-none motion-reduce:active:scale-100",
].join(" ");

const VARIANTS: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-orange text-paper",
    "hover:bg-orange-deep",
    "shadow-[0_1px_0_rgba(0,0,0,0.06),0_2px_8px_-4px_rgba(212,75,26,0.35)]",
  ),
  secondary: cn(
    "bg-ink text-paper",
    "hover:bg-ink-soft",
  ),
  outline: cn(
    "bg-paper text-ink border border-rule-strong",
    "hover:border-ink-soft hover:bg-yellow-soft/50",
  ),
  ghost: cn(
    "bg-transparent text-ink",
    "hover:bg-yellow-soft/60",
  ),
  destructive: cn(
    "bg-red-600 text-white",
    "hover:bg-red-700",
  ),
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-[13px] rounded-lg",
  md: "min-h-11 px-4 text-[15px] rounded-xl",
  lg: "min-h-12 px-5 text-[16px] rounded-xl",
};

/**
 * The one Button. Rendered as `<a>` when `href` is set, otherwise
 * `<button>`. Deliberately no polymorphic `as` prop — the two cases
 * cover 100% of real use and the branch is one `if`.
 *
 * UX rules baked in:
 *   - `min-h-11` (44px) on the default size — iOS + Material tap-target guidance.
 *   - `active:scale-[0.98]` for tactile feedback that reads as
 *     "professional" without being cartoony.
 *   - `focus-visible` ring appears only for keyboard traversal.
 *   - `loading` renders a Spinner AND disables the button so a double-
 *     tap can't fire a mutation twice. Text stays visible so the
 *     button width doesn't collapse.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      block = false,
      loading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      href,
      external,
      type = "button",
      ...rest
    },
    ref,
  ) {
    const classes = cn(
      BASE,
      VARIANTS[variant],
      SIZES[size],
      block && "w-full",
      className,
    );

    const inner = (
      <>
        {loading ? (
          <Spinner
            size={size === "sm" ? 14 : size === "lg" ? 18 : 16}
            className="shrink-0"
          />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children != null && <span className="truncate">{children}</span>}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </>
    );

    if (href) {
      if (external) {
        return (
          <a
            href={href}
            className={classes}
            target="_blank"
            rel="noreferrer noopener"
            aria-disabled={disabled || loading ? true : undefined}
          >
            {inner}
          </a>
        );
      }
      return (
        <Link
          href={href}
          className={classes}
          aria-disabled={disabled || loading ? true : undefined}
        >
          {inner}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || loading}
        {...rest}
      >
        {inner}
      </button>
    );
  },
);
