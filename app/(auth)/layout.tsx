import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * Layout for the (auth) route group — /login, /register, /forgot-password,
 * /reset-password, /verify-email. Deliberately spare so the form itself is
 * the focus. On mobile the header collapses to just the logo; on desktop
 * we add a "Back to site" link.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <header className="w-full">
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
            <span className="display text-[22px] font-medium tracking-tight text-ink">
              Bondzi
            </span>
          </Link>
          <Link
            href="/"
            className="text-[13px] font-medium text-ink-soft hover:text-ink transition-colors"
          >
            Back to home
          </Link>
        </div>
      </header>
      <main
        id="main"
        className="flex-1 flex items-start sm:items-center justify-center px-5 sm:px-6 py-4 sm:py-8"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="w-full py-6 text-center text-[12px] text-ink-mute">
        © {new Date().getFullYear()} Bondzi · Cliffbase Tech
      </footer>
    </div>
  );
}
