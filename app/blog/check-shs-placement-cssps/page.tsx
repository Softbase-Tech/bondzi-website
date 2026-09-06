import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { ArticleCta } from "../../../components/blog/ArticleCta";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "check-shs-placement-cssps";
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
          Placements are out, and if your house is anything like most homes in
          Ghana this week, somebody is refreshing the CSSPS portal on three
          different phones. Here is exactly how to check your SHS placement,
          what you need before you start, and what each result on the screen
          actually means.
        </p>

        <h2>What you need before checking</h2>
        <ul>
          <li>
            <strong>Your BECE index number.</strong> It is on your exam ID
            card and your results slip. The full format includes your year,
            so have the complete number ready.
          </li>
          <li>
            <strong>A placement checker card or e-voucher.</strong> Sold at
            registered vendors and through the official channels listed on
            the CSSPS website. Buy from official sources only. Every
            placement season, fake cards and fake &ldquo;checker
            agents&rdquo; on WhatsApp collect money and deliver nothing.
          </li>
          <li>
            <strong>A phone or any browser.</strong> You do not need a
            computer cafe. The portal works on a normal phone browser.
          </li>
        </ul>

        <h2>Checking your placement, step by step</h2>
        <ol>
          <li>
            Go to{" "}
            <a
              href="https://cssps.gov.gh"
              target="_blank"
              rel="noopener noreferrer"
            >
              cssps.gov.gh
            </a>
            , the official Computerised School Selection and Placement System
            portal. Type the address yourself instead of following links from
            group chats. Fake portals show up every year.
          </li>
          <li>Select the option to check placement.</li>
          <li>
            Enter your BECE index number and the serial number and PIN from
            your checker card.
          </li>
          <li>
            Your placement loads: the school, your programme, and your
            residential status (boarding or day).
          </li>
          <li>
            Print or screenshot the placement form. Schools ask for it at
            admission, and you will want a copy if any dispute comes up
            later.
          </li>
        </ol>

        <h2>What the different outcomes mean</h2>
        <ul>
          <li>
            <strong>Placed in one of your choices.</strong> The best case.
            Follow the reporting instructions on the placement form, note the
            admission dates, and check the school&apos;s prospectus for what
            to bring.
          </li>
          <li>
            <strong>Placed, but not in a school you chose.</strong> The
            system fills remaining spaces based on your aggregate and
            available slots. You can accept it, or look into the
            self-placement window if you want to try for a different school.
            We cover that in detail in{" "}
            <Link href="/blog/cssps-self-placement">
              our self-placement guide
            </Link>
            .
          </li>
          <li>
            <strong>Not placed at all.</strong> Do not panic, and do not pay
            anyone who promises a &ldquo;slot&rdquo;. Unplaced candidates use
            the official self-placement module to pick from schools with
            vacancies. Again, the{" "}
            <Link href="/blog/cssps-self-placement">self-placement guide</Link>{" "}
            walks through it.
          </li>
        </ul>

        <ArticleCta
          headline="Placed? SHS starts sooner than you think."
          body="The students who cruise in SHS are the ones who kept their JHS knowledge warm. Bondzi has thirty-four years of real past questions to keep you sharp before you report, free."
          cta="Start free"
        />

        <h2>Common problems and fixes</h2>
        <ul>
          <li>
            <strong>&ldquo;Invalid index number.&rdquo;</strong> Check the
            year suffix and every digit. If it still fails, confirm the
            number against your BECE results slip, not your memory.
          </li>
          <li>
            <strong>Used card / PIN not working.</strong> A checker card
            works for a limited number of checks on one candidate. If a
            vendor sold you a used card, report to the vendor and buy from an
            official source.
          </li>
          <li>
            <strong>Portal not loading.</strong> Placement week traffic is
            brutal. Early mornings and late nights load faster than mid-day.
            Keep trying; your placement does not expire because the site is
            slow.
          </li>
          <li>
            <strong>Details look wrong.</strong> Name spelling issues and
            similar errors are handled through GES and your JHS, not through
            anyone charging a fee on WhatsApp. Start with your headteacher.
          </li>
        </ul>

        <h2>One warning worth repeating</h2>
        <p>
          Nobody can change your placement for money. Every placement season,
          families lose real money to people claiming they can move a child
          into a top school for a fee. Placement disputes go through GES and
          the official protest channels, full stop. If an offer sounds like a
          shortcut, it is a scam.
        </p>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/cssps-self-placement">
              No placement or wrong school? How self-placement works
            </Link>
          </li>
          <li>
            <Link href="/blog/bece-2026-prep-guide">
              BECE prep guide for the next batch
            </Link>
          </li>
          <li>
            <Link href="/blog/ghana-new-curriculum-guide">
              The new SHS curriculum you are about to meet
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
