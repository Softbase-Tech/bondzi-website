import { ArrowRight } from "lucide-react";
import { TrackedLink } from "../analytics/TrackedLink";
import { appPath } from "../../lib/urls";

/**
 * Mid-article conversion box. One per post, placed after the second
 * section — deep enough that the reader has gotten value, early enough
 * that most readers still see it (blog scroll depth decays fast).
 *
 * Copy is per-post: the headline should speak to THIS article's intent
 * ("Practising Core Maths?" on the Core Maths post), never a generic
 * "download our app". Links straight to registration — the article →
 * homepage-anchor → register three-hop funnel is what this replaces.
 */
export function ArticleCta({
  headline,
  body,
  cta = "Start free",
}: {
  headline: string;
  body: string;
  cta?: string;
}) {
  return (
    <aside className="not-prose my-8 rounded-lg border border-rule bg-paper p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div>
        <p className="display text-[18px] sm:text-[20px] font-medium leading-tight text-ink m-0">
          {headline}
        </p>
        <p className="mt-1.5 text-[13.5px] text-ink-soft leading-[1.5] m-0 max-w-md">
          {body}
        </p>
      </div>
      <TrackedLink
        href={appPath("/register")}
        event="cta_click"
        properties={{ surface: "blog_article_inline", target: "register" }}
        className="inline-flex items-center justify-center gap-2 bg-orange text-on-brand px-5 h-11 rounded-full font-medium hover:bg-orange-deep transition-colors shrink-0 whitespace-nowrap text-[14px]"
      >
        {cta}
        <ArrowRight size={15} strokeWidth={2.25} />
      </TrackedLink>
    </aside>
  );
}
