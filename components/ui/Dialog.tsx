"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  /**
   * Set false to remove the close (X) button — for flows where the
   * user must complete an action to dismiss (e.g. mandatory
   * username picker).
   */
  showCloseButton?: boolean;
  children?: ReactNode;
}

/**
 * Centered modal dialog. Use for confirmations, small forms, and
 * anything that shouldn't feel bottom-sheet-heavy. On mobile it stays
 * centered but shrinks the max width — for a mobile-first sheet-style
 * behaviour, prefer `<Sheet>`.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  showCloseButton = true,
  children,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-scrim backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=open]:fade-in",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out",
          )}
        />
        <RadixDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-[min(calc(100vw-2rem),28rem)]",
            "bg-paper rounded-2xl border border-rule",
            "shadow-[0_20px_60px_-20px_rgba(20,20,20,0.35)]",
            "focus:outline-none",
            // Motion — gentle scale + fade, respects reduced motion.
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in data-[state=closed]:fade-out",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          )}
        >
          {(title || description) && (
            <div className="px-6 pt-5 pb-1">
              {title ? (
                <RadixDialog.Title className="font-display text-[20px] leading-tight text-ink">
                  {title}
                </RadixDialog.Title>
              ) : null}
              {description ? (
                <RadixDialog.Description className="mt-1 text-[14px] text-ink-soft">
                  {description}
                </RadixDialog.Description>
              ) : null}
            </div>
          )}
          <div className="px-6 py-4">{children}</div>
          {showCloseButton ? (
            <RadixDialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className={cn(
                  "absolute top-3 right-3",
                  "inline-flex items-center justify-center",
                  "h-9 w-9 rounded-full text-ink-mute",
                  "hover:bg-yellow-soft/60 hover:text-ink",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange",
                  "transition-colors motion-reduce:transition-none",
                )}
              >
                <X size={18} />
              </button>
            </RadixDialog.Close>
          ) : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/**
 * Convenience footer for dialogs that end in one or two action buttons.
 * Buttons stack on mobile (full width), align right on desktop.
 */
export const DialogActions = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(
  function DialogActions({ children, className }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "mt-4 flex flex-col-reverse gap-2",
          "sm:flex-row sm:justify-end",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);
