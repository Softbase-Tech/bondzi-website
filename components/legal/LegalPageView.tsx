import Link from "next/link";
import Image from "next/image";
import { MarkdownBody } from "../partner/MarkdownBody";

/**
 * Shared shell for the public legal pages (/privacy-policy,
 * /terms-of-service, /account-deletion). Renders admin-authored markdown
 * from the backend, with a graceful fallback when the content can't be
 * fetched so the URL is never blank for an app-store reviewer.
 */
export function LegalPageView({
  title,
  body,
  fallbackHref = "mailto:info@bondzi.online",
}: {
  title: string;
  body: string | null;
  fallbackHref?: string;
}) {
  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-[760px] px-5 sm:px-6 py-10 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] text-ink-soft hover:text-ink"
        >
          <Image
            src="/brand/icon.png"
            alt=""
            width={22}
            height={22}
            className="rounded"
          />
          Bondzi
        </Link>

        {body ? (
          <MarkdownBody md={body} className="mt-8" />
        ) : (
          <div className="mt-8">
            <h1 className="text-[22px] font-semibold text-ink">{title}</h1>
            <p className="mt-4 text-[13.5px] leading-[1.65] text-ink-soft">
              This page is temporarily unavailable. Please reach us at{" "}
              <a
                href={fallbackHref}
                className="text-orange underline hover:text-orange-deep"
              >
                info@bondzi.online
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
