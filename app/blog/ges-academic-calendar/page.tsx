import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { ArticleCta } from "../../../components/blog/ArticleCta";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "ges-academic-calendar";
const post = getPost(SLUG)!;

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  alternates: { canonical: `/blog/${SLUG}` },
  openGraph: {
    title: post.title,
    description: post.description,
    type: "article",
    publishedTime: post.publishedAt,
    url: `/blog/${SLUG}`,
    authors: ["Bondzi"],
    tags: post.tags,
  },
};

/**
 * 2026/27 dates from the official GES calendar release, as reported by
 * Graphic Online, Citi Newsroom, Pulse and Adom. SHS rows are the
 * Form 1 & 2 semester track; final-year schedules and any mid-year
 * revisions come from the GES release directly. Update each release.
 */
const CALENDAR: { row: string; shs: string; jhs: string }[] = [
  {
    row: "Term / Semester 1 reopening",
    shs: "Fri 18 Sep 2026 (Forms 1 & 2)",
    jhs: "Tue 8 Sep 2026",
  },
  {
    row: "Mid-term break (basic)",
    shs: "—",
    jhs: "5 to 6 Nov 2026",
  },
  {
    row: "Term / Semester 1 vacation",
    shs: "Fri 29 Jan 2027",
    jhs: "Thu 17 Dec 2026",
  },
  {
    row: "Term / Semester 2 reopening",
    shs: "Tue 30 Mar 2027",
    jhs: "Tue 5 Jan 2027",
  },
  {
    row: "Term 2 vacation (basic)",
    shs: "See GES release",
    jhs: "Thu 25 Mar 2027",
  },
  {
    row: "Term 3 (basic)",
    shs: "—",
    jhs: "20 Apr to 22 Jul 2027",
  },
  {
    row: "BECE 2027",
    shs: "—",
    jhs: "5 to 12 May 2027",
  },
  {
    row: "WASSCE 2027 (school candidates)",
    shs: "6 Apr to 18 Jun 2027",
    jhs: "—",
  },
];

export default function Page() {
  const jsonLd = buildBlogPostingJsonLd(post);

  return (
    <>
      <ArticleLayout post={post}>
        <p>
          &ldquo;When are schools reopening?&rdquo; is one of the most
          searched education questions in Ghana every single term, and the
          answer moves around as GES revises its calendar. This page keeps
          the current dates in one place, with the official source linked so
          you can verify anything before booking transport back to school.
        </p>

        <h2>The 2026/27 academic calendar</h2>
        <p>
          GES released the 2026/27 calendar with basic schools opening
          first: KG, primary and JHS resumed on 8 September 2026, with SHS
          Forms 1 and 2 following on 18 September. The exam headlines
          inside it: BECE 2027 runs 5 to 12 May, and the school-candidates
          WASSCE 2027 runs 6 April to 18 June.
        </p>
        <table>
          <thead>
            <tr>
              <th>Milestone</th>
              <th>SHS</th>
              <th>Basic (KG–JHS)</th>
            </tr>
          </thead>
          <tbody>
            {CALENDAR.map((r) => (
              <tr key={r.row}>
                <td>
                  <strong>{r.row}</strong>
                </td>
                <td>{r.shs}</td>
                <td>{r.jhs}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Dates come from the official GES calendar. Always confirm against{" "}
          <a
            href="https://ges.gov.gh"
            target="_blank"
            rel="noopener noreferrer"
          >
            ges.gov.gh
          </a>{" "}
          or GES&apos;s verified announcements before making travel plans:
          revisions mid-year are common, and a WhatsApp broadcast is not a
          source.
        </p>

        <h2>Why the SHS calendar looks different from basic school</h2>
        <p>
          Basic schools run the familiar three-term year. SHS runs on the
          structure GES sets for the current cohort system, and the shape
          has changed several times in recent years, which is exactly why
          second-hand dates go stale so fast. When in doubt, the school
          itself and the GES release are the only two answers that count.
        </p>

        <h2>Using the break instead of losing it</h2>
        <p>
          The students who come back sharp did not study through the whole
          holiday. They did twenty minutes a day. A short daily review keeps
          your streak alive and your weak topics from resetting, and it
          beats a panicked week of cramming before reopening in every
          measurable way.
        </p>

        <ArticleCta
          headline="Twenty minutes a day beats a cramming week."
          body="Keep a light daily practice going through the break: real past questions, your weak topics, and an AI tutor when you get stuck. Free on Bondzi."
        />

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/wassce-novdec-2026-timetable">
              The official Nov/Dec 2026 exam timetable
            </Link>
          </li>
          <li>
            <Link href="/blog/bece-2026-prep-guide">BECE prep guide</Link>
          </li>
          <li>
            <Link href="/blog/how-to-use-bondzi">
              How to use Bondzi, step by step
            </Link>
          </li>
        </ul>
      </ArticleLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
