import type { MetadataRoute } from "next";
import { POSTS } from "../lib/blog/posts";

const SITE_URL = "https://bondzi.online";

/**
 * Sitemap lists canonical, distinct, indexable pages only. We deliberately
 * exclude in-page anchor URLs (e.g. `/#inside`) — Google deduplicates them
 * to the homepage and treats anchor-laden sitemaps as a soft quality signal.
 *
 * New blog posts: append to `lib/blog/posts.ts` — the URL is picked up here
 * automatically on next build.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const buildTime = new Date();

  const home: MetadataRoute.Sitemap[number] = {
    url: `${SITE_URL}/`,
    lastModified: buildTime,
    changeFrequency: "weekly",
    priority: 1,
    alternates: {
      languages: { "en-GH": `${SITE_URL}/` },
    },
  };

  const blogIndex: MetadataRoute.Sitemap[number] = {
    url: `${SITE_URL}/blog`,
    lastModified: buildTime,
    changeFrequency: "weekly",
    priority: 0.9,
    alternates: {
      languages: { "en-GH": `${SITE_URL}/blog` },
    },
  };

  const blogPosts: MetadataRoute.Sitemap = POSTS.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt ?? p.publishedAt),
    changeFrequency: "monthly",
    priority: 0.8,
    alternates: {
      languages: { "en-GH": `${SITE_URL}/blog/${p.slug}` },
    },
  }));

  return [home, blogIndex, ...blogPosts];
}
