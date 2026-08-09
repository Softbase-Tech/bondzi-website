import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: number;
  className?: string;
  /** Colour to use for the moving arc. Defaults to `currentColor` so buttons inherit their text colour. */
  color?: string;
  /** Screen-reader label. Default 'Loading'. */
  label?: string;
}

/**
 * Pure-SVG spinner. No dependencies, no reflow — safe to render inside
 * a button's flex row without shifting sibling text.
 *
 * Respects `prefers-reduced-motion` via `motion-reduce:animate-none` —
 * users who ask for less motion just see the static ring. Since the
 * button remains `disabled` while `loading`, the state is still
 * conveyed even without animation.
 */
export function Spinner({
  size = 16,
  className,
  color = "currentColor",
  label = "Loading",
}: SpinnerProps) {
  const s = size;
  const stroke = Math.max(2, s / 8);
  return (
    <svg
      viewBox={`0 0 ${s} ${s}`}
      width={s}
      height={s}
      role="progressbar"
      aria-label={label}
      aria-live="polite"
      className={cn("animate-spin motion-reduce:animate-none", className)}
      style={{ display: "inline-block" }}
    >
      <circle
        cx={s / 2}
        cy={s / 2}
        r={s / 2 - stroke / 2}
        fill="none"
        stroke={color}
        strokeOpacity={0.2}
        strokeWidth={stroke}
      />
      <path
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        d={`M ${s / 2} ${stroke / 2} A ${s / 2 - stroke / 2} ${s / 2 - stroke / 2} 0 0 1 ${s - stroke / 2} ${s / 2}`}
      />
    </svg>
  );
}
