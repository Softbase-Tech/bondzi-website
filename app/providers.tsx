"use client";

import { useState, type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

/**
 * Client-side providers mounted once at the root layout. Kept minimal:
 * everything else composes on top.
 *
 *   - `SessionProvider` — makes `useSession()` work anywhere; the
 *     `refetchOnWindowFocus` refresh is important for keeping the
 *     session's access token fresh when a user tabs back after a
 *     long idle.
 *   - `QueryClientProvider` — the single source of network state.
 *     Configured with defaults tuned for exam-prep browsing (long
 *     stale times on relatively-static content, network-mode
 *     "offlineFirst" so a spotty 3G doesn't blank the page).
 *   - `Toaster` (sonner) — top-center on mobile, top-right on desktop.
 *     Duration and stacking match a "professional" feel — no
 *     jarring pop-ins.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 24 * 60 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
            networkMode: "offlineFirst",
          },
          mutations: {
            retry: 0,
            networkMode: "offlineFirst",
          },
        },
      }),
  );

  return (
    <SessionProvider
      // Refetch the session every 5 minutes so a slow leaky JWT
      // callback (e.g. background tab) doesn't leave the access
      // token to expire without rotation.
      refetchInterval={5 * 60}
      refetchOnWindowFocus
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-center"
          richColors
          expand={false}
          duration={3500}
          toastOptions={{
            style: {
              // Match the site's paper/ink tokens by default. Sonner
              // takes plain CSS; we use var() so light/dark parity
              // can come later without touching every toast site.
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--rule)",
              fontFamily: "var(--font-geist-sans)",
              fontSize: "14px",
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
