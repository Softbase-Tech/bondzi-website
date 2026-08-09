import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { PostMeta } from "../../lib/blog/posts";

interface Props {
  post: PostMeta;
  children: React.ReactNode;
}

/**
 * Editorial wrapper used by every blog post. Provides:
 *  - Breadcrumb back to /blog
 *  - Article header with kicker, h1, meta line, tag list
 *  - `prose` body container styled for serif headings + readable measure
 *  - Footer cross-link back to the app
 */
export function ArticleLayout({ post, children }: Props) {
  return (
    <main id="main" className="bg-bg text-ink">
      <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur border-b border-rule">
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
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={2.25} />
            <span className="hidden sm:inline">All articles</span>
            <span className="sm:hidden">Articles</span>
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-[760px] px-5 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16 sm:pb-24">
        <div className="kicker mb-3 sm:mb-4">
          Bondzi Journal · {formatDate(post.publishedAt)}
        </div>
        <h1 className="display text-[28px] sm:text-[40px] md:text-[44px] lg:text-[54px] font-medium leading-[1.07] text-ink">
          {post.title}
        </h1>
        <p className="mt-5 sm:mt-6 text-[16px] sm:text-[18px] leading-[1.55] text-ink-soft">
          {post.excerpt}
        </p>
        <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-2 text-[12px] text-ink-mute">
          <span>{post.readMinutes} min read</span>
          {post.tags.map((t) => (
            <span
              key={t}
              className="inline-block px-2 py-0.5 rounded-full bg-yellow-soft text-ink"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-9 sm:mt-12 prose-bondzi">{children}</div>

        <hr className="mt-12 sm:mt-16 border-rule" />

        <div className="mt-10 sm:mt-12 paper-card rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 justify-between">
          <div>
            <div className="kicker">From the makers</div>
            <h3 className="display text-[20px] sm:text-[24px] font-medium mt-2 leading-tight">
              Practice what you just read about.
            </h3>
            <p className="mt-2 text-[14px] text-ink-soft max-w-md leading-[1.5]">
              Bondzi is the WAEC, WASSCE and BECE prep app behind this journal.
              Free to download, AI tutor on every wrong answer.
            </p>
          </div>
          <Link
            href="/#get"
            className="inline-flex items-center justify-center gap-2 bg-orange text-paper px-5 h-12 rounded-full font-medium hover:bg-orange-deep transition-colors shrink-0 whitespace-nowrap"
          >
            Get Bondzi App
            <ArrowUpRight size={16} strokeWidth={2.25} />
          </Link>
        </div>
      </article>

      <footer className="border-t border-rule bg-bg">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-8 sm:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/brand/icon.png"
              alt=""
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="display text-[22px] font-medium">Bondzi</span>
          </Link>
          <div className="text-[13px] text-ink-mute">
            © 2026 Bondzi · Cliffbase Tech, Ghana
          </div>
        </div>
      </footer>
    </main>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
