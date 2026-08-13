import Link from "next/link";
import Image from "next/image";
import { MarkdownBody } from "../partner/MarkdownBody";

/**
 * Shared shell for the public legal pages (/privacy-policy,
 * /terms-of-service, /account-deletion). Renders static Markdown content
 * baked into the site — like the /partners marketing page, it has no
 * backend dependency, so the URL is always live for an app-store reviewer.
 */
export function LegalPageView({ body }: { body: string }) {
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

        <MarkdownBody md={body} className="mt-8" />
      </div>
    </main>
  );
}
