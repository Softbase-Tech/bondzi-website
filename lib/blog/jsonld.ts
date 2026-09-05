import type { PostMeta } from "./posts";

const SITE_URL = "https://bondzi.online";
const PUBLISHER = {
  "@type": "Organization",
  name: "Cliffbase Technologies",
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/brand/icon.png`,
    width: 512,
    height: 512,
  },
};

/**
 * Convert a manifest date (YYYY-MM-DD) into a full ISO 8601 datetime in UTC.
 * Google's structured-data validator rejects date-only strings on
 * `datePublished` / `dateModified`, even though Schema.org technically allows
 * `Date`. Always emit `Date.toISOString()` form.
 */
function toIsoDateTime(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toISOString();
}

/**
 * Build the BlogPosting JSON-LD for a given post. Centralised so all five
 * articles emit identical shapes — fixing one shape fixes all of them.
 *
 * Required by Google for the Article rich result: headline, image,
 * datePublished, author, publisher. Adding `url`, `dateModified`, and
 * `mainEntityOfPage` makes the snippet eligible for more features.
 */
export function buildBlogPostingJsonLd(post: PostMeta) {
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url: canonicalUrl,
    // 1200x630 — the dynamic OG image generated at /opengraph-image; valid
    // for the 1.91:1 aspect-ratio requirement of the Article rich result.
    image: [`${SITE_URL}/opengraph-image`],
    datePublished: toIsoDateTime(post.publishedAt),
    dateModified: toIsoDateTime(post.updatedAt ?? post.publishedAt),
    author: {
      "@type": "Organization",
      name: "Bondzi",
      url: SITE_URL,
    },
    publisher: PUBLISHER,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    inLanguage: "en-GH",
    keywords: post.tags.join(", "),
    articleSection: post.tags[0] ?? "Education",
    wordCount: post.readMinutes * 220,
  };
}
