"use client";

import { type ReactNode } from "react";
import { Drawer as Vaul } from "vaul";
import { cn } from "@/lib/utils";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional title — rendered as the sheet's accessible name for screen readers. */
  title?: string;
  /** Optional description — announced below the title for screen readers. */
  description?: string;
  /** Prevents closing by tapping the backdrop or dragging down. */
  dismissible?: boolean;
  /** Snap points for a partially-open state (mobile-native feel). Provide as fractions of viewport height. */
  snapPoints?: (number | string)[];
  children?: ReactNode;
}

/**
 * Mobile-native bottom sheet with graceful desktop fallback.
 *
 * On mobile (touch, <768px) it behaves like a native iOS/Android sheet
 * — swipe-down to dismiss, respects the safe-area inset, backdrop
 * fade. On desktop it centres and shrinks into a modal-style card so
 * the same component composes across breakpoints.
 *
 * Built on `vaul` (the drawer library the shadcn/ui ecosystem
 * standardised on) — accessible, gesture-perfect, and small. We wrap
 * it here so the rest of the codebase never has to think about
 * `vaul`'s API.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  dismissible = true,
  snapPoints,
  children,
}: SheetProps) {
  return (
    <Vaul.Root
      open={open}
      onOpenChange={onOpenChange}
      dismissible={dismissible}
      snapPoints={snapPoints}
    >
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <Vaul.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col",
            "rounded-t-2xl bg-paper",
            "max-h-[92dvh]",
            // Safe area for iPhone bottom bezel.
            "pb-[env(safe-area-inset-bottom,0)]",
            "shadow-[0_-8px_32px_-8px_rgba(20,20,20,0.15)]",
            // Desktop: recenter into a modal-style card.
            "md:inset-x-auto md:left-1/2 md:bottom-auto md:top-1/2",
            "md:-translate-x-1/2 md:-translate-y-1/2",
            "md:w-full md:max-w-lg md:rounded-2xl",
            "md:max-h-[85vh]",
          )}
        >
          {/* Drag handle — hidden on desktop where the sheet is fixed. */}
          <div
            aria-hidden="true"
            className={cn(
              "mx-auto my-3 h-1.5 w-10 rounded-full bg-rule-strong/60",
              "md:hidden",
            )}
          />
          {(title || description) && (
            <div className="px-6 pt-2 pb-1">
              {title ? (
                <Vaul.Title className="font-display text-[20px] leading-tight text-ink">
                  {title}
                </Vaul.Title>
              ) : null}
              {description ? (
                <Vaul.Description className="mt-1 text-[14px] text-ink-soft">
                  {description}
                </Vaul.Description>
              ) : null}
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}
