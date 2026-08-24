"use client";

import { ArrowUpRight } from "lucide-react";
import { ENV } from "@/lib/env";
import { trackEvent } from "@/lib/analytics";
import { buildInstallReferrer } from "@/lib/attribution";

/**
 * The Android call-to-action on the marketing site.
 *
 * Two states, switched by `NEXT_PUBLIC_PLAY_STORE_URL`:
 *
 *   unset (today) — a non-linking "coming to Play Store" note.
 *   set (launch)  — a real Play Store button carrying an encoded
 *                   `referrer` so the campaign survives the install.
 *
 * Why the direct-APK link was removed rather than kept alongside: an
 * APK downloaded from a link has **no referrer channel at all**. The
 * Play Install Referrer API only fires for Play installs, so every
 * sideloaded install was arriving completely unattributed — the exact
 * blind spot this whole change exists to close. A dead-end note that
 * pushes people to the web app is more honest than a button that
 * silently loses the attribution.
 *
 * Client component because the referrer string is built from the
 * current URL and cookie, neither of which exists at build time on a
 * statically prerendered page.
 */
export function AndroidAppCta() {
  const playUrl = ENV.PLAY_STORE_URL;

  if (!playUrl) {
    return (
      <span
        className="inline-flex items-center gap-2 px-5 h-12 rounded-full border border-ink/15 text-[14px] sm:text-[15px] text-ink-mute whitespace-nowrap cursor-default"
        aria-disabled="true"
      >
        Android app — coming to Play Store
      </span>
    );
  }

  const onClick = () => {
    trackEvent("app_download_click", {
      platform: "android",
      surface: "home_get_app",
    });
  };

  // Built at click time rather than render time so the value reflects
  // the URL the visitor actually arrived on, and so a statically
  // prerendered page doesn't bake in a stale (or empty) referrer.
  const href = () => {
    const referrer = buildInstallReferrer();
    if (!referrer) return playUrl;
    const joiner = playUrl.includes("?") ? "&" : "?";
    return `${playUrl}${joiner}referrer=${encodeURIComponent(referrer)}`;
  };

  return (
    <a
      href={playUrl}
      rel="noopener"
      onClick={(e) => {
        onClick();
        // Rewrite to the referrer-tagged URL on the way out. Plain
        // navigation, so middle-click / new-tab still get the clean
        // store link rather than nothing.
        const tagged = href();
        if (tagged !== playUrl) {
          e.preventDefault();
          window.location.href = tagged;
        }
      }}
      className="inline-flex items-center gap-2 bg-ink text-bg px-5 h-12 rounded-full font-medium hover:bg-orange transition-colors whitespace-nowrap text-[14px] sm:text-[15px]"
    >
      Get it on Google Play
      <ArrowUpRight size={16} strokeWidth={2.25} />
    </a>
  );
}
