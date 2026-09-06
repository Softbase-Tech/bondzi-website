import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { ArticleCta } from "../../../components/blog/ArticleCta";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "ai-studying-wassce";
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
          Walk through any SHS campus and you will find students studying
          with AI chatbots. Some of it genuinely helps. Some of it is
          quietly wrecking exam preparation, and the students involved have
          no idea. We build AI study tools for a living, so here is the
          honest version of what AI is good at for WASSCE and BECE prep, and
          exactly where it goes wrong.
        </p>

        <h2>Where a chatbot genuinely helps</h2>
        <ul>
          <li>
            <strong>Re-explaining a concept you already met in class.</strong>{" "}
            If your teacher&apos;s explanation of osmosis did not land,
            asking for the same idea in different words, with a local
            example, is a real win. Explanation on demand is the single best
            thing this technology does.
          </li>
          <li>
            <strong>Breaking a big topic into a study plan.</strong>{" "}
            &ldquo;I have three weeks to revise Core Maths, list the topics
            in order of exam weight&rdquo; produces a useful skeleton to
            refine.
          </li>
          <li>
            <strong>Practising English composition.</strong> Asking for
            feedback on an essay draft, then rewriting it yourself, is
            legitimate practice. Asking it to write the essay is not, and
            the difference decides whether you improve.
          </li>
        </ul>

        <h2>Where it quietly fails WASSCE students</h2>
        <ul>
          <li>
            <strong>It does not know your syllabus.</strong> General
            chatbots are trained on the whole internet, which means a
            physics answer might use methods or notation your WAEC examiner
            does not expect, or cover a topic version taught in another
            country entirely. It sounds right. It is confidently off-
            syllabus.
          </li>
          <li>
            <strong>It invents things.</strong> Ask a chatbot for
            &ldquo;WASSCE 2019 Question 4&rdquo; and it will often produce a
            convincing question that never existed, with a marking scheme to
            match. Practising on invented past questions is worse than not
            practising: you calibrate to a fake exam.
          </li>
          <li>
            <strong>It agrees with your mistakes.</strong> Push back on a
            correct answer twice and many chatbots fold and endorse your
            wrong one. An examiner will not.
          </li>
          <li>
            <strong>It removes the struggle that makes memory.</strong>{" "}
            Reading a perfect AI answer feels like learning. It is not.
            Learning happens when you attempt, fail, and correct. If the AI
            attempts everything, you have watched someone else revise.
          </li>
        </ul>

        <h2>The rules that make AI actually useful</h2>
        <ol>
          <li>
            <strong>Attempt first, ask second.</strong> Never ask about a
            question you have not tried on paper.
          </li>
          <li>
            <strong>Practise on real past questions only.</strong> Your
            question bank must come from actual WAEC papers, not from a
            model&apos;s imagination.
          </li>
          <li>
            <strong>Anchor everything to the syllabus.</strong> If an
            explanation introduces a method your syllabus does not use,
            park it. The examiner marks the syllabus, not the internet.
          </li>
          <li>
            <strong>Let something measure you.</strong> A chat thread has no
            memory of what you got wrong last Tuesday. Real prep needs a
            system that tracks your weak topics and brings them back until
            they stop being weak.
          </li>
        </ol>

        <ArticleCta
          headline="This is exactly why we built Bondzi differently."
          body="Real WAEC past questions, an AI tutor grounded in the actual syllabus, and a review system that remembers your weak topics. The useful parts of AI, minus the traps. Free to start."
          cta="Try it free"
        />

        <h2>The bottom line</h2>
        <p>
          AI is a phenomenal explainer and a terrible examiner. Use it to
          understand, never to replace attempting, and make sure the
          questions you practise on and the syllabus you follow come from
          WAEC, not from a model&apos;s best guess. Do that, and you get
          the upside your classmates are missing while dodging the traps
          they are falling into.
        </p>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/how-to-use-bondzi">
              How to use Bondzi, step by step
            </Link>
          </li>
          <li>
            <Link href="/blog/wassce-core-mathematics-syllabus">
              Core Maths syllabus and a 12-week plan
            </Link>
          </li>
          <li>
            <Link href="/blog/ghana-learning-materials-download">
              Free official textbooks to study from
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
