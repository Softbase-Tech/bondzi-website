import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getFaqEntry } from "@/lib/api/faq";
import { renderMarkdown } from "@/lib/markdown";

/**
 * FAQ answer detail — the /help list deep-links here per row. The
 * backend returns retired entries too (so a live share link out in
 * the wild doesn't 404); when `isActive=false` we render a small
 * amber banner above the answer warning the reader that the answer
 * may be out of date.
 *
 * Content is trusted server-authored markdown authored in the admin
 * FAQ editor, so `dangerouslySetInnerHTML` here is safe — same
 * trust model as the question / explanation renderers on the rest
 * of the app.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const session = await auth();
  if (!session?.accessToken) return { title: "Help answer" };
  const entry = await getFaqEntry(session.accessToken, slug).catch(
    () => null,
  );
  return {
    title: entry?.question ?? "Help answer",
  };
}

export default async function FaqDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.accessToken) redirect("/login");

  const entry = await getFaqEntry(session.accessToken, slug).catch(
    () => null,
  );
  if (!entry) notFound();

  const html = renderMarkdown(entry.answerMarkdown);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <Link
        href="/help"
        className="text-sm text-pm-slate-500 hover:text-pm-navy"
      >
        ← Back to Help
      </Link>

      <h1 className="text-3xl font-bold text-pm-navy">{entry.question}</h1>

      {!entry.isActive ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          This answer has been retired and may be out of date.{" "}
          <Link
            href="/help/tickets/new?category=general"
            className="underline"
          >
            Open a ticket
          </Link>{" "}
          if you need the current guidance.
        </div>
      ) : null}

      <article
        className="prose prose-slate max-w-none text-pm-navy prose-headings:text-pm-navy prose-a:text-pm-orange"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="rounded-2xl border border-pm-slate-200 bg-white p-4 space-y-2">
        <div className="text-sm font-semibold text-pm-navy">
          Still need a hand?
        </div>
        <Link
          href="/help/tickets/new?category=general"
          className="inline-block rounded-lg bg-pm-navy px-4 py-2 text-sm font-semibold text-white hover:bg-pm-navy-mid"
        >
          Open a ticket
        </Link>
      </div>
    </div>
  );
}
