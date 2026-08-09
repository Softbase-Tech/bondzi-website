import { cn } from "@/lib/utils";

interface ProgressRingProps {
  /** 0..1 — value expressed as a fraction of the circumference. */
  value: number;
  /** Outer diameter in px. */
  size?: number;
  /** Stroke width in px. Default scales with size. */
  strokeWidth?: number;
  className?: string;
  /** Content to render at the centre (typically a big number). */
  children?: React.ReactNode;
  /** ARIA label for the ring itself. Defaults to "Progress". */
  label?: string;
  /** Colour of the moving arc. Default = orange token. */
  color?: string;
}

/**
 * A pure-SVG circular progress meter. Used by the dashboard XP tile
 * ("N XP → next level"), daily-goal tile ("today's answers vs goal"),
 * and eventually subject-accuracy rings. No dependency on chart libs —
 * the shape is trivially derivable from the value.
 *
 * Accessibility: reads as `role="progressbar"` with numeric `aria-*`
 * attributes; screen readers announce "23 out of 30" etc. even when
 * the child slot renders a decorative number.
 *
 * Motion: the arc animates on prop change via a CSS transition on
 * `stroke-dashoffset`. Guarded by `prefers-reduced-motion` — the
 * shape jumps to the new value instantly for users who opt out.
 */
export function ProgressRing({
  value,
  size = 96,
  strokeWidth,
  className,
  children,
  label = "Progress",
  color,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, value || 0));
  const stroke = strokeWidth ?? Math.max(6, Math.round(size / 12));
  const radius = size / 2 - stroke / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - clamped);
  const arcColor = color ?? "var(--orange)";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        // Rotate so the arc starts at the top rather than at 3 o'clock.
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{
            transition:
              "stroke-dashoffset 600ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="motion-reduce:!transition-none"
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}
