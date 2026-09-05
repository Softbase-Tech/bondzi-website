import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { ArticleCta } from "../../../components/blog/ArticleCta";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "ghana-learning-materials-download";
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
 * TODO(content): the per-level hrefs below are PLACEHOLDERS pointing at
 * NaCCA's hub page. Swap each href for the exact level page URL when
 * the links are provided. Anchor text and layout can stay as they are.
 */
const NACCA_HUB = "https://nacca.gov.gh/secondary-education-curriculum";

const LEVELS: { level: string; note: string; href: string }[] = [
  {
    level: "SHS Year 1 learning materials",
    note: "Learner materials for every Year 1 subject on the new curriculum.",
    href: NACCA_HUB, // TODO(content): replace with the Year 1 materials page
  },
  {
    level: "SHS Year 2 learning materials",
    note: "Year 2 learner materials, released as the new curriculum rolls forward.",
    href: NACCA_HUB, // TODO(content): replace with the Year 2 materials page
  },
  {
    level: "SHS Year 3 learning materials",
    note: "Final-year materials, the ones that matter most in exam season.",
    href: NACCA_HUB, // TODO(content): replace with the Year 3 materials page
  },
  {
    level: "Basic school (KG to JHS) materials",
    note: "Learner materials for the basic-school curriculum, including JHS.",
    href: NACCA_HUB, // TODO(content): replace with the basic-level materials page
  },
];

export default function Page() {
  const jsonLd = buildBlogPostingJsonLd(post);

  return (
    <>
      <ArticleLayout post={post}>
        <p>
          Here is something many students and parents in Ghana still do not
          know: the official textbooks for the new curriculum are free. NaCCA
          publishes learner materials for each subject and level as PDFs, and
          you can download them yourself. No bookshop, no waiting for the
          school&apos;s copies to arrive, no photocopying a classmate&apos;s
          book chapter by chapter.
        </p>
        <p>
          This guide explains what learning materials are, why the official
          versions beat whatever is circulating in your study group, and
          where to download them for your level.
        </p>

        <h2>Syllabus vs learning material: know the difference</h2>
        <p>
          Students mix these up all the time, so let us settle it.
        </p>
        <ul>
          <li>
            <strong>The syllabus (curriculum document)</strong> is the map.
            It lists every topic you must cover for a subject, year by year.
            It tells you <em>what</em> to learn, not <em>how</em>. We linked
            all of them in{" "}
            <Link href="/blog/ghana-new-curriculum-guide">
              our guide to the new curriculum
            </Link>
            .
          </li>
          <li>
            <strong>The learning material (learner material)</strong> is the
            textbook. It teaches the topics on that map: explanations, worked
            examples, activities and revision questions, written to match the
            syllabus exactly.
          </li>
        </ul>
        <p>
          You want both. The syllabus to plan and check your coverage, the
          learning material to actually study from.
        </p>

        <h2>Why the official materials are the ones to use</h2>
        <ul>
          <li>
            <strong>They match your exam.</strong> The materials are written
            against the same curriculum WAEC will set your papers from. A
            private pamphlet or an old textbook can drift from the syllabus
            without you noticing. The official material cannot.
          </li>
          <li>
            <strong>They are current.</strong> PDFs forwarded through
            WhatsApp groups live forever, including versions that were
            revised or withdrawn years ago. Downloading from NaCCA means you
            are reading the version that is actually in force.
          </li>
          <li>
            <strong>They are free.</strong> Families spend serious money on
            pamphlets of uneven quality every term. Start with the official
            book, then decide if you still need anything extra.
          </li>
          <li>
            <strong>They are written for you to read alone.</strong> The
            learner materials are built for self-study, not just for a
            teacher to teach from. If you missed classes, or your school is
            short on teachers for a subject, the material can carry you
            further than you would expect.
          </li>
        </ul>

        <h2>Where to download the learning materials</h2>
        <p>
          Everything starts from{" "}
          <a href={NACCA_HUB} target="_blank" rel="noopener noreferrer">
            NaCCA&apos;s secondary education curriculum page
          </a>
          . Below are the level pages. Download the subjects you are
          offering, save them on your phone, and they are yours offline from
          then on.
        </p>
        <ul>
          {LEVELS.map((l) => (
            <li key={l.level}>
              <a href={l.href} target="_blank" rel="noopener noreferrer">
                {l.level}
              </a>: {l.note}
            </li>
          ))}
        </ul>
        <p>
          One tip for downloading on a budget: the PDFs are large, so use
          school or public Wi-Fi where you can, and download once. You never
          need to stream a textbook twice.
        </p>

        <ArticleCta
          headline="Reading is half the work. Testing yourself is the other half."
          body="After a chapter, drill the same topic with real WAEC past questions on Bondzi. Wrong answers come with an AI explanation so you know exactly what to re-read."
        />

        <h2>How to actually study from a learner material</h2>
        <p>
          A free PDF on your phone helps nobody if it just sits there. A
          simple routine that works:
        </p>
        <ul>
          <li>
            <strong>Read one section at a time,</strong> not one chapter.
            The materials are dense. Small portions, understood properly,
            beat long reading sessions you forget by Friday.
          </li>
          <li>
            <strong>Do the activities. In writing.</strong> The exercises in
            the material are the same style of thinking your exam will
            demand. Reading past them and telling yourself &ldquo;I get
            it&rdquo; is how students discover in the exam hall that they did
            not.
          </li>
          <li>
            <strong>Close the book and test yourself.</strong> After each
            topic, answer past questions on that topic without checking the
            material first. What you miss shows you exactly which section to
            re-read. This loop, read, test, re-read, is the fastest way to
            turn a weak topic into a safe one.
          </li>
          <li>
            <strong>Tick topics off against the syllabus.</strong> Keep the
            curriculum document from{" "}
            <Link href="/blog/ghana-new-curriculum-guide">our syllabus guide</Link>{" "}
            next to the material. Every topic you finish, mark it. By
            revision time you will know precisely what is left instead of
            guessing.
          </li>
        </ul>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/ghana-new-curriculum-guide">
              The new SHS curriculum, with every official syllabus PDF
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
