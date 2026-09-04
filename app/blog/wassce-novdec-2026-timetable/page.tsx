import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { ArticleCta } from "../../../components/blog/ArticleCta";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "wassce-novdec-2026-timetable";
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
 * Dates, paper codes, and times below are transcribed from WAEC's
 * "WASSCE for Private Candidates, 2026 — Second Series — Final
 * International Timetable" (issued Headquarters, Accra, August 2026).
 * Subjects shown are the Ghana-available papers most candidates sit.
 * If WAEC issues a revision, update this table from the official PDF.
 */
const PAPERS: {
  date: string;
  subject: string;
  detail: string;
}[] = [
  {
    date: "Tue 22 Sep",
    subject: "Elective Mathematics",
    detail: "Paper 2 (Essay) 08:30–11:00 · Paper 1 (Objective) 13:00–14:30",
  },
  {
    date: "Wed 23 Sep",
    subject: "Financial Accounting",
    detail: "Paper 2 08:30–11:00 · Paper 1 11:00–12:00",
  },
  {
    date: "Wed 23 Sep",
    subject: "Government",
    detail: "Paper 2 (Essay) 13:00–15:00 · Paper 1 (Objective) 15:00–16:00",
  },
  {
    date: "Sat 26 Sep",
    subject: "Integrated Science",
    detail:
      "Paper 2 08:30–10:00 · Paper 1 10:00–11:00 · Paper 3 (Alt. to Practical) 13:30–15:30",
  },
  {
    date: "Mon 28 Sep",
    subject: "English Language — Orals (Paper 3)",
    detail: "1st set 08:30–09:15 · 2nd set 09:45–10:30",
  },
  {
    date: "Sat 3 Oct",
    subject: "Core Mathematics",
    detail: "Paper 2 (Essay) 08:30–11:00 · Paper 1 (Objective) 13:00–14:30",
  },
  {
    date: "Mon 5 Oct",
    subject: "Chemistry",
    detail:
      "Paper 2 08:30–10:30 · Paper 1 10:30–11:20 · Paper 3 (Alt. to Practical) 13:00–14:30",
  },
  {
    date: "Tue 6 Oct",
    subject: "Literature-in-English",
    detail: "Paper 2 08:30–10:30 · Paper 1 10:30–11:30",
  },
  {
    date: "Wed 7 Oct",
    subject: "Biology",
    detail:
      "Paper 2 08:30–10:10 · Paper 1 10:10–11:00 · Paper 3 (Alt. to Practical) 13:00–15:00",
  },
  {
    date: "Thu 8 Oct",
    subject: "Religious & Moral Education",
    detail: "Paper 2 08:30–09:30 · Paper 1 09:30–10:30",
  },
  {
    date: "Thu 8 Oct",
    subject: "Literature-in-English — Paper 3 (Practical Test)",
    detail: "13:00–15:00",
  },
  {
    date: "Fri 9 Oct",
    subject: "CRS · Islamic Studies · W.A. Traditional Religion",
    detail: "Morning sessions from 08:30 — check your subject's row",
  },
  {
    date: "Sat 10 Oct",
    subject: "Economics",
    detail: "Paper 2 (Essay) 08:30–10:30 · Paper 1 (Objective) 10:30–11:30",
  },
  {
    date: "Tue 13 Oct",
    subject: "History",
    detail: "Paper 2 (Essay) 08:30–10:30 · Paper 1 (Objective) 10:30–11:30",
  },
  {
    date: "Wed 14 Oct",
    subject: "Geography",
    detail:
      "Paper 2 08:30–10:30 · Paper 1 10:30–11:30 · Paper 3 (Practical & Physical) 13:30–15:20",
  },
  {
    date: "Thu 15 Oct",
    subject: "Physics",
    detail:
      "Papers 2 + 1 from 08:30 (morning session) · Paper 3 (Alt. to Practical) 13:00–15:45",
  },
  {
    date: "Sat 17 Oct",
    subject: "English Language",
    detail: "Paper 2 (Essay) 08:30–11:00 · Paper 1 (Objective) 13:00–14:20",
  },
  {
    date: "Mon 19 Oct",
    subject: "ICT",
    detail: "Paper 2 (Essay) 13:00–14:00 · Paper 1 (Objective) 14:00–15:00",
  },
  {
    date: "Tue 20 Oct",
    subject: "Foods & Nutrition",
    detail: "Paper 2 13:00–15:00 · Paper 1 15:00–15:50",
  },
  {
    date: "Wed 21 Oct",
    subject: "Agricultural Science",
    detail:
      "Paper 2 08:30–10:00 · Paper 1 10:00–11:00 · Paper 3 (Alt. to Practical) 13:00–14:30",
  },
  {
    date: "Fri 23 Oct",
    subject: "French",
    detail: "Paper 2 (Essay) 08:30–10:15 · Paper 1 (Objective) 10:15–11:30",
  },
  {
    date: "Sat 24 Oct",
    subject: "Social Studies",
    detail: "Paper 2 (Essay) from 08:30 · Paper 1 (Objective) 13:00–13:50",
  },
  {
    date: "Tue 27 Oct",
    subject: "ICT — Paper 3 (Practical)",
    detail: "1st set 08:30–10:30 · 2nd set 11:00–13:00",
  },
  {
    date: "Wed 28 Oct",
    subject: "General Knowledge-In-Art",
    detail: "Paper 2 08:30–10:00 · Paper 1 10:00–10:50",
  },
];

