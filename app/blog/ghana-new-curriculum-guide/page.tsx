import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "../../../components/blog/ArticleLayout";
import { ArticleCta } from "../../../components/blog/ArticleCta";
import { getPost } from "../../../lib/blog/posts";
import { buildBlogPostingJsonLd } from "../../../lib/blog/jsonld";

const SLUG = "ghana-new-curriculum-guide";
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

const NACCA_HUB = "https://nacca.gov.gh/secondary-education-curriculum";
const PDF = "https://nacca.gov.gh/wp-content/uploads/2025/04";

const SYLLABUS_GROUPS: { group: string; subjects: [string, string][] }[] = [
  {
    group: "Languages",
    subjects: [
      ["English Language", `${PDF}/English-Language-Curriculum.pdf`],
      ["Literature in English", `${PDF}/Literature-in-English-Curriculum.pdf`],
      ["French", `${PDF}/French-Curriculum.pdf`],
      ["Arabic", `${PDF}/Arabic-Curriculum.pdf`],
      ["Spanish", `${PDF}/Spanish-Curriculum.pdf`],
    ],
  },
  {
    group: "Mathematics and Sciences",
    subjects: [
      ["Mathematics", `${PDF}/Mathematics-Curriculum.pdf`],
      ["Additional Mathematics", `${PDF}/Additional-Mathematics-Curriculum.pdf`],
      ["Biology", `${PDF}/Biology-Curriculum.pdf`],
      ["Chemistry", `${PDF}/Chemistry-Curriculum.pdf`],
      ["Physics", `${PDF}/Physics-Curriculum.pdf`],
      ["General Science", `${PDF}/GENERAL-SCIENCE-Curriculum.pdf`],
      ["Biomedical Science", `${PDF}/BIOMEDICAL-SCIENCE-Curriculum.pdf`],
    ],
  },
  {
    group: "Humanities and Social Sciences",
    subjects: [
      ["Economics", `${PDF}/Economics-Curriculum-Curriculum.pdf`],
      [
        "Geography",
        "https://nacca.gov.gh/wp-content/uploads/2025/11/Geography-Curriculum.pdf",
      ],
      ["Government", `${PDF}/Government-Curriculum.pdf`],
      ["History", `${PDF}/History-Curriculum.pdf`],
      ["Social Studies", `${PDF}/Social-Studies-Curriculum.pdf`],
      [
        "Religious and Moral Education",
        `${PDF}/RELIGIOUS-AND-MORAL-EDUCATION-Curriculum.pdf`,
      ],
    ],
  },
  {
    group: "Computing, Technology and Engineering",
    subjects: [
      ["Computing", `${PDF}/Computing-Curriculum.pdf`],
      ["ICT", `${PDF}/ICT-Curriculum.pdf`],
      ["Robotics", `${PDF}/ROBOTICS-Curriculum.pdf`],
      ["Engineering", `${PDF}/Engineering-Curriculum.pdf`],
      [
        "Manufacturing Engineering",
        `${PDF}/Manufacturing-Engineering-Curriculum.pdf`,
      ],
      [
        "Aviation and Aerospace Engineering",
        `${PDF}/Aviation-and-Aerospace-Engineering-Curriculum.pdf`,
      ],
      ["Applied Technology", `${PDF}/Applied-Technology-Curriculum.pdf`],
      [
        "Design and Communication Technology",
        `${PDF}/Design-Communication-Technology-Curriculum.pdf`,
      ],
    ],
  },
  {
    group: "Agriculture",
    subjects: [
      ["Agriculture", `${PDF}/Agriculture-Curriculum.pdf`],
      ["Agricultural Science", `${PDF}/Agricultural-Science-Curriculum.pdf`],
    ],
  },
  {
    group: "Arts, Sports and Others",
    subjects: [
      [
        "Art and Design Foundation",
        `${PDF}/Art-and-Design-Foundation-Curriculum.pdf`,
      ],
      ["Art and Design Studio", `${PDF}/Art-and-Design-Studio-Curriculum.pdf`],
      ["Performing Arts", `${PDF}/Performing-Arts-Curriculum.pdf`],
      [
        "Physical Education and Health (Core)",
        `${PDF}/PHYSICAL-EDUCATION-HEALTH-CORE-Curriculum.pdf`,
      ],
      [
        "Physical Education and Health (Elective)",
        `${PDF}/PHYSICAL-EDUCATION-HEALTH-Elective-Curriculum.pdf`,
      ],
    ],
  },
];

