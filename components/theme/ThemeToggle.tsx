"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import type { ThemePreference } from "./theme-script";

const OPTIONS: {
  key: ThemePreference;
  label: string;
  Icon: typeof Sun;
}[] = [
  { key: "light", label: "Light", Icon: Sun },
  { key: "dark", label: "Dark", Icon: Moon },
  { key: "system", label: "System", Icon: Monitor },
];

/**
 * Three-state theme control: Light / Dark / System.
 *
 * System is offered explicitly rather than inferred, because "follow my
 * phone" is a real preference and collapsing it into a two-way toggle
 * silently pins whatever the OS happened to be at the moment of the tap.
 *
 * Renders nothing on surfaces where dark mode isn't offered (the
 * marketing site), so the same header component can be used everywhere.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { preference, available, setPreference } = useTheme();
  if (!available) return null;

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-rule bg-paper p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ key, label, Icon }) => {
        const active = preference === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setPreference(key)}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange",
              active
                ? "bg-yellow-soft text-orange"
                : "text-ink-mute hover:text-ink",
            )}
          >
            <Icon size={14} strokeWidth={2.25} />
          </button>
        );
      })}
    </div>
  );
}
