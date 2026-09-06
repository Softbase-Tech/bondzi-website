import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { ArticleCta } from "../../../components/blog/ArticleCta";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "after-wassce-results";
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

export default function Page() {
  const jsonLd = buildBlogPostingJsonLd(post);

  return (
    <>
      <ArticleLayout post={post}>
        <p>
          You checked your results and the grades are not what you worked
          for. Maybe one subject collapsed. Maybe the aggregate misses the
          programme you had planned your whole SHS life around. Before
          anything else: this is a setback, not a verdict. Thousands of
          people in every field you admire re-sat a paper. Here are your
          actual options, in the order most people should consider them.
        </p>

        <h2>Step 1: Read your results like an admissions officer</h2>
        <p>
          Do not stare at the one bad grade. Work out what you actually
          need. Universities compute an aggregate from your best six
          subjects: your core subjects plus your best electives, graded A1
          (best) to F9. One weak grade inside a strong set often does not
          matter at all. Our{" "}
          <Link href="/blog/wassce-grades-explained">
            grades and aggregates guide
          </Link>{" "}
          breaks down the maths. Compute your aggregate first, then compare
          it against the published requirements of the programmes you want,
          on the universities&apos; own admission pages, not on hearsay.
        </p>

        <h2>Step 2: If the aggregate falls short, check nearby programmes</h2>
        <p>
          The same university often runs related programmes with different
          competitiveness. If your dream programme is out of reach this
          year, a related one may not be, and internal transfers after first
          year exist in many institutions. This route keeps you moving
          forward while others wait a full year.
        </p>

        <h2>Step 3: The re-sit route, honestly</h2>
        <p>
          If specific papers are genuinely blocking you, the{" "}
          <strong>WASSCE for Private Candidates</strong>, what everyone
          calls Nov/Dec, lets you re-sit exactly the subjects you need. The
          things to know:
        </p>
        <ul>
          <li>
            <strong>You choose your subjects.</strong> Re-sit only what you
            need. One paper, three papers, your call. Registration and fees
            are per subject.
          </li>
          <li>
            <strong>Registration runs through WAEC.</strong> Watch{" "}
            <a
              href="https://waecgh.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              waecgh.org
            </a>{" "}
            for the current window and requirements. Our{" "}
            <Link href="/blog/wassce-nov-dec-registration">
              Nov/Dec registration guide
            </Link>{" "}
            covers the documents and the process.
          </li>
          <li>
            <strong>The syllabus is the old curriculum you already know.</strong>{" "}
            WAEC prints it on the timetable itself. You are not learning new
            content; you are fixing known weaknesses, which is a much
            smaller job than the full WASSCE felt like.
          </li>
          <li>
            <strong>Dates are published.</strong> The current series
            timetable is in{" "}
            <Link href="/blog/wassce-novdec-2026-timetable">
              our official Nov/Dec timetable post
            </Link>
            , paper by paper.
          </li>
        </ul>

        <ArticleCta
          headline="A re-sit is a targeted strike, not a repeat of SHS."
          body="Bondzi's NOVDEC mode drills exactly the subjects you're re-sitting: thirty-four years of real WAEC past questions, an AI tutor on every wrong answer, and a plan built around your weak topics."
          cta="Start your re-sit prep free"
        />

        <h2>Step 4: If a result was withheld or looks wrong</h2>
        <p>
          A withheld result is a process, not a final answer. WAEC withholds
          results while it investigates suspected irregularities, and many
          are released after review. If a grade looks impossibly wrong, WAEC
          offers remarking and attestation services for a fee, with
          deadlines. Both go through WAEC directly:{" "}
          <a
            href="https://waecgh.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            waecgh.org
          </a>
          . Nobody on social media can &ldquo;upgrade&rdquo; a result, and
          anyone charging to do so is stealing from you.
        </p>

        <h2>Step 5: Protect the year either way</h2>
        <p>
          The worst outcome is a year that just evaporates. If you re-sit,
          build a routine now: your weak subjects, a few sessions a week,
          reviewed honestly. If you enter a programme that was not the
          original plan, enter it properly and keep the door open for a
          transfer. A year with direction beats a year of waiting in every
          version of this story.
        </p>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/wassce-grades-explained">
              WASSCE grades and aggregates, explained properly
            </Link>
          </li>
          <li>
            <Link href="/blog/wassce-nov-dec-registration">
              How to register for Nov/Dec
            </Link>
          </li>
          <li>
            <Link href="/blog/wassce-novdec-2026-timetable">
              The official Nov/Dec 2026 timetable
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