export default function Page() {
  const jsonLd = buildBlogPostingJsonLd(post);

  return (
    <>
      <ArticleLayout post={post}>
        <p>
          If you are in SHS right now, or heading there soon, you have heard
          people talk about the &ldquo;new curriculum&rdquo;. Your teachers
          mention it. It comes up on the news. Somebody in your WhatsApp group
          has forwarded a PDF claiming to be the new syllabus. Some of what
          you hear is true, some is outdated, and a lot of it is just
          confusing.
        </p>
        <p>
          This article clears it up. You will find out whether the new
          curriculum affects you and your exams, what actually changes in the
          classroom, and you can download the official syllabus for every
          subject directly from NaCCA, the government body that writes them.
          No third-party mirrors, no forwarded PDFs of unknown age.
        </p>

        <h2>First: does the new curriculum affect you?</h2>
        <p>Find yourself in this list before you read anything else.</p>
        <ul>
          <li>
            <strong>You are in JHS.</strong> Yes. Basic schools already teach
            the standards-based curriculum, and the BECE is set from it. When
            you enter SHS you will continue on the new system.
          </li>
          <li>
            <strong>You entered SHS 1 in the 2024/25 academic year or
            later.</strong> Yes. You are in the first group learning under
            the new SHS curriculum. The syllabuses linked below are yours.
          </li>
          <li>
            <strong>You are in SHS 2 or SHS 3 on the old system.</strong> No
            change for you. You finish your programme under the old
            curriculum and your WASSCE will be set from the old syllabus.
            Nobody moves you midway.
          </li>
          <li>
            <strong>You are a private or Nov/Dec candidate.</strong> No
            change either. WAEC prints &ldquo;Old Curriculum&rdquo; on the
            private-candidate timetable itself. If you are re-sitting, the
            syllabus you learned is still the syllabus you will be examined
            on. See the{" "}
            <Link href="/blog/wassce-novdec-2026-timetable">
              official Nov/Dec 2026 timetable
            </Link>{" "}
            for your dates.
          </li>
        </ul>

        <h2>What actually changes for you in class</h2>
        <p>
          Forget the policy language for a moment. Here is what the new
          curriculum means in practice, sitting at your desk:
        </p>
        <ul>
          <li>
            <strong>Your classwork counts.</strong> Under the old system,
            everything came down to the final exam. Under the new one,
            projects, group work and class exercises feed into your assessment
            through the school year. A bad term of &ldquo;I will fix it during
            revision&rdquo; costs you real marks now.
          </li>
          <li>
            <strong>Questions test whether you can use it, not just recall
            it.</strong> Expect fewer &ldquo;define the following&rdquo;
            questions and more problems where you apply what you learned to a
            situation. If your study habit is memorising notes the night
            before, this curriculum will punish that habit.
          </li>
          <li>
            <strong>There are subjects your seniors never had.</strong>{" "}
            Robotics. Aviation and Aerospace Engineering. Biomedical Science.
            Manufacturing Engineering. Spanish and Arabic as languages. If you
            are still in JHS, it is worth knowing these exist before you
            choose your SHS programme.
          </li>
          <li>
            <strong>ICT skills run through everything.</strong> Computing and
            ICT are no longer side subjects for one group of students. The
            curriculum expects every student to handle digital tools.
          </li>
        </ul>

        <h2>Why you should download your own syllabus</h2>
        <p>
          Most students never read the syllabus for their own subjects. That
          is a mistake, and it is an easy one to fix.
        </p>
        <p>
          The syllabus is the agreement between you and the examiner. It
          lists everything you can be asked, term by term and year by year.
          When your teacher rushes a topic, the syllabus tells you what you
          missed. When you revise, it is your checklist: go topic by topic
          and be honest about which ones you can handle and which ones you
          are avoiding. When a friend claims &ldquo;they removed that
          topic&rdquo;, you check the document instead of arguing.
        </p>
        <p>
          Each PDF below is the full official curriculum for that subject,
          published by NaCCA. Download the ones for your subjects and keep
          them on your phone. They cost nothing but data.
        </p>

        <h2>Download the official syllabus for every SHS subject</h2>
        <p>
          All of these live on{" "}
          <a href={NACCA_HUB} target="_blank" rel="noopener noreferrer">
            NaCCA&apos;s secondary education curriculum page
          </a>
          , which is the page to bookmark in case any document gets revised.
        </p>
        {SYLLABUS_GROUPS.map((g) => (
          <div key={g.group}>
            <h3>{g.group}</h3>
            <ul>
              {g.subjects.map(([name, href]) => (
                <li key={name}>
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {name}
                  </a>{" "}
                  (PDF)
                </li>
              ))}
            </ul>
          </div>
        ))}

        <ArticleCta
          headline="The syllabus tells you what to learn. Practice makes it stick."
          body="Bondzi gives you thirty-four years of real WAEC past questions, organised by topic, with an AI tutor that explains every answer you get wrong. Free to start."
        />

        <h2>What this means for BECE and WASSCE</h2>
        <p>
          WAEC examines you on the curriculum you were taught. That is the
          rule that settles every rumour.
        </p>
        <ul>
          <li>
            The BECE already follows the new basic-school curriculum.
          </li>
          <li>
            Students who started SHS under the old system will write the old
            WASSCE, and the Nov/Dec series for private candidates stays on
            the old syllabus for now.
          </li>
          <li>
            The first WASSCE based on the new SHS curriculum arrives when the
            new-curriculum students reach their final year. If that is you,
            the syllabuses above are the most reliable picture of what your
            exam can contain, because WAEC sets papers from them.
          </li>
        </ul>
        <p>
          One warning: do not study from old syllabus PDFs circulating in
          study groups if you are on the new curriculum, and do not study
          from the new ones if you are writing an old-curriculum paper.
          Matching the right document to your own exam is half the battle.
        </p>

        <h2>Syllabus in hand. What about textbooks?</h2>
        <p>
          The syllabus tells you what to learn. The learning materials are
          the official books that actually teach it, and NaCCA publishes
          those too, free to download. We put together a separate guide on
          where to find them:{" "}
          <Link href="/blog/ghana-learning-materials-download">
            where to download the official learning materials
          </Link>
          .
        </p>

        <h2>Next reads</h2>
        <ul>
          <li>
            <Link href="/blog/ghana-learning-materials-download">
              Where to download the official learning materials for the new
              curriculum
            </Link>
          </li>
          <li>
            <Link href="/blog/wassce-novdec-2026-timetable">
              The official WASSCE Nov/Dec 2026 timetable
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
