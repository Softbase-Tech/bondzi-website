import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { ArticleCta } from "../../../components/blog/ArticleCta";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "how-to-use-bondzi";
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
 * Screenshot figure with caption. All images are PLACEHOLDERS —
 * drop the real screenshots into /public/blog/how-to/ using the same
 * filenames and they render without touching this file.
 */
function Shot({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="not-prose my-6">
      <div className="relative w-full max-w-[420px] mx-auto aspect-[9/16] overflow-hidden rounded-lg border border-rule bg-paper">
        <Image src={src} alt={alt} fill className="object-cover" sizes="420px" />
      </div>
      <figcaption className="mt-2 text-center text-[12.5px] text-ink-mute">
        {caption}
      </figcaption>
    </figure>
  );
}

export default function Page() {
  const jsonLd = buildBlogPostingJsonLd(post);

  return (
    <>
      <ArticleLayout post={post}>
        <p>
          Bondzi has one job: get you a better grade in the WASSCE or BECE
          than you&apos;d get without it. This is the full tour — from
          creating an account to the AI features — so you spend your study
          time studying, not figuring out an app.
        </p>

        <h2>Step 1 — Create your free account</h2>
        <p>
          Open <a href="https://app.bondzi.online/register">the Bondzi app</a>{" "}
          in any phone browser — nothing to install. Sign up with your email
          or a Ghana phone number, tell Bondzi which exam you&apos;re sitting
          (BECE, WASSCE, or Nov/Dec), and pick your subjects. Everything from
          here is shaped around that choice: your question bank, your
          leaderboard, your review schedule.
        </p>
        <Shot
          src="/blog/how-to/step-1-register.png"
          alt="The Bondzi registration screen with exam type selection"
          caption="Pick your exam once — Bondzi builds everything else around it."
        />

        <h2>Step 2 — Practise real past questions</h2>
        <p>
          From the home screen, choose a subject and start a practice
          session. Every question is a real WAEC past question — thirty-four
          years of them, sorted by subject, topic, paper and year. Answer at
          your own pace or set a timer to simulate exam pressure. Your score,
          your streak, and your progress save automatically — even offline;
          the app syncs when you next have network.
        </p>
        <Shot
          src="/blog/how-to/step-2-practice.png"
          alt="A practice session showing a past question with four options"
          caption="Real past questions, one tap from the home screen."
        />

        <h2>Step 3 — Learn from every wrong answer</h2>
        <p>
          This is the part photocopied past papers can&apos;t do. When you
          get a question wrong, tap <strong>Explain</strong> and the AI tutor
          walks you through it: the concept being tested, the working step by
          step, and why each wrong option tempts people. Every free account
          includes 10 AI explanations a month; Plus and Pro unlock the full
          tutor.
        </p>
        <Shot
          src="/blog/how-to/step-3-explanation.png"
          alt="An AI explanation breaking down a mathematics question step by step"
          caption="Wrong answers become the most useful part of your session."
        />

        <ArticleCta
          headline="Easier to try than to read about."
          body="Create a free account and do your first ten questions — it takes less time than finishing this article."
          cta="Try it now"
        />

        <h2>Step 4 — Let the review schedule chase you</h2>
        <p>
          Questions you miss don&apos;t disappear — they come back tomorrow,
          then in three days, then a week, until you stop missing them. This
          is spaced repetition, the same technique medical students use to
          memorise anatomy, tuned for WAEC workloads. Your daily review queue
          lives on the home screen; clearing it every day is the single
          highest-value habit in the app.
        </p>
        <Shot
          src="/blog/how-to/step-4-review.png"
          alt="The daily review queue showing questions due today"
          caption="A few minutes a day keeps weak topics from staying weak."
        />

        <h2>Step 5 — Take a Level Test to find your weak topics</h2>
        <p>
          Level Tests are fresh, AI-written questions calibrated to your
          syllabus level — not recycled past questions. They exist to answer
          one question honestly: <em>which topics would lose you marks if
          the exam were tomorrow?</em> After each test, your weakness report
          updates and your recommended next steps change with it.
        </p>
        <Shot
          src="/blog/how-to/step-5-level-test.png"
          alt="A level test result showing strong and weak topics by subject"
          caption="Stop guessing what to revise — measure it."
        />

        <h2>Step 6 — Sit a full mock before the real thing</h2>
        <p>
          When exam season approaches, switch to <strong>mock exams</strong>:
          full-length, timed papers drawn from the real question bank. The
          post-exam review breaks down what went well and what to fix, topic
          by topic. Walking into the hall having already sat the paper five
          times — that&apos;s the feeling Bondzi is built for.
        </p>
        <Shot
          src="/blog/how-to/step-6-mock.png"
          alt="A completed mock exam result with a topic-by-topic breakdown"
          caption="The exam should feel like a rerun."
        />

        <h2>Streaks, XP, and the leaderboard</h2>
        <p>
          Every day you practise extends your streak; every correct answer
          earns XP; and the weekly top-100 leaderboard (per exam type,
          refreshed Mondays) gives the whole thing a pulse. None of it
          affects your grade directly — but showing up daily is what moves
          grades, and the streak is there to make showing up feel like
          winning.
        </p>

        <h2>Free, Plus, and Pro — what&apos;s what</h2>
        <ul>
          <li>
            <strong>Free</strong> — the full past-question bank, daily
            review, progress tracking, the leaderboard, and 10 AI
            explanations every month. Free forever.
          </li>
          <li>
            <strong>Plus &amp; Pro</strong> — the full AI tutor, AI Level
            Tests, and an ad-free experience. Paid in cedis by MTN, Telecel,
            or AirtelTigo mobile money. See{" "}
            <Link href="/pricing">current pricing</Link>.
          </li>
        </ul>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/wassce-novdec-2026-timetable">
              The official WASSCE Nov/Dec 2026 timetable
            </Link>
          </li>
          <li>
            <Link href="/blog/wassce-core-mathematics-syllabus">
              WASSCE Core Mathematics: full syllabus and how to prepare
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
