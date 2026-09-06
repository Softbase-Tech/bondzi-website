"use client";

import { useEffect, useRef } from "react";
import { trackEvent, type AdPlacement } from "@/lib/analytics";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * One AdSense display unit. The loader script ships globally from the
 * root layout; this component only renders the <ins> container and
 * requests a fill. Placement on/off and slot ids come from the admin
 * (`web_ads` config) — this component never decides WHERE ads go.
 *
 * The "Advertisement" label is deliberate: on a study product, an
 * unlabelled ad erodes more trust than the impression earns.
 */
export function AdSlot({
  publisherId,
  slotId,
  placement,
}: {
  publisherId: string;
  slotId: string;
  placement: AdPlacement;
}) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const ins = insRef.current;
    if (!ins) return;
    // Dev strict-mode / re-render guard: AdSense marks a filled slot
    // with data-ad-status; pushing again throws.
    if (ins.getAttribute("data-ad-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      trackEvent("ad_impression", { placement });
    } catch {
      // Blocked loader (ad blocker) or double-push — never break the page.
    }
  }, [placement]);

  return (
    <div className="not-prose my-8">
      <div className="text-[10px] font-medium uppercase tracking-widest text-ink-mute mb-1.5">
        Advertisement
      </div>
      <ins
        ref={insRef}
        className="adsbygoogle block"
        style={{ display: "block", minHeight: 90 }}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
