import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { ArticleCta } from "../../../components/blog/ArticleCta";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "wassce-grades-explained";
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

const GRADES: [string, string, string][] = [
  ["A1", "Excellent", "1"],
  ["B2", "Very good", "2"],
  ["B3", "Good", "3"],
  ["C4", "Credit", "4"],
  ["C5", "Credit", "5"],
  ["C6", "Credit", "6"],
  ["D7", "Pass", "7"],
  ["E8", "Pass", "8"],
  ["F9", "Fail", "9"],
];

export default function Page() {
  const jsonLd = buildBlogPostingJsonLd(post);

  return (
    <>
      <ArticleLayout post={post}>
        <p>
          Ten minutes after results drop, the questions start. Is B3 good?
          Does D7 count? What is an aggregate and why is your cousin saying
          &ldquo;aggregate 8&rdquo; like it is a football score? Here is the
          whole grading system, explained once and properly.
        </p>

        <h2>The grade scale</h2>
        <p>
          Every WASSCE subject is graded from A1 down to F9. The number is
          the value used in aggregate calculations, and lower is better.
        </p>
        <table>
          <thead>
            <tr>
              <th>Grade</th>
              <th>Meaning</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {GRADES.map(([g, m, v]) => (
              <tr key={g}>
                <td>
                  <strong>{g}</strong>
                </td>
                <td>{m}</td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          The line that matters most: <strong>A1 through C6 are credit
          passes.</strong> University and most tertiary admissions require
          credits, meaning C6 or better, in the required subjects. D7 and E8
          are passes but do not count as credits, which is why a D7 in a
          required subject blocks admission even though it is technically a
          pass.
        </p>

        <h2>How your aggregate is calculated</h2>
        <p>
          Your aggregate is the sum of the grade values of your{" "}
          <strong>best six subjects</strong>: your three core subjects
          (English Language, Core Mathematics, and the better of Integrated
          Science or Social Studies) plus your three best electives. Lower
          totals are better. Six A1s give the famous aggregate 6.
        </p>
        <p>
          Worked example: English B3, Core Maths B2, Integrated Science C4,
          Social Studies B3, and electives A1, B2, C5. Core picks: English
          (3) + Maths (2) + Social Studies (3, better than Science&apos;s
          4). Electives: A1 (1) + B2 (2) + C5 (5). Aggregate = 3 + 2 + 3 +
          1 + 2 + 5 = <strong>16</strong>.
        </p>
        <p>
          Two things students routinely get wrong: the third core slot takes
          the BETTER of Science or Social Studies, and only three electives
          count no matter how many you sat. A weak fourth elective simply
          drops out of the calculation.
        </p>

        <ArticleCta
          headline="Aggregates are won one grade at a time."
          body="Moving one subject from C4 to B2 changes your aggregate more than any amount of worrying. Bondzi shows you exactly which topics are costing you marks, free to start."
        />

        <h2>What programmes actually require</h2>
        <p>
          Every university publishes minimum requirements per programme,
          usually credits in specific subjects plus a competitive aggregate
          cut-off that changes year to year with demand. Two cautions:
        </p>
        <ul>
          <li>
            <strong>Cut-offs are not fixed.</strong> The number that
            admitted someone two years ago is history, not policy. Check the
            programme&apos;s current published requirements on the
            university&apos;s own admissions page. Our{" "}
            <Link href="/blog/ghana-university-admission-portals">
              admission portals guide
            </Link>{" "}
            links the official pages.
          </li>
          <li>
            <strong>Subject requirements bite harder than aggregates.</strong>{" "}
            A brilliant aggregate with a D7 in a required elective still
            fails the requirement. Read the subject list for your programme
            line by line.
          </li>
        </ul>

        <h2>If the grades are not enough</h2>
        <p>
          You can re-sit specific subjects at the Nov/Dec WASSCE for Private
          Candidates and combine results. Start with{" "}
          <Link href="/blog/after-wassce-results">
            our guide to your options after results
          </Link>
          , then the{" "}
          <Link href="/blog/wassce-nov-dec-registration">
            Nov/Dec registration walkthrough
          </Link>
          .
        </p>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/after-wassce-results">
              Didn&apos;t get the grades you needed? Your options
            </Link>
          </li>
          <li>
            <Link href="/blog/waec-results-checker-ghana">
              How to check WAEC results
            </Link>
          </li>
          <li>
            <Link href="/blog/ghana-university-admission-portals">
              University admission portals and requirements
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
