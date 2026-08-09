import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: ReactNode;
  error?: string | null;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
}

/**
 * Text input tuned for mobile browsers first.
 *
 * The invariants that matter:
 *   - `text-[16px]` — Safari on iOS auto-zooms into any input whose
 *     computed font-size is <16px. This kills the mobile UX in a way
 *     desktop devs miss.
 *   - `min-h-12` — 48px tap target with room for a floating label style
 *     if we adopt one later. Comfortable for adults on small screens.
 *   - `enterkeyhint` inheritable — callers pass `enterKeyHint="next"` /
 *     `"go"` etc. to control the mobile keyboard's action button
 *     copy (huge polish win, near-zero cost).
 *   - Label + input associated via `htmlFor` / `id`. Screen readers
 *     announce the label; native <label> handles the tap-to-focus.
 *   - Error state is coloured AND described-by so it reaches assistive
 *     tech, not just sighted users.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leftAdornment,
    rightAdornment,
    id,
    className,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className="block text-[13px] font-medium text-ink-soft mb-1.5"
        >
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "relative flex items-center",
          "rounded-xl border bg-paper",
          "transition-[border-color,box-shadow] duration-150",
          error
            ? "border-red-500 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-200"
            : "border-rule-strong focus-within:border-orange focus-within:ring-2 focus-within:ring-orange/20",
        )}
      >
        {leftAdornment ? (
          <span className="pl-3 text-ink-mute flex items-center">
            {leftAdornment}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex-1 min-w-0 bg-transparent",
            "min-h-12 px-3.5 py-2.5",
            // 16px prevents iOS Safari auto-zoom-on-focus. Non-negotiable.
            "text-[16px] leading-tight text-ink",
            "placeholder:text-ink-mute",
            "outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            leftAdornment && "pl-2",
            rightAdornment && "pr-2",
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {rightAdornment ? (
          <span className="pr-3 text-ink-mute flex items-center">
            {rightAdornment}
          </span>
        ) : null}
      </div>
      {error ? (
        <p
          id={errorId}
          className="mt-1.5 text-[12.5px] font-medium text-red-600"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-[12.5px] text-ink-mute">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
