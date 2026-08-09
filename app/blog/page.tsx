import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, ArrowRight } from "lucide-react";
import { postsSortedByDate } from "../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../lib/blog/jsonld";

export const metadata: Metadata = {
  title: "Bondzi Journal — WAEC, WASSCE & BECE study guides",
  description:
    "Practical guides on WASSCE timetables, WAEC results checking, Nov/Dec registration, subject syllabi, and BECE prep — written by the team building Bondzi for Ghanaian students.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Bondzi Journal — WAEC, WASSCE & BECE study guides",
    description:
      "Guides on WAEC, WASSCE and BECE — timetable, results, Nov/Dec registration, subject syllabi.",
    type: "website",
    url: "/blog",
  },
};

export default function BlogIndex() {
  const posts = postsSortedByDate();

  // Each nested BlogPosting reuses the same helper as the per-article pages —
  // that way the index's Blog schema and the individual article schemas stay
  // in lock-step. The `@context` ends up repeated at the inner level; the
  // Schema.org spec and Google's parser both accept that, and it keeps the
  // nested objects valid in isolation when crawlers sample them.
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Bondzi Journal",
    url: "https://bondzi.online/blog",
    description:
      "Guides on WAEC, WASSCE and BECE for Ghanaian students — written by the team building Bondzi.",
    inLanguage: "en-GH",
    publisher: {
      "@type": "Organization",
      name: "Softbase Tech",
      logo: {
        "@type": "ImageObject",
        url: "https://bondzi.online/brand/icon.png",
        width: 512,
        height: 512,
      },
    },
    blogPost: posts.map((p) => buildBlogPostingJsonLd(p)),
  };

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
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={2.25} />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Home</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 pt-10 sm:pt-14 lg:pt-20 pb-8 sm:pb-12">
        <div className="kicker mb-5 sm:mb-6 flex items-center gap-3 flex-wrap">
          <span className="inline-block w-6 h-px bg-ink-mute" />
          Bondzi Journal · Issue 01
        </div>
        <h1 className="display text-[36px] sm:text-[52px] md:text-[60px] lg:text-[76px] font-medium text-ink leading-[1.02]">
          Guides on WAEC,
          <br />
          WASSCE and BECE.
        </h1>
        <p className="mt-6 sm:mt-8 max-w-2xl text-[15.5px] sm:text-[17px] leading-[1.6] text-ink-soft">
          Practical, no-fluff writing on the exams that decide a Ghanaian
          student&apos;s next chapter. Timetables, registration, subject
          syllabi, study habits — answered by the team building the app.
        </p>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 pb-16 sm:pb-24">
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-rule border border-rule">
          {posts.map((p) => (
            <li key={p.slug} className="bg-paper">
              <Link
                href={`/blog/${p.slug}`}
                className="block p-6 sm:p-8 lg:p-10 h-full hover:bg-yellow-soft transition-colors"
              >
                <div className="kicker mb-3 sm:mb-4">
                  {formatDate(p.publishedAt)} · {p.readMinutes} min
                </div>
                <h2 className="display text-[20px] sm:text-[22px] lg:text-[26px] font-medium leading-tight text-ink">
                  {p.title}
                </h2>
                <p className="mt-3 sm:mt-4 text-[14px] sm:text-[14.5px] text-ink-soft leading-[1.6]">
                  {p.excerpt}
                </p>
                <div className="mt-4 sm:mt-6 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-yellow-soft text-ink"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-5 sm:mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-orange">
                  Read article
                  <ArrowRight size={14} strokeWidth={2.25} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-rule">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-12 sm:py-16">
          <div className="paper-card rounded-lg p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row md:items-center gap-5 sm:gap-6 justify-between">
            <div>
              <div className="kicker">The app</div>
              <h2 className="display text-[24px] sm:text-[28px] font-medium mt-2 leading-tight">
                Reading is good. Practising is better.
              </h2>
              <p className="mt-3 text-[14px] text-ink-soft max-w-xl leading-[1.55]">
                Every guide here is grounded in the same question bank the
                Bondzi app uses. Get the app to turn what you&apos;ve read into
                drilled, scored, spaced-repeated practice.
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
        </div>
      </section>

      <footer className="border-t border-rule bg-bg">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-8 sm:py-10 text-[13px] text-ink-mute">
          © 2026 Bondzi · Softbase Tech, Ghana
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
    </main>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
