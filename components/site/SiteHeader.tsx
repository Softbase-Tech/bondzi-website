"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { appPath } from "@/lib/urls";
import { trackEvent } from "@/lib/analytics";

export interface NavItem {
  label: string;
  href: string;
}

interface Props {
  items: NavItem[];
}

/**
 * Marketing-page header with a hamburger-driven slide-down panel below the
 * `md` breakpoint. Desktop view is unchanged — full nav inline + a "Get the
 * app" pill on the right.
 *
 * Lives as its own client component so the rest of the page can stay a
 * Server Component (no client hydration cost for the static sections).
 */
export function SiteHeader({ items }: Props) {
  const [open, setOpen] = useState(false);
  // NextAuth session — used to swap the header CTAs between
  // "Sign in / Get started" (public) and "Open app" (authed) so a
  // returning user doesn't see irrelevant CTAs on the landing page.
  // Session hook is client-only; during SSR the header renders the
  // public state which is fine — hydration replaces it once the
  // browser knows.
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  // Close the menu on Escape and lock body scroll while it's open so the
  // page doesn't scroll behind the overlay on iOS Safari.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70 border-b border-rule">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link
          href="/"
          aria-label="Bondzi home"
          className="flex items-center gap-2.5"
        >
          <Image
            src="/brand/icon.png"
            alt=""
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="display text-[22px] font-medium tracking-tight">
            Bondzi
          </span>
        </Link>

        {/* Desktop nav (md+) */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-8 text-[14px] text-ink-soft">
          {items.map((item) =>
            item.href.startsWith("/") ? (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-ink transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-ink transition-colors"
              >
                {item.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          {/* Desktop CTAs.
              - Public: Sign in (ghost) + Get started (primary pill).
              - Authed: Open app (primary pill) — no reason to show
                sign-in when you're already signed in.
              Both routes are Next.js Links so hover-prefetch is on for
              the app entry point — the tap-to-in-app is faster than a
              full page load. */}
          {isAuthed ? (
            <Link
              href={appPath("/dashboard")}
              onClick={() =>
                trackEvent("cta_click", { surface: "header", target: "open_app" })
              }
              className="hidden md:inline-flex items-center gap-1.5 bg-ink text-bg px-4 h-10 rounded-full text-[13px] font-medium hover:bg-orange transition-colors"
            >
              Open app
              <ArrowUpRight size={14} strokeWidth={2.25} />
            </Link>
          ) : (
            <>
              <Link
                href={appPath("/login")}
                onClick={() =>
                  trackEvent("cta_click", { surface: "header", target: "signin" })
                }
                className="hidden md:inline-flex items-center h-10 px-3 rounded-full text-[13px] font-medium text-ink-soft hover:text-ink hover:bg-yellow-soft/60 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href={appPath("/register")}
                onClick={() =>
                  trackEvent("cta_click", { surface: "header", target: "register" })
                }
                className="hidden md:inline-flex items-center gap-1.5 bg-ink text-bg px-4 h-10 rounded-full text-[13px] font-medium hover:bg-orange transition-colors"
              >
                Get started
                <ArrowUpRight size={14} strokeWidth={2.25} />
              </Link>
            </>
          )}

          {/* Hamburger (mobile only) */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-md text-ink hover:bg-ink/5 active:bg-ink/10 transition-colors"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Slide-down panel */}
      <div
        id="mobile-menu"
        className={`md:hidden border-b border-rule bg-bg overflow-hidden transition-[max-height] duration-300 ease-out ${
          open ? "max-h-[420px]" : "max-h-0"
        }`}
      >
        <nav className="px-5 sm:px-6 py-3 flex flex-col">
          {items.map((item) =>
            item.href.startsWith("/") ? (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="px-3 py-3 text-[15px] font-medium text-ink rounded-md hover:bg-ink/5 active:bg-ink/10"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                onClick={close}
                className="px-3 py-3 text-[15px] font-medium text-ink rounded-md hover:bg-ink/5 active:bg-ink/10"
              >
                {item.label}
              </a>
            ),
          )}
          {/* Mobile CTAs — same swap as desktop. Stacked so tap
              targets stay generous. */}
          {isAuthed ? (
            <Link
              href={appPath("/dashboard")}
              onClick={() => {
                trackEvent("cta_click", { surface: "header", target: "open_app" });
                close();
              }}
              className="mt-2 mb-1 inline-flex items-center justify-center gap-1.5 bg-ink text-bg h-12 rounded-full text-[14px] font-medium"
            >
              Open app
              <ArrowUpRight size={15} strokeWidth={2.25} />
            </Link>
          ) : (
            <>
              <Link
                href={appPath("/register")}
                onClick={() => {
                  trackEvent("cta_click", { surface: "header", target: "register" });
                  close();
                }}
                className="mt-2 inline-flex items-center justify-center gap-1.5 bg-ink text-bg h-12 rounded-full text-[14px] font-medium"
              >
                Get started
                <ArrowUpRight size={15} strokeWidth={2.25} />
              </Link>
              <Link
                href={appPath("/login")}
                onClick={() => {
                  trackEvent("cta_click", { surface: "header", target: "signin" });
                  close();
                }}
                className="mt-2 mb-1 inline-flex items-center justify-center h-12 rounded-full text-[14px] font-medium text-ink border border-rule-strong hover:bg-yellow-soft/60"
              >
                Sign in
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Backdrop — closes the menu on tap, doesn't dim the screen */}
      {open ? (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={close}
          className="md:hidden fixed inset-0 top-[var(--menu-bottom,9rem)] z-30 bg-transparent cursor-default"
        />
      ) : null}
    </header>
  );
}
