/**
 * Source of truth for the blog index, per-post metadata, and the sitemap.
 *
 * Each post's body lives in its own `app/blog/<slug>/page.tsx` so it gets a
 * dedicated statically-prerendered route with custom JSON-LD and OG metadata.
 * This manifest only carries listing-page data.
 *
 * Add a new post:
 *   1. Append an entry below.
 *   2. Create `app/blog/<slug>/page.tsx` using one of the existing posts as a
 *      template (import `<ArticleLayout>` from `components/blog/ArticleLayout`).
 *   3. `app/sitemap.ts` reads from this manifest, so the new URL appears
 *      automatically on next build.
 */

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  readMinutes: number;
  tags: string[];
}

export const POSTS: PostMeta[] = [
  {
    slug: "wassce-novdec-2026-timetable",
    title:
      "WASSCE Nov/Dec 2026 timetable (official): dates for every Ghana paper",
    description:
      "The official WAEC timetable for the 2026 WASSCE for Private Candidates (Second Series) — 4 September to 29 October 2026 — with dates and times for every major Ghana paper.",
    excerpt:
      "WAEC has released the final timetable — and the 'Nov/Dec' series actually runs 4 September to 29 October. Every Ghana paper, date by date.",
    publishedAt: "2026-09-04",
    readMinutes: 8,
    tags: ["WASSCE", "Nov/Dec", "WAEC", "Timetable"],
  },
  {
    slug: "how-to-use-bondzi",
    title: "How to use Bondzi: a step-by-step guide to smarter WAEC prep",
    description:
      "A complete walkthrough of the Bondzi app — past-question practice, AI explanations, spaced review, level tests, mock exams, and what's free versus paid.",
    excerpt:
      "From your first sign-up to your first full mock exam: how every part of Bondzi works, and the daily habit that actually moves grades.",
    publishedAt: "2026-09-04",
    readMinutes: 7,
    tags: ["Bondzi", "How-to", "Study plan"],
  },
  {
    slug: "ghana-new-curriculum-guide",
    title:
      "Ghana's new curriculum explained: what the SBC changes for students",
    description:
      "What Ghana's new Standards-Based Curriculum actually changes, who is on which curriculum right now, and where to download the official NaCCA syllabuses and learner materials.",
    excerpt:
      "Two curricula exist at once in Ghana right now. Here's what the new Standards-Based Curriculum changes, who it affects, and where the official documents live.",
    publishedAt: "2026-09-04",
    readMinutes: 7,
    tags: ["Curriculum", "NaCCA", "SHS", "BECE"],
  },
  {
    slug: "wassce-2026-timetable",
    title: "WASSCE 2026 timetable: dates, format, and how to plan your study",
    description:
      "A practical guide to the WASSCE 2026 series — the exam structure under WAEC, when papers typically run, and how to build a revision schedule that actually works.",
    excerpt:
      "When is the WASSCE 2026? How many papers? Here's the format every Ghanaian SHS candidate should know — plus a revision schedule that fits around school.",
    publishedAt: "2026-05-12",
    updatedAt: "2026-09-04",
    readMinutes: 6,
    tags: ["WASSCE", "WAEC", "Timetable", "Study plan"],
  },
  {
    slug: "waec-results-checker-ghana",
    title: "WAEC results checker Ghana: how to check WASSCE and BECE results",
    description:
      "Step-by-step on how Ghanaian students check WAEC WASSCE and BECE results: where to go, what you need, and what to do if your result is withheld.",
    excerpt:
      "Where to go, what you need (serial number, PIN), what each grade means, and what to do if you can't find your result.",
    publishedAt: "2026-05-12",
    updatedAt: "2026-09-04",
    readMinutes: 5,
    tags: ["WAEC", "Results", "WASSCE", "BECE"],
  },
  {
    slug: "wassce-nov-dec-registration",
    title: "How to register for the WASSCE Nov/Dec series in Ghana",
    description:
      "Who can sit the WASSCE Nov/Dec series, when registration opens, what documents and fees you need, and how to choose the right subjects.",
    excerpt:
      "Private candidate, school leaver, or working professional? Here's how the WASSCE Nov/Dec registration actually works — and the mistakes to avoid.",
    publishedAt: "2026-05-12",
    readMinutes: 7,
    tags: ["WASSCE", "Nov/Dec", "WAEC", "Private candidates"],
  },
  {
    slug: "wassce-core-mathematics-syllabus",
    title: "WASSCE Core Mathematics: full syllabus and how to prepare",
    description:
      "Every topic in the WASSCE Core Mathematics syllabus, paper structure (Paper 1 and Paper 2), the topics that decide most marks, and a 12-week prep plan.",
    excerpt:
      "Every topic Core Maths actually tests, the paper structure, the topics that decide most marks, and a 12-week plan to walk in calm.",
    publishedAt: "2026-05-12",
    readMinutes: 9,
    tags: ["WASSCE", "Core Mathematics", "Syllabus"],
  },
  {
    slug: "bece-2026-prep-guide",
    title: "BECE 2026: a complete prep guide for JHS 3 students",
    description:
      "A full BECE 2026 preparation guide for Junior High School Form 3 students in Ghana — subjects, format, study routine, and the habits that move grades.",
    excerpt:
      "Every BECE paper, how it's structured, when to start serious revision, and the small habits that decide a Stanine 1.",
    publishedAt: "2026-05-12",
    readMinutes: 8,
    tags: ["BECE", "JHS", "Study plan"],
  },
];

export function getPost(slug: string): PostMeta | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function postsSortedByDate(): PostMeta[] {
  return [...POSTS].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}
