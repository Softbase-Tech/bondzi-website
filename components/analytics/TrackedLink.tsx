"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  trackEvent,
  type AnalyticsEventMap,
} from "@/lib/analytics";
import { useAttributedHref } from "@/lib/attribution";

type TrackedEventName = keyof AnalyticsEventMap;

interface TrackedLinkProps<K extends TrackedEventName>
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> {
  href: string;
  event: K;
  properties: AnalyticsEventMap[K];
  /** Render a plain `<a>` instead of `next/link` — for external URLs. */
  external?: boolean;
  children: ReactNode;
}

/**
 * A link that emits one typed analytics event when clicked.
 *
 * The marketing pages (`app/page.tsx`, `app/partners/page.tsx`) are
 * Server Components, and that's load-bearing — they're static, they
 * ship almost no JS, and they're the pages that need to be fast on a
 * mid-range Android over Ghanaian mobile data. Adding an `onClick` to
 * a CTA would force the whole page into a Client Component and undo
 * that.
 *
 * This is the escape hatch: an island small enough that only the link
 * itself hydrates, so an RSC page keeps its conversion tracking
 * without paying for it in bundle size.
 *
 * Tracking is fire-and-forget and deliberately not awaited — `track()`
 * uses `navigator.sendBeacon` under the hood, which survives the
 * navigation that this click is about to cause. Blocking the click on
 * a network call would make every CTA feel slower to save an event
 * that would have been delivered anyway.
 */
export function TrackedLink<K extends TrackedEventName>({
  href,
  event,
  properties,
  external = false,
  children,
  ...rest
}: TrackedLinkProps<K>) {
  // Carries utm_* / ?ref= from the current URL onto the target, so a
  // campaign survives the hop from bondzi.online to app.bondzi.online
  // where registration actually happens.
  const attributedHref = useAttributedHref(href);

  const onClick = () => {
    trackEvent(event, properties);
  };

  if (external) {
    return (
      <a href={attributedHref} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link href={attributedHref} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
