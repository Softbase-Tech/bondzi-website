import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "bece-2026-prep-guide";
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
          The <strong>BECE</strong> — Basic Education Certificate Examination —
          is the first national exam most Ghanaian students sit. It comes at
          the end of JHS 3 and decides which Senior High School the Computer
          School Selection and Placement System (CSSPS) sends them to. The
          paper is set and marked by <strong>WAEC</strong>, and a strong
          aggregate opens doors to the country&apos;s most-contested SHS
          programmes.
        </p>
        <p>
          This is a long-game exam, not a cramming exam. Students who go in
          calm tend to be the ones who started taking their JHS 1 and JHS 2
          work seriously.
        </p>

        <h2>What papers the BECE actually tests</h2>
        <p>
          Every BECE candidate sits the following <strong>core</strong>{" "}
          subjects:
        </p>
        <ul>
          <li>
            <strong>Mathematics</strong> — number work, algebra, geometry,
            statistics, simple probability.
          </li>
          <li>
            <strong>English Language</strong> — comprehension, summary,
            essay/composition, lexis and structure.
          </li>
          <li>
            <strong>Integrated Science</strong> — basic physics, chemistry,
            biology, environment.
          </li>
          <li>
            <strong>Social Studies</strong> — Ghana&apos;s geography, civic
            education, history, basic economics.
          </li>
          <li>
            <strong>Religious &amp; Moral Education (RME)</strong>.
          </li>
          <li>
            <strong>Basic Design &amp; Technology (BDT)</strong>.
          </li>
          <li>
            A <strong>Ghanaian Language</strong> — Akan, Ga, Ewe, Dagbani,
            Hausa, or another, depending on the school&apos;s offerings.
          </li>
          <li>
            <strong>French</strong> (elective in most schools).
          </li>
        </ul>
        <p>
          Each subject is graded on a nine-point Stanine scale (1 is best, 9
          is worst). Your aggregate is the sum of your best six papers — and
          a lower aggregate (better Stanines) wins better SHS placement.
        </p>

        <h2>How each paper is structured</h2>
        <p>
          Most BECE subjects follow the same two-section pattern: an
          objective paper (multiple-choice) and an essay paper. The
          objective paper rewards speed and broad recall; the essay paper
          rewards structured thinking.
        </p>
        <ul>
          <li>
            <strong>Paper 1 — Objective.</strong> 40–60 multiple-choice
            questions. Time pressure is real; don&apos;t spend ten minutes on
            one question.
          </li>
          <li>
            <strong>Paper 2 — Essay.</strong> Structured questions, usually
            with some choice. Practise writing answers in full sentences —
            BECE markers don&apos;t reward note-form answers in subjects like
            English and Social Studies.
          </li>
        </ul>

        <h2>A JHS 3 study routine that holds up</h2>
        <ol>
          <li>
            <strong>Term 1: build the foundations.</strong> Focus on
            understanding, not speed. Use class time well. Past questions
            can come in toward the end of the term.
          </li>
          <li>
            <strong>Term 2: layer in past questions, subject by subject.</strong>{" "}
            By mid-term 2 you should have done at least three years of past
            papers in Maths and English. Notice the patterns.
          </li>
          <li>
            <strong>Term 3 to BECE week: timed mocks + targeted weak-area
            work.</strong> One full paper a week, timed. The other five days
            spent fixing the topics you&apos;re scoring badly on.
          </li>
        </ol>
        <p>
          A simple habit beats any single all-night session: 45 minutes of
          past-question practice every weekday is more effective than four
          hours every Sunday. Spaced repetition is how memory actually
          consolidates.
        </p>

        <h2>The mistakes that quietly cost grades</h2>
        <ul>
          <li>
            <strong>Skipping the essay practice.</strong> Lots of candidates
            grind objective papers and walk in cold on the essay. Then they
            write three-line answers and lose half the marks available.
          </li>
          <li>
            <strong>Underrating Social Studies and RME.</strong> These are
            often where the easiest credits sit if you actually read the
            syllabus. Don&apos;t treat them as filler.
          </li>
          <li>
            <strong>Not learning the Ghanaian Language properly.</strong>{" "}
            For students who speak it at home, this should be one of their
            best papers — but it&apos;s often the one they prepare least
            for.
          </li>
          <li>
            <strong>Cramming the night before.</strong> Sleep is more
            valuable than the marginal recall a 3am study session buys you.
          </li>
        </ul>

        <h2>How CSSPS placement actually works</h2>
        <p>
          The CSSPS system places JHS 3 leavers into Senior High Schools
          based on aggregate score, programme choice, and a school&apos;s
          available slots. The most-contested schools require very low
          aggregates — typically 06–10. The lower your aggregate, the more
          likely you get your first-choice school and programme.
        </p>
        <p>
          You can&apos;t game the system, but you can prepare so seriously
          that your aggregate puts you well inside the cutoff for the
          schools you&apos;d actually like to attend.
        </p>

        <h2>Bondzi for BECE</h2>
        <p>
          Bondzi covers every BECE subject — Mathematics, English Language,
          Integrated Science, Social Studies, RME, BDT, Ghanaian Language and
          French — with the full nine-year WAEC past-question bank. Wrong
          answers trigger AI explanations pitched at JHS level. Topics you
          stumble on get scheduled to come back tomorrow, in three days,
          then in a week.
        </p>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/wassce-2026-timetable">
              WASSCE 2026 timetable (for when JHS 3 becomes SHS 3)
            </Link>
          </li>
          <li>
            <Link href="/blog/waec-results-checker-ghana">
              How to check your WAEC BECE results
            </Link>
          </li>
          <li>
            <Link href="/blog/wassce-core-mathematics-syllabus">
              WASSCE Core Mathematics syllabus
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
