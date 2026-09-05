import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "wassce-core-mathematics-syllabus";
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
          Core Mathematics is one of the four <strong>WASSCE core
          papers</strong> every candidate in Ghana sits, regardless of their
          programme. It&apos;s also the paper that decides whether a lot of
          students walk into the university programme they actually want —
          most science, business, and engineering programmes set a minimum
          grade in Core Maths as a hard floor.
        </p>
        <p>
          The good news: the syllabus is finite, the question patterns are
          well-documented through years of WAEC past papers, and almost
          every topic can be drilled into intuition with enough practice.
        </p>

        <h2>The paper structure</h2>
        <ul>
          <li>
            <strong>Paper 1 — Objective.</strong> 50 multiple-choice
            questions in 1 hour 30 minutes. Roughly two minutes per
            question. Speed and accuracy on routine work matter more than
            elegance.
          </li>
          <li>
            <strong>Paper 2 — Essay / Theory.</strong> Two sections. Section
            A is short-answer; you must answer all questions. Section B
            offers a choice — pick five from about eight longer questions.
            About 2 hours 30 minutes total.
          </li>
        </ul>
        <p>
          The papers are weighted such that strong essay work can lift a
          shaky objective performance and vice versa, but candidates who
          neglect either side end up with the same grade.
        </p>

        <h2>What the Core Mathematics syllabus actually covers</h2>
        <p>
          WAEC publishes the official syllabus on{" "}
          <a href="https://www.waecgh.org">waecgh.org</a>. The headings every
          candidate must master:
        </p>

        <h3>1. Number and numeration</h3>
        <ul>
          <li>Sets and set notation (subsets, intersections, Venn diagrams).</li>
          <li>Real numbers, fractions, decimals, percentages.</li>
          <li>Approximations, significant figures, standard form.</li>
          <li>Ratio, rate, proportion, and percentage problems.</li>
          <li>Indices, logarithms, and surds.</li>
          <li>Sequences and series — arithmetic, geometric.</li>
        </ul>

        <h3>2. Algebra</h3>
        <ul>
          <li>
            Linear and quadratic equations, simultaneous equations,
            inequalities.
          </li>
          <li>Change of subject of a formula.</li>
          <li>Variation — direct, inverse, joint, partial.</li>
          <li>Polynomials, factorisation, and basic factor theorem work.</li>
          <li>Functions and relations (mappings, domains, ranges).</li>
        </ul>

        <h3>3. Geometry and mensuration</h3>
        <ul>
          <li>Angles, polygons, the circle and its theorems.</li>
          <li>
            Mensuration of plane shapes and solids — area, volume, surface
            area, lengths of arcs and sectors.
          </li>
          <li>Coordinate geometry — gradient, distance, midpoint, lines.</li>
        </ul>

        <h3>4. Trigonometry</h3>
        <ul>
          <li>Sine, cosine, tangent and their reciprocals.</li>
          <li>Angles of elevation and depression, bearings.</li>
          <li>The sine rule, cosine rule, and their applications.</li>
        </ul>

        <h3>5. Statistics and probability</h3>
        <ul>
          <li>
            Frequency tables, mean, median, mode, range, mean deviation,
            standard deviation.
          </li>
          <li>Cumulative frequency, ogives, quartiles, percentiles.</li>
          <li>Simple probability and tree diagrams.</li>
        </ul>

        <h3>6. Calculus (introductory)</h3>
        <ul>
          <li>Differentiation of simple polynomials.</li>
          <li>Application of derivatives — gradients, simple rate problems.</li>
          <li>Basic integration as the reverse process.</li>
        </ul>

        <h2>Where the marks really live</h2>
        <p>
          Across recent WAEC chief examiners&apos; reports, a few themes
          repeat year after year:
        </p>
        <ul>
          <li>
            <strong>Bearings and trigonometry of triangles</strong> usually
            account for one big essay question. Candidates who can draw a
            clear diagram and apply the sine/cosine rule cleanly pick up
            most of those marks.
          </li>
          <li>
            <strong>Mensuration</strong> — cones, cylinders, pyramids — is
            almost always tested. Memorise the formulae and practise solid
            geometry questions until the formula choice is automatic.
          </li>
          <li>
            <strong>Variation and percentages</strong> show up across both
            papers. Word-problem comprehension matters as much as the maths.
          </li>
          <li>
            <strong>Sets, Venn diagrams, and the universal-set &ldquo;neither&rdquo; trap</strong>{" "}
            — at least one objective question almost every year. Drill these
            until they&apos;re reflexive.
          </li>
        </ul>

        <h2>A 12-week Core Maths preparation plan</h2>
        <ol>
          <li>
            <strong>Weeks 1–4: topic-by-topic recall.</strong> One topic per
            day, your notes + textbook + a small set of practice questions.
            Don&apos;t skip topics you don&apos;t like — they&apos;re the
            ones that show up.
          </li>
          <li>
            <strong>Weeks 5–8: timed past papers, by year.</strong> Sit one
            past paper a week, Paper 1 and Paper 2, under exam timing. Mark
            ruthlessly using the chief examiners&apos; reports.
          </li>
          <li>
            <strong>Weeks 9–11: targeted weak-topic drilling.</strong> Your
            mark scheme will have made clear what you&apos;re weak at.
            Spend three weeks fixing those topics specifically — don&apos;t
            re-practice what you&apos;re already good at.
          </li>
          <li>
            <strong>Week 12: light recall + rest.</strong> The night before
            the paper isn&apos;t when you learn new things. Quick review of
            your formula sheet and worked errors. Sleep.
          </li>
        </ol>

        <h2>How Bondzi handles Core Mathematics</h2>
        <p>
          Bondzi&apos;s WASSCE Core Mathematics question bank covers thirty-four
          years of past papers, organised by topic and by year. Every
          question you get wrong triggers an AI explanation pitched at SHS
          level. Topics you consistently stumble on get scheduled by a
          spaced-repetition algorithm, so they keep coming back at the right
          interval until they stop being your weak topic.
        </p>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/wassce-2026-timetable">
              WASSCE 2026 timetable and study plan
            </Link>
          </li>
          <li>
            <Link href="/blog/wassce-nov-dec-registration">
              How to register for the WASSCE Nov/Dec series
            </Link>
          </li>
          <li>
            <Link href="/blog/bece-2026-prep-guide">
              BECE 2026 prep guide
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
