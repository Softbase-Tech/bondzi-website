"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { verifySubscription } from "@/lib/api/subscription";

const MAX_ATTEMPTS = 8;
const INTERVAL_MS = 2000;

/**
 * Polls the backend when the client's initial verify() failed but
 * Paystack accepted the charge. Waits for the webhook to activate the
 * subscription and reloads the page (server component re-fetches
 * `/subscriptions/me` and paints the resolved state).
 *
 * Caps at 8 attempts × 2s = 16s total. After that we stop and let the
 * user click "refresh" manually — long tail is almost always a real
 * problem the user needs to hear about, not a webhook delay.
 */
export function SuccessRefresher({ reference }: { reference?: string }) {
  const router = useRouter();
  const attempts = useRef(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!reference || done) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      attempts.current += 1;
      try {
        // Verify is idempotent; if webhook has already fired, backend
        // returns the resolved subscription.
        const sub = await verifySubscription(reference);
        if (sub.status === "active" || sub.status === "xp_credited") {
          setDone(true);
          router.refresh();
          return;
        }
      } catch {
        // Ignore — we'll retry.
      }
      if (attempts.current < MAX_ATTEMPTS && !cancelled) {
        window.setTimeout(tick, INTERVAL_MS);
      } else {
        setDone(true);
      }
    };
    const first = window.setTimeout(tick, INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
    };
  }, [reference, router, done]);

  return null;
}