export default function Page() {
  const jsonLd = buildBlogPostingJsonLd(post);

  return (
    <>
      <ArticleLayout post={post}>
        <p>
          WAEC has released the <strong>final international timetable</strong>{" "}
          for the West African Senior School Certificate Examination for
          Private Candidates, 2026 — Second Series (the sitting most people
          call <strong>Nov/Dec</strong>, even in years when it starts
          earlier). The 2026 second series runs from{" "}
          <strong>Friday 4 September to Thursday 29 October 2026</strong> —
          notably earlier than the name suggests, so if you were pacing your
          revision toward a November start, your calendar just moved.
        </p>
        <p>
          This guide covers the Ghana papers most candidates sit. It is a
          transcription of WAEC&apos;s official timetable (issued from
          Headquarters, Accra, in August 2026) — always confirm your own
          papers against the official copy at{" "}
          <a href="https://waecgh.org/timetable/">waecgh.org</a> before exam
          week, and note this series is for candidates on the{" "}
          <strong>old curriculum</strong>.
        </p>

        <h2>The shape of the series</h2>
        <ul>
          <li>
            <strong>Fri 4 Sep 2026</strong> — practical planning sessions
            (Foods &amp; Nutrition, Home Management) open the series.
          </li>
          <li>
            <strong>7–26 Sep</strong> — project-work and orals window:
            Ghanaian-language orals, visual-arts project work, French oral,
            music performance. Dates and times for these are arranged by the
            Council and communicated to registered candidates directly.
          </li>
          <li>
            <strong>21 Sep – 29 Oct</strong> — the written papers, laid out
            below.
          </li>
        </ul>

        <h2>Ghana written papers — date by date</h2>
        <p>
          All times are GMT, which is Ghana&apos;s local time. Morning
          sessions start 08:30; afternoon sessions start 13:00 unless shown.
        </p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Subject</th>
              <th>Papers &amp; times</th>
            </tr>
          </thead>
          <tbody>
            {PAPERS.map((p, i) => (
              <tr key={i}>
                <td>{p.date}</td>
                <td>
                  <strong>{p.subject}</strong>
                </td>
                <td>{p.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <ArticleCta
          headline="Your paper has a date. Your prep should too."
          body="Practise the exact subjects above with thirty-four years of WAEC past questions and an AI tutor on every wrong answer — free to start."
        />

        <h2>How to read the official timetable</h2>
        <ul>
          <li>
            <strong>If the question paper and the timetable disagree on
            duration, the question paper wins.</strong> WAEC states this
            explicitly in the timetable notes.
          </li>
          <li>
            <strong>&ldquo;1st set / 2nd set&rdquo;</strong> means candidates
            are split into two sittings of the same paper (English orals, ICT
            practical, and a few others). Your centre tells you which set
            you&apos;re in — don&apos;t assume the earlier one.
          </li>
          <li>
            <strong>Project-work papers arrive early.</strong> Question
            papers for project work (Graphic Design, Sculpture, Textiles,
            Picture Making and other visual-arts subjects) are given to
            candidates about two weeks before the paper is due.
          </li>
          <li>
            <strong>Extra time:</strong> candidates with visual or hearing
            impairments are allowed one and a half times the standard
            duration.
          </li>
        </ul>

        <h2>Planning backwards from your dates</h2>
        <p>
          The most useful property of a released timetable is that it turns
          &ldquo;revise everything&rdquo; into a schedule. Two examples from
          the table:
        </p>
        <ul>
          <li>
            <strong>Core Mathematics sits on Saturday 3 October.</strong>{" "}
            Counting back, that leaves roughly five weeks from today — enough
            for one timed past paper a week with the remaining days spent
            fixing whatever that paper exposed. Our{" "}
            <Link href="/blog/wassce-core-mathematics-syllabus">
              Core Maths syllabus guide
            </Link>{" "}
            has the full topic list and a week-by-week plan.
          </li>
          <li>
            <strong>English Language splits across two dates</strong> — orals
            on 28 September, then the written papers on 17 October. Prepare
            the oral early; it&apos;s the paper candidates most often forget
            is coming.
          </li>
        </ul>
        <p>
          Not registered yet? Registration windows and requirements are in
          our{" "}
          <Link href="/blog/wassce-nov-dec-registration">
            Nov/Dec registration guide
          </Link>
          .
        </p>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/wassce-nov-dec-registration">
              How to register for the WASSCE Nov/Dec series
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
