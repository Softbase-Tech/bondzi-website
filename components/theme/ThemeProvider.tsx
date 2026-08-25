"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  THEME_STORAGE_KEY,
  isProductSurface,
  resolveTheme,
  type ThemePreference,
} from "./theme-script";

interface ThemeContextValue {
  /** What the user chose. `system` follows the OS. */
  preference: ThemePreference;
  /** What is actually on screen right now. */
  resolved: "light" | "dark";
  /** Whether this surface offers dark mode at all. */
  available: boolean;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/* ---------------------------------------------------------------------------
 * The preference lives in localStorage and the OS, not in React.
 *
 * `useSyncExternalStore` is the right primitive for exactly that: it reads
 * genuinely external mutable state, gives a server snapshot for SSR, and
 * re-renders on change — without the mount-effect `setState` dance, which
 * both cascades renders and briefly shows the wrong value.
 * ------------------------------------------------------------------------- */

const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // The OS theme can change while the tab is open; when the preference
  // is `system` that has to repaint.
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", emit);
  // Another tab on the same origin may have changed the preference.
  window.addEventListener("storage", emit);
  return () => {
    listeners.delete(onChange);
    mq.removeEventListener("change", emit);
    window.removeEventListener("storage", emit);
  };
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Private mode / blocked storage.
  }
  return "system";
}

/** SSR has no storage and no OS signal — assume the default. */
const serverPreference = (): ThemePreference => "system";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    serverPreference,
  );

  // Whether dark mode is offered here at all. Server-rendered as `false`
  // so the markup matches a light first paint; the head script has
  // already applied the real class by the time this runs.
  const available = useSyncExternalStore(
    subscribe,
    () => isProductSurface(window.location.hostname, pathname),
    () => false,
  );

  const resolved: "light" | "dark" = useSyncExternalStore(
    subscribe,
    () =>
      isProductSurface(window.location.hostname, pathname)
        ? resolveTheme(readPreference())
        : "light",
    () => "light",
  );

  // Push the resolved theme onto <html>. This is the one legitimate
  // effect here: syncing React state OUT to an external system (the
  // DOM), which is what effects are for — no setState involved.
  //
  // It also covers client-side navigation, which does not re-run the
  // head script. In production the marketing and product hosts are
  // separate origins so every crossing is a full page load, but on
  // localhost they share one — without this, walking from /dashboard to
  // / in dev would drag the dark class onto the marketing page.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Non-fatal: the choice just won't survive a reload.
    }
    emit();
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, available, setPreference }),
    [preference, resolved, available, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}
