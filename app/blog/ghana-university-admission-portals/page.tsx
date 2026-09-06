import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { ArticleCta } from "../../../components/blog/ArticleCta";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "ghana-university-admission-portals";
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

const PORTALS: { name: string; href: string; note: string }[] = [
  {
    name: "University of Ghana (UG), Legon",
    href: "https://www.ug.edu.gh/admissions",
    note: "Undergraduate applications run through UG's admissions section; forms are bought as e-vouchers from listed banks and vendors.",
  },
  {
    name: "KNUST, Kumasi",
    href: "https://www.knust.edu.gh/admissions",
    note: "Science and tech heavyweight. E-voucher based application; see our dedicated KNUST guide below for the details.",
  },
  {
    name: "University of Cape Coast (UCC)",
    href: "https://ucc.edu.gh/admissions",
    note: "Strong in education, arts and sciences; distance programmes too.",
  },
  {
    name: "University of Education, Winneba (UEW)",
    href: "https://www.uew.edu.gh",
    note: "The teacher-training flagship; check the admissions menu for current forms.",
  },
  {
    name: "UPSA, Accra",
    href: "https://upsa.edu.gh",
    note: "Business and professional programmes; admissions under the Apply section.",
  },
  {
    name: "UMaT, Tarkwa",
    href: "https://umat.edu.gh",
    note: "Mining, petroleum and engineering specialist.",
  },
  {
    name: "UHAS, Ho",
    href: "https://www.uhas.edu.gh",
    note: "Health and allied sciences.",
  },
  {
    name: "GTEC (regulator)",
    href: "https://gtec.edu.gh",
    note: "The tertiary education regulator. Useful for confirming a private institution is accredited before you pay anything.",
  },
];

export default function Page() {
  const jsonLd = buildBlogPostingJsonLd(post);

  return (
    <>
      <ArticleLayout post={post}>
        <p>
          Results are in, and now the second race begins: applications.
          Every year, students lose money to fake application links and
          miss deadlines they never saw. This page keeps it simple: the
          official admission pages of Ghana&apos;s main public
          universities, what you need before applying, and the traps to
          avoid.
        </p>

        <h2>Before you open any portal</h2>
        <ul>
          <li>
            <strong>Your results details.</strong> Index number, exam year,
            and your grades. Most forms ask you to enter results exactly as
            they appear on your slip.
          </li>
          <li>
            <strong>Your aggregate, computed correctly.</strong> Best six:
            three core plus three best electives. If you are not sure how
            that works, read{" "}
            <Link href="/blog/wassce-grades-explained">
              our grades and aggregates guide
            </Link>{" "}
            first, because entering the wrong programme tier wastes an
            application.
          </li>
          <li>
            <strong>An e-voucher from an OFFICIAL vendor.</strong>{" "}
            Universities list their approved banks and vendors on their own
            admissions pages. Buy from those, keep the receipt, and never
            buy vouchers through social media resellers.
          </li>
        </ul>

        <h2>The official portals</h2>
        <ul>
          {PORTALS.map((p) => (
            <li key={p.href}>
              <a href={p.href} target="_blank" rel="noopener noreferrer">
                {p.name}
              </a>: {p.note}
            </li>
          ))}
        </ul>
        <p>
          Deadlines differ by institution and change every cycle, so treat
          any date you hear second-hand as a rumour until you see it on the
          university&apos;s own page.
        </p>

        <h2>Five application mistakes that repeat every year</h2>
        <ul>
          <li>
            <strong>Applying only to one dream programme.</strong> Most
            forms allow multiple choices. Use them all, ordered honestly
            against your aggregate.
          </li>
          <li>
            <strong>Ignoring subject requirements.</strong> Aggregates get
            the headlines, but a missing credit in a required subject is
            the more common rejection. Check the subject list per
            programme.
          </li>
          <li>
            <strong>Typos in the index number.</strong> The university
            verifies your results against WAEC with that number. One wrong
            digit and your brilliant results belong to nobody.
          </li>
          <li>
            <strong>Waiting for the deadline week.</strong> Portals slow
            down, banks queue up, and vouchers sell out at the worst
            moment.
          </li>
          <li>
            <strong>Paying &ldquo;connection men&rdquo;.</strong> Admissions
            run on published requirements. Anyone selling influence is
            selling nothing.
          </li>
        </ul>

        <ArticleCta
          headline="Applying with grades you're not proud of?"
          body="A Nov/Dec re-sit can upgrade specific subjects before the next admission cycle. Bondzi preps exactly the papers you're retaking, free to start."
          cta="Prep a re-sit free"
        />

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/knust-admissions-guide">
              KNUST admissions, in detail
            </Link>
          </li>
          <li>
            <Link href="/blog/wassce-grades-explained">
              Grades, credits and aggregates explained
            </Link>
          </li>
          <li>
            <Link href="/blog/after-wassce-results">
              Options when the grades fall short
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
