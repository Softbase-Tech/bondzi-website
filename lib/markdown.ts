import { marked } from "marked";

/**
 * Markdown → HTML for question/option/stimulus/explanation `text`
 * fields.
 *
 * Trust model:
 *   - The `text` value comes from the backend serializer
 *     (`inlineMathInMarkdown(q.body)`). It's markdown, with `$...$`
 *     math ALREADY expanded to inline SVG data URIs
 *     (`![](data:image/svg+xml;utf8,...)`).
 *   - We render the surrounding markdown to HTML and pass it to
 *     `dangerouslySetInnerHTML`. That's safe because backend content
 *     is trusted (never user-authored) and the SVG data URIs are
 *     server-generated.
 *
 * Config decisions:
 *   - GFM ON — so line breaks and tables from the item bank render.
 *   - `breaks: true` — a single newline becomes `<br>`, matching how
 *     exam papers use manual line breaks in stems.
 *   - Sync mode (`async: false`) — we're rendering on the client, in
 *     a hot render path, and the input is small.
 */
marked.setOptions({
  gfm: true,
  breaks: true,
  async: false,
});

export function renderMarkdown(source: string | null | undefined): string {
  if (!source) return "";
  return marked.parse(source) as string;
}
