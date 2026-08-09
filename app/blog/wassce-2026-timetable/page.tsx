import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "wassce-2026-timetable";
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
          The WASSCE — short for the West African Senior School Certificate
          Examination — is the school-leaving exam every Ghanaian SHS 3
          candidate sits at the end of their senior high journey. It&apos;s
          set and marked by <strong>WAEC</strong>, the West African
          Examinations Council, and the same exam decides admission into
          public universities, polytechnics, and most professional training
          tracks in Ghana.
        </p>
        <p>
          The 2026 WASSCE series runs in two windows: the main{" "}
          <strong>May/June series</strong> for school candidates and the{" "}
          <strong>Nov/Dec series</strong> for private candidates. The
          syllabus is identical; only the registration process and the
          calendar window differ.
        </p>

        <h2>When is the WASSCE 2026?</h2>
        <p>
          WAEC publishes the official timetable a few months before each
          series at <a href="https://www.waecgh.org">waecgh.org</a>. As a rule
          of thumb:
        </p>
        <ul>
          <li>
            <strong>May/June 2026 (school candidates):</strong> papers
            typically run from late April through early July, spread out so
            candidates aren&apos;t sitting two heavy papers on the same day.
          </li>
          <li>
            <strong>Nov/Dec 2026 (private candidates):</strong> registration
            tends to open around April/May; papers run from late October
            through November.
          </li>
        </ul>
        <p>
          Don&apos;t trust unofficial timetables shared on WhatsApp without
          checking against the WAEC Ghana site. Every year there&apos;s a
          version going around that swaps two papers — it&apos;s a real
          source of last-minute panic.
        </p>

        <h2>What does each paper look like?</h2>
        <p>
          Almost every WASSCE subject is split into two papers, sometimes
          three:
        </p>
        <ul>
          <li>
            <strong>Paper 1 — Objective.</strong> Multiple-choice questions,
            usually 40–60 of them in an hour or so. Mostly testing recall and
            quick reasoning.
          </li>
          <li>
            <strong>Paper 2 — Essay / Theory.</strong> Longer-form
            questions — proofs in mathematics, structured answers in the
            sciences, essays in English and Social Studies.
          </li>
          <li>
            <strong>Paper 3 — Practical / Test of Oral.</strong> Only in
            certain subjects: the sciences (lab practicals), Music, French
            (listening), Visual Art, etc.
          </li>
        </ul>

        <h2>A WASSCE study plan that actually works</h2>
        <p>
          The single most useful thing any WASSCE candidate can do is
          practise past questions under timed conditions — not just read the
          textbook. WAEC questions follow patterns; ten years of past papers
          show you exactly how they like to phrase a quadratic equation, an
          ecosystem question, a mole calculation.
        </p>
        <ol>
          <li>
            <strong>Start three full terms out, not three weeks out.</strong>{" "}
            By WASSCE week, you shouldn&apos;t still be encountering topics
            for the first time.
          </li>
          <li>
            <strong>Do past papers, in order, by year.</strong> Start with
            2017 and work forward. You&apos;ll see the way the same topic
            comes back two or three times across years.
          </li>
          <li>
            <strong>Time yourself.</strong> Paper 2 in Core Mathematics is a
            real-time pressure exam. Practising untimed lies to you about how
            ready you are.
          </li>
          <li>
            <strong>Mark honestly.</strong> Don&apos;t give yourself the
            method mark you don&apos;t deserve. Use the WAEC chief
            examiners&apos; reports — they&apos;re free to download and tell
            you exactly what they marked candidates down for.
          </li>
        </ol>

        <h2>Where Bondzi fits in</h2>
        <p>
          Bondzi bundles nine years of WAEC WASSCE past questions across all
          fourteen most-sat subjects, sorted by paper, year, and topic. When
          you get a question wrong, an AI tutor explains it step by step in
          the same language your teacher would use. Questions you stumble on
          come back tomorrow, then in three days, then a week — until they
          stick.
        </p>
        <p>
          Whether you&apos;re sitting the 2026 May/June series in school or
          registering for the Nov/Dec window as a private candidate, the
          syllabus is the same — and so is the rule: practise what WAEC
          actually asks, not what you wish they&apos;d ask.
        </p>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/wassce-nov-dec-registration">
              How to register for the WASSCE Nov/Dec series
            </Link>
          </li>
          <li>
            <Link href="/blog/wassce-core-mathematics-syllabus">
              WASSCE Core Mathematics: full syllabus and how to prepare
            </Link>
          </li>
          <li>
            <Link href="/blog/waec-results-checker-ghana">
              How to check your WAEC WASSCE results
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
