import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "waec-results-checker-ghana";
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
          When the WAEC results window opens, traffic to the WAEC Ghana
          checker spikes hard enough that the site can buckle for a few hours
          at a time. Knowing exactly what you need, where to go, and what
          each grade means turns a stressful afternoon into a five-minute
          job.
        </p>

        <h2>Where to check WAEC results in Ghana</h2>
        <p>
          The official portal is{" "}
          <a href="https://eresults.waecgh.org">eresults.waecgh.org</a>, run by
          the West African Examinations Council. WAEC Ghana also publishes
          announcements at <a href="https://www.waecgh.org">waecgh.org</a>.
        </p>
        <p>
          Be wary of third-party sites claiming to &ldquo;check WAEC results
          faster&rdquo;. They&apos;re typically scraping the official portal and
          some are outright phishing for your serial numbers. Always start at
          the WAEC Ghana domain.
        </p>

        <h2>What you need before you start</h2>
        <ul>
          <li>
            <strong>Your index number</strong> — printed on your WAEC
            registration slip. Looks like a long string of digits.
          </li>
          <li>
            <strong>A result-checker scratch card</strong> with a{" "}
            <strong>serial number</strong> and <strong>PIN</strong>. These
            are sold at banks, mobile-money kiosks, and online via reputable
            vendors. Each card lets you check the result a fixed number of
            times.
          </li>
          <li>
            <strong>The exam type and year</strong> — e.g. WASSCE May/June
            2026, or BECE 2026.
          </li>
        </ul>

        <h2>How the result checker works, step by step</h2>
        <ol>
          <li>Open the WAEC Ghana eresults portal.</li>
          <li>
            Pick the right exam type — <strong>WASSCE</strong> for SHS
            candidates, <strong>BECE</strong> for JHS, and select May/June or
            Nov/Dec where prompted.
          </li>
          <li>Enter your index number and the exam year.</li>
          <li>Type in the serial number and PIN from your scratch card.</li>
          <li>
            Submit. Your subject-by-subject grades should display on the next
            page.
          </li>
        </ol>
        <p>
          Screenshot the result page immediately. If you need it later — for
          university application, a visa, a scholarship — that screenshot is
          much easier than buying another card.
        </p>

        <h2>What WASSCE grades mean</h2>
        <p>
          WASSCE results are graded on a nine-point scale, A1 (best) through
          F9. Roughly:
        </p>
        <ul>
          <li>
            <strong>A1 (Excellent), B2, B3 (Very good).</strong> Six of these
            and you&apos;re competitive for any public university programme.
          </li>
          <li>
            <strong>C4, C5, C6 (Good / Credit).</strong> Still a credit pass.
            Most university programmes count credits in core subjects toward
            admission.
          </li>
          <li>
            <strong>D7, E8 (Pass).</strong> You sat the paper but didn&apos;t
            secure a credit. Often re-sat in Nov/Dec.
          </li>
          <li>
            <strong>F9 (Fail).</strong> The grade most candidates re-sit
            through the Nov/Dec private-candidate window.
          </li>
        </ul>
        <p>
          BECE uses Grades 1–9 (Stanines) instead of letters. Aggregate scores
          across your six chosen subjects decide your CSSPS Senior High
          placement.
        </p>

        <h2>If your result is withheld</h2>
        <p>
          A result can be withheld if WAEC flags possible irregularities — a
          shared answer pattern, a missing script, an unresolved attendance
          query. Withheld results display as <code>WH</code> or &ldquo;Result
          withheld&rdquo;. Don&apos;t panic:
        </p>
        <ol>
          <li>
            Contact your school&apos;s exams officer first. They can
            sometimes resolve administrative issues directly with WAEC.
          </li>
          <li>
            If your school can&apos;t help, visit the nearest WAEC zonal
            office with your registration slip and any other documentation
            from the exam centre.
          </li>
          <li>
            Don&apos;t pay anyone who offers to &ldquo;release&rdquo; your result outside
            this process. WAEC doesn&apos;t use intermediaries.
          </li>
        </ol>

        <h2>The best result is one you don&apos;t stress-check</h2>
        <p>
          Bondzi can&apos;t check your result for you — only WAEC can — but
          the best version of results day is one where you already know what
          to expect because you walked into the exam prepared. The app gives
          you nine years of WAEC past questions, an AI tutor on every wrong
          answer, and a spaced-repetition schedule that brings shaky topics
          back until they stick.
        </p>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/wassce-2026-timetable">
              WASSCE 2026 timetable, format, and how to plan your study
            </Link>
          </li>
          <li>
            <Link href="/blog/wassce-nov-dec-registration">
              How to register for the WASSCE Nov/Dec series
            </Link>
          </li>
          <li>
            <Link href="/blog/bece-2026-prep-guide">
              BECE 2026: a complete prep guide for JHS 3 students
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
