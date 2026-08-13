import { ENV } from "../env";

export interface LegalPageContent {
  slug: string;
  title: string;
  body: string;
}

/**
 * Public legal-page content, authored in Admin → Legal and served by the
 * backend at GET /legal/:slug (no auth). Cached at the edge and revalidated
 * hourly so admin edits propagate without a redeploy. Returns null on any
 * failure so the page can fall back gracefully rather than error.
 */
export async function getLegalPage(
  slug: string,
): Promise<LegalPageContent | null> {
  try {
    const base = ENV.API_URL.replace(/\/+$/, "");
    const res = await fetch(`${base}/legal/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<LegalPageContent>;
    if (!data?.body) return null;
    return { slug, title: data.title ?? slug, body: data.body };
  } catch {
    return null;
  }
}
