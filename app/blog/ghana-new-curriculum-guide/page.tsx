import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { ArticleCta } from "../../../components/blog/ArticleCta";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "ghana-new-curriculum-guide";
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
 * TODO(content): the OFFICIAL_LINKS hrefs below are placeholder paths on
 * the real official domains. Replace each href with the exact page URL
 * before or shortly after publishing — the anchor text can stay.
 */
const OFFICIAL_LINKS = [
  {
    label: "NaCCA — SHS curriculum & subject syllabuses",
    href: "https://nacca.gov.gh/shs-curriculum/", // TODO: replace with exact URL
    note: "The National Council for Curriculum and Assessment publishes the official curriculum documents for every subject.",
  },
  {
    label: "NaCCA — teacher and learner materials",
    href: "https://nacca.gov.gh/learning-materials/", // TODO: replace with exact URL
    note: "Official learner materials and teacher manuals aligned to the new curriculum.",
  },
  {
    label: "Ministry of Education — SHS reform updates",
    href: "https://moe.gov.gh/shs-curriculum-reform/", // TODO: replace with exact URL
    note: "Policy announcements, rollout timelines, and circulars from the Ministry.",
  },
  {
    label: "WAEC Ghana — examinations & timetables",
    href: "https://waecgh.org/",
    note: "How and when the new curriculum will be examined, plus current timetables.",
  },
];

export default function Page() {
  const jsonLd = buildBlogPostingJsonLd(post);

  return (
    <>
      <ArticleLayout post={post}>
        <p>
          Ghana&apos;s secondary-school curriculum is in the middle of its
          biggest redesign in a generation. The new{" "}
          <strong>Standards-Based Curriculum (SBC)</strong>, developed by the
          National Council for Curriculum and Assessment (NaCCA), started at
          the basic level and is now rolling through senior high school —
          which means students, parents, and teachers are living through a
          period where <em>two curricula exist at once</em>. This guide
          explains what actually changed, who it affects, and where to find
          the official documents.
        </p>

        <h2>What the new curriculum is</h2>
        <p>
          The old system was objective-based: long lists of topics a teacher
          should cover. The SBC flips the question from &ldquo;what was
          taught?&rdquo; to &ldquo;what can the learner{" "}
          <strong>do</strong>?&rdquo; Every subject is now organised in a
          consistent hierarchy:
        </p>
        <ul>
          <li>
            <strong>Strands</strong> — the big pillars of a subject (in
            Mathematics, for example: Number, Algebra, Geometry &amp;
            Measurement, Data).
          </li>
          <li>
            <strong>Sub-strands</strong> — the themes inside each pillar.
          </li>
          <li>
            <strong>Content standards</strong> — what a learner is expected
            to know and be able to do by the end of a level.
          </li>
          <li>
            <strong>Learning indicators</strong> — the specific, observable
            skills a learner demonstrates, which is also what assessment is
            built against.
          </li>
        </ul>
        <p>
          Alongside the structure, the SBC bakes in core competencies —
          critical thinking, communication, digital literacy — and pushes
          classroom assessment away from one-off recall tests toward
          continuous, skill-based evidence.
        </p>

        <h2>Who is on which curriculum right now</h2>
        <p>
          This is the part that confuses most families, so plainly:
        </p>
        <ul>
          <li>
            <strong>Basic school (KG–JHS):</strong> already on the new
            standards-based curriculum. The BECE is progressively aligned to
            it.
          </li>
          <li>
            <strong>Senior high school:</strong> transitioning. Newer cohorts
            enter under the reformed SHS programme; students who started
            under the old system finish — and are examined — under it.
          </li>
          <li>
            <strong>Private / Nov/Dec candidates:</strong> still examined on
            the old curriculum. WAEC labels the current private-candidate
            series &ldquo;Old Curriculum&rdquo; explicitly — see the{" "}
            <Link href="/blog/wassce-novdec-2026-timetable">
              official Nov/Dec 2026 timetable
            </Link>
            . If you&apos;re re-sitting or writing as a private candidate,
            the old syllabus is still your syllabus.
          </li>
        </ul>

        <ArticleCta
          headline="Whichever curriculum you're on, the exam is still the exam."
          body="Bondzi's question bank spans thirty-four years of WAEC papers, organised by syllabus topic — practise exactly what your series will test."
        />

        <h2>What actually changes for students</h2>
        <ul>
          <li>
            <strong>Fewer, deeper topics.</strong> The SBC trims breadth in
            favour of mastery — expect more multi-step problems and fewer
            &ldquo;define the following&rdquo; questions over time.
          </li>
          <li>
            <strong>Continuous assessment counts more.</strong> Projects,
            classwork, and practical evidence feed into your record, not just
            a terminal exam.
          </li>
          <li>
            <strong>New learner materials.</strong> NaCCA publishes official
            learner materials per subject and form — written for
            self-study, not just classroom use. They are free to download
            (links below).
          </li>
          <li>
            <strong>Exams will follow the curriculum, not lead it.</strong>{" "}
            WAEC aligns papers to whichever curriculum a cohort was taught
            under — which is why the private-candidate series still says
            &ldquo;Old Curriculum&rdquo; while school-candidate papers
            migrate.
          </li>
        </ul>

        <h2>Where to get the official documents</h2>
        <p>
          Don&apos;t rely on third-party PDF mirrors — curriculum documents
          get revised, and outdated mirrors circulate for years. Go to the
          source:
        </p>
        <ul>
          {OFFICIAL_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label}
              </a>{" "}
              — {l.note}
            </li>
          ))}
        </ul>

        <h2>How Bondzi fits in</h2>
        <p>
          Bondzi&apos;s syllabus engine is built on the same
          strand → sub-strand → content-standard structure NaCCA uses, so
          your practice, weakness reports, and reading recommendations map
          onto the official curriculum rather than a made-up topic list. For
          the exams themselves, the past-question bank covers every WAEC
          series — old curriculum included — with an AI tutor to explain
          whatever you get wrong.
        </p>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/wassce-novdec-2026-timetable">
              The official WASSCE Nov/Dec 2026 timetable
            </Link>
          </li>
          <li>
            <Link href="/blog/how-to-use-bondzi">
              How to use Bondzi, step by step
            </Link>
          </li>
          <li>
            <Link href="/blog/bece-2026-prep-guide">BECE 2026 prep guide</Link>
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
