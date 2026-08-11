import { marked } from "marked";

/**
 * Server-only markdown → HTML renderer for the partner terms body
 * (and any future admin-authored copy). Applies the same GFM +
 * hard-line-breaks settings so an admin authoring in a plain
 * textarea gets the paragraph breaks they expect.
 *
 * Renders inside a `<div>` styled with Tailwind arbitrary-descendant
 * selectors — no @tailwindcss/typography dependency, no globals.css
 * edit, no runtime prose class registration.
 *
 * Security: the input is admin-authored (backend
 * `PartnerTermsService.createNewVersion`), never partner-editable,
 * so `dangerouslySetInnerHTML` here is safe. If the origin of this
 * markdown ever widens (e.g. partner-authored appeal bodies), add a
 * DOMPurify pass before rendering.
 */
export function MarkdownBody({
  md,
  className = "",
}: {
  md: string | null | undefined;
  className?: string;
}) {
  if (!md) return null;
  const html = marked.parse(md, {
    async: false,
    gfm: true,
    breaks: true,
  }) as string;
  return (
    <div
      className={
        // Base type + spacing.
        "text-[13.5px] leading-[1.65] text-ink-soft space-y-3 " +
        // Headings.
        "[&_h1]:text-[19px] [&_h1]:font-semibold [&_h1]:text-ink [&_h1]:mt-2 [&_h1]:mb-1 " +
        "[&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:mt-5 [&_h2]:mb-1.5 " +
        "[&_h3]:text-[14.5px] [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:mt-4 [&_h3]:mb-1 " +
        // Paragraphs + inline emphasis.
        "[&_p]:my-1.5 " +
        "[&_strong]:font-semibold [&_strong]:text-ink " +
        "[&_em]:italic " +
        "[&_a]:text-orange [&_a]:underline hover:[&_a]:text-orange-deep " +
        "[&_code]:font-mono [&_code]:text-[12.5px] [&_code]:bg-yellow-soft/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded " +
        // Lists.
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 " +
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 " +
        "[&_li]:my-1 " +
        // Blockquotes.
        "[&_blockquote]:border-l-2 [&_blockquote]:border-orange/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-ink-mute " +
        // Horizontal rules.
        "[&_hr]:border-t [&_hr]:border-rule [&_hr]:my-4 " +
        className
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
