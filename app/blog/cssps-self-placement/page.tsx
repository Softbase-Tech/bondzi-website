import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { ArticleCta } from "../../../components/blog/ArticleCta";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "cssps-self-placement";
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
          You checked your placement and something went wrong: no school at
          all, or a school that makes no sense for your family. Take a
          breath. Thousands of candidates go through self-placement every
          single year, and it is a normal, official process, not a
          punishment. This guide explains who qualifies, how it works, and
          the mistakes that cost people good schools.
        </p>

        <h2>First, understand why it happened</h2>
        <p>
          The placement system matches your aggregate against the choices
          you made and the spaces each school has. When a school fills up
          with stronger aggregates before your number comes up, the system
          moves down your list. If none of your choices has space by then,
          you end up unplaced. It is arithmetic, not a judgement on you, and
          it says nothing about what you can do at SHS.
        </p>

        <h2>Who uses self-placement</h2>
        <ul>
          <li>
            <strong>Unplaced candidates.</strong> You qualified for
            placement but no school on your list had space at your
            aggregate.
          </li>
          <li>
            <strong>Candidates unhappy with their placement</strong> may
            have options depending on the year&apos;s rules, usually within
            the same self-placement window. Read the current instructions on
            the portal carefully because the rules are updated each year.
          </li>
        </ul>

        <h2>How self-placement works</h2>
        <ol>
          <li>
            Sign in on{" "}
            <a
              href="https://cssps.gov.gh"
              target="_blank"
              rel="noopener noreferrer"
            >
              cssps.gov.gh
            </a>{" "}
            with your BECE index number, the same way you checked placement.
          </li>
          <li>
            Open the self-placement module. It shows you the schools that
            still have vacancies, filtered to what your aggregate qualifies
            for.
          </li>
          <li>
            Pick from the available schools and programmes. You are choosing
            from real vacancies, so the list is shorter than the full school
            directory. Decide what matters most: programme, distance from
            home, boarding or day.
          </li>
          <li>
            Confirm your selection and print the placement form. Once
            confirmed, that is your school. Changing again is not a given,
            so treat the confirmation screen seriously.
          </li>
        </ol>

        <h2>How to choose well under pressure</h2>
        <ul>
          <li>
            <strong>Programme beats prestige.</strong> A General Science or
            Business slot at a solid school you have never heard of beats a
            programme you do not want at a famous name. WAEC grades your
            papers, not your school badge.
          </li>
          <li>
            <strong>Day at a nearby school can beat boarding far away.</strong>{" "}
            Factor in cost, transport, and how your family supports you.
          </li>
          <li>
            <strong>Involve an adult, but decide with information.</strong>{" "}
            Pull up the school on the GES lists, ask about it in your
            community, and check the programme you are choosing actually
            leads where you want to go.
          </li>
          <li>
            <strong>Do not wait until the window is nearly closed.</strong>{" "}
            Vacancies disappear as other candidates confirm. The earlier you
            pick, the more options you see.
          </li>
        </ul>

        <ArticleCta
          headline="Wherever you land, the exam is the same."
          body="WASSCE does not care which school's uniform you wear. Start building your foundation now with real past questions and an AI tutor on every wrong answer, free on Bondzi."
          cta="Start free"
        />

        <h2>What NOT to do</h2>
        <ul>
          <li>
            <strong>Do not pay anyone to &ldquo;secure&rdquo; a school.</strong>{" "}
            Placement runs on the system. People selling slots are selling
            air, and GES warns about this every year.
          </li>
          <li>
            <strong>Do not abandon the process</strong> because the first
            list disappointed you. An SHS place this year beats repeating
            the whole cycle.
          </li>
          <li>
            <strong>Do not hand your index number and PIN to strangers</strong>{" "}
            offering to &ldquo;help&rdquo;. They can confirm a school you
            never chose.
          </li>
        </ul>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/check-shs-placement-cssps">
              How to check your SHS placement
            </Link>
          </li>
          <li>
            <Link href="/blog/ghana-new-curriculum-guide">
              The new SHS curriculum, explained for students
            </Link>
          </li>
          <li>
            <Link href="/blog/ghana-learning-materials-download">
              Free official textbooks for your first year
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
