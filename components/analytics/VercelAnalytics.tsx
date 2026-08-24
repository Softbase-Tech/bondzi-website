"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { redactAnalyticsUrl } from "@/lib/analytics";

/**
 * Vercel Web Analytics, mounted once in the root layout.
 *
 * This exists as a client component for one reason: `beforeSend` is a
 * function, and functions can't cross the server/client boundary as
 * props. The bare `<Analytics />` can be rendered from a Server
 * Component only because it takes no function props — the moment you
 * need redaction, it has to move.
 *
 * `beforeSend` runs in the browser on every pageview and custom event
 * before the beacon leaves the page. Returning `null` drops the event
 * entirely; returning a modified event sends the modified one.
 *
 * Why we need it here: this project serves three hosts off one Next
 * app, and several routes carry sensitive data in the query string —
 *
 *   /reset-password?email=…&phone=…        (PII)
 *   /partner/reset-password?email=…        (PII)
 *   /subscription/success?reference=…      (Paystack payment reference)
 *   /help/tickets/new?subject=…&body=…     (free text the student typed)
 *   /login?returnTo=…                      (nested path, high cardinality)
 *
 * — none of which should end up in a third-party analytics store. The
 * allowlist lives in `lib/analytics.ts`.
 *
 * Path segments are NOT touched here. `@vercel/analytics/next` already
 * derives a normalised `route` from Next's own route params, so
 * `/exam/9f1b…/result` is reported as `/exam/[examId]/result` without
 * any help from us.
 */
export function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event: BeforeSendEvent) => {
        const url = redactAnalyticsUrl(event.url);
        // Return the original object when nothing changed so the SDK
        // isn't handed a needless copy on every single pageview.
        return url === event.url ? event : { ...event, url };
      }}
    />
  );
}
