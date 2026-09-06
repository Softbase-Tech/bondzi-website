import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { ArticleCta } from "../../../components/blog/ArticleCta";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "knust-admissions-guide";
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
          KNUST is the second most searched education topic in Ghana, and
          for good reason: engineering, medicine, pharmacy, built
          environment, sciences and business under one roof in Kumasi. Here
          is how admission actually works, minus the WhatsApp mythology.
        </p>

        <h2>The only page that matters</h2>
        <p>
          Everything official lives at{" "}
          <a
            href="https://www.knust.edu.gh/admissions"
            target="_blank"
            rel="noopener noreferrer"
          >
            knust.edu.gh/admissions
          </a>
          : current forms, approved voucher vendors, deadlines, and the
          programme requirements document. If information did not come from
          there or from a KNUST office, verify it before acting on it.
        </p>

        <h2>How the application works</h2>
        <ol>
          <li>
            <strong>Buy the e-voucher</strong> from the banks and vendors
            listed on the admissions page. Keep the serial and PIN safe.
          </li>
          <li>
            <strong>Fill the online form</strong> with your personal
            details, your WASSCE index number and results, and your
            programme choices. Order your choices honestly: strongest
            realistic choice first, safer options after.
          </li>
          <li>
            <strong>Check your subject requirements per programme.</strong>{" "}
            Engineering wants credits in Elective Mathematics and Physics.
            Health sciences lean on Chemistry and Biology. The programme
            requirements document on the admissions page lists this per
            course, and it is the first thing to read, not the last.
          </li>
          <li>
            <strong>Submit and track.</strong> Keep your application number.
            Admission lists and portal status updates follow after the
            deadline closes.
          </li>
        </ol>

        <h2>About cut-off points</h2>
        <p>
          The internet is full of &ldquo;KNUST cut-off points&rdquo; lists.
          Read them the right way: a cut-off is a report of where admission
          stopped LAST cycle, driven by how many people applied and how
          strong they were. It moves every year. Competitive programmes
          (Medicine, Pharmacy, Law, some Engineering) sit near the very top
          of the scale, where aggregate 6 to 9 territory is normal.
          Moderately competitive programmes reach much further down the
          scale. Use last year&apos;s numbers to gauge your tier, then
          apply with a realistic spread of choices rather than betting
          everything on one line.
        </p>

        <ArticleCta
          headline="One grade often decides a cut-off."
          body="Aggregate 8 versus aggregate 10 can be a single subject's difference. If you're re-sitting to close that gap, Bondzi drills exactly the papers you need, free to start."
          cta="Close the gap free"
        />

        <h2>If your aggregate misses this year</h2>
        <ul>
          <li>
            <strong>Related programmes:</strong> the less-subscribed cousin
            of your target course is often one column away in the same
            college, and internal mobility exists once you are in.
          </li>
          <li>
            <strong>Re-sit the blocking subject:</strong> Nov/Dec lets you
            retake exactly the paper that hurt your aggregate. Start with{" "}
            <Link href="/blog/after-wassce-results">
              your options after results
            </Link>
            .
          </li>
          <li>
            <strong>Verify everything against the official page</strong>{" "}
            before paying anyone anything. KNUST does not admit through
            agents.
          </li>
        </ul>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/ghana-university-admission-portals">
              All the official admission portals in one place
            </Link>
          </li>
          <li>
            <Link href="/blog/wassce-grades-explained">
              How aggregates are computed
            </Link>
          </li>
          <li>
            <Link href="/blog/wassce-novdec-2026-timetable">
              Nov/Dec 2026 timetable for re-sits
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
