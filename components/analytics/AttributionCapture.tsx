"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureAttribution } from "@/lib/attribution";

/**
 * Runs first-touch attribution capture on every navigation.
 *
 * Mounted once in the root layout, so it covers all three hosts —
 * bondzi.online, app.bondzi.online and partners.bondzi.online. A
 * partner link (`?ref=`) works wherever it's pasted, and a campaign
 * link works even if it points straight at a deep page rather than the
 * homepage.
 *
 * Keyed on pathname + searchParams rather than mounting once: the App
 * Router keeps this component alive across client-side navigations, so
 * a bare `[]` dependency would miss a student who lands on `/` and
 * then follows an in-app link that carries its own tags.
 *
 * `useSearchParams` forces a Suspense boundary or the whole tree opts
 * out of static rendering — the parent wraps this in `<Suspense>`,
 * which keeps the marketing pages prerendered.
 */
export function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureAttribution();
  }, [pathname, searchParams]);

  return null;
}
