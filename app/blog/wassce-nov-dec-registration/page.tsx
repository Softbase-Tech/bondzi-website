import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "wassce-nov-dec-registration";
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
          The <strong>WASSCE Nov/Dec series</strong> — officially the
          WAEC West African Senior School Certificate Examination for Private
          Candidates — is the second annual sitting of the same exam school
          candidates take in May/June. The papers are identical, the
          syllabus is identical, and a Nov/Dec credit counts exactly the
          same toward university admission.
        </p>
        <p>
          What changes is the route in: instead of being registered through a
          school, candidates register directly with WAEC Ghana as
          individuals.
        </p>

        <h2>Who can sit the WASSCE Nov/Dec</h2>
        <p>
          Anyone holding a WASSCE result they want to improve, plus
          first-time candidates who didn&apos;t sit the May/June series.
          Typical candidates:
        </p>
        <ul>
          <li>
            <strong>SHS graduates</strong> who didn&apos;t secure the grades
            they need for their preferred university programme and want to
            re-sit one or more papers.
          </li>
          <li>
            <strong>Working adults</strong> who finished SHS years ago and
            need a refreshed certificate for a scholarship or further
            education abroad.
          </li>
          <li>
            <strong>SHS leavers from non-WAEC schools</strong> who need a
            WASSCE certificate to access programmes that require one.
          </li>
        </ul>

        <h2>When registration opens and closes</h2>
        <p>
          WAEC Ghana usually opens Nov/Dec registration around{" "}
          <strong>April or May</strong> each year and closes in{" "}
          <strong>July</strong>. Late registration is sometimes possible at a
          surcharge, but it&apos;s safer to register inside the standard
          window — last-minute changes often hit centre allocation hardest.
        </p>
        <p>
          The official timeline is published at{" "}
          <a href="https://www.waecgh.org">waecgh.org</a>. Check there before
          taking any third-party site&apos;s dates at face value.
        </p>

        <h2>What you&apos;ll need</h2>
        <ul>
          <li>
            A valid <strong>government-issued ID</strong> — Ghana Card or
            passport.
          </li>
          <li>
            A <strong>recent passport-size photo</strong> meeting WAEC&apos;s
            specifications (plain background, clear face).
          </li>
          <li>
            Your <strong>previous WASSCE certificate or result slip</strong>,
            if you&apos;re re-sitting.
          </li>
          <li>
            A working <strong>mobile-money number</strong> for the
            registration fee, plus a small buffer for service charges.
          </li>
          <li>
            A <strong>WAEC registration PIN</strong> — bought at the start of
            the process from banks or accredited vendors.
          </li>
        </ul>

        <h2>How to register, step by step</h2>
        <ol>
          <li>
            <strong>Buy a registration PIN.</strong> Available at banks
            listed on the WAEC Ghana site. The PIN is single-use and tied to
            your registration.
          </li>
          <li>
            <strong>Visit the WAEC Nov/Dec registration portal</strong>{" "}
            during the official window and create an account using your
            email and phone number.
          </li>
          <li>
            <strong>Enter your personal details</strong> exactly as they
            appear on your Ghana Card or passport. A mismatch will hold up
            your result release later.
          </li>
          <li>
            <strong>Pick your subjects.</strong> Most candidates re-sit
            specific subjects rather than the full set. You don&apos;t have
            to do all of them — only the ones you need.
          </li>
          <li>
            <strong>Upload your passport photo</strong> within the size and
            format limits the portal specifies.
          </li>
          <li>
            <strong>Choose an examination centre</strong> close to where
            you&apos;ll actually be in October/November.
          </li>
          <li>
            <strong>Pay and submit.</strong> Print or save your registration
            slip — you&apos;ll need the index number on it both for entering
            the exam hall and for checking your result later.
          </li>
        </ol>

        <h2>Common mistakes that cost candidates marks</h2>
        <ul>
          <li>
            <strong>Registering too many subjects</strong>. Each subject
            costs money and study time. Be honest about which you can
            realistically prepare for.
          </li>
          <li>
            <strong>Choosing a far-away centre.</strong> A two-hour commute
            on exam morning is a stress you can&apos;t afford.
          </li>
          <li>
            <strong>Forgetting the registration slip on exam day.</strong>{" "}
            No slip, no entry. Keep a physical copy and a phone screenshot.
          </li>
          <li>
            <strong>Treating Nov/Dec like a second chance you don&apos;t
            need to prepare for.</strong> Same exam, same standard, same
            chief examiners. Anyone going in cold gets the same grade they
            got cold last time.
          </li>
        </ul>

        <h2>How to actually prepare for Nov/Dec</h2>
        <p>
          The honest answer is: practise past WAEC questions, under timed
          conditions, until the patterns are second nature. Bondzi gives you
          the full WASSCE past-question bank — nine years of papers across
          fourteen subjects — with an AI tutor that explains every wrong
          answer and a spaced-repetition schedule that drags shaky topics
          back until they&apos;re solid.
        </p>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/wassce-2026-timetable">
              WASSCE 2026 timetable, format, and how to plan your study
            </Link>
          </li>
          <li>
            <Link href="/blog/wassce-core-mathematics-syllabus">
              WASSCE Core Mathematics: full syllabus and how to prepare
            </Link>
          </li>
          <li>
            <Link href="/blog/waec-results-checker-ghana">
              How to check your WAEC results
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
