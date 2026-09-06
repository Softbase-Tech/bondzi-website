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
    slug: "check-shs-placement-cssps",
    title: "How to check your 2026 SHS placement on CSSPS, step by step",
    description:
      "Checking your SHS placement on cssps.gov.gh: what you need, the exact steps, what each outcome means, common errors and their fixes, and the scams to avoid.",
    excerpt:
      "Placements are out. What you need before you start, the exact steps on cssps.gov.gh, what each outcome means, and the placement scams to walk past.",
    publishedAt: "2026-09-06",
    readMinutes: 6,
    tags: ["CSSPS", "BECE", "SHS placement", "GES"],
  },
  {
    slug: "cssps-self-placement",
    title: "No placement or wrong school? How CSSPS self-placement works",
    description:
      "Unplaced after BECE, or placed somewhere that makes no sense? How the official CSSPS self-placement module works, how to choose well from the vacancy list, and what never to do.",
    excerpt:
      "Self-placement is a normal, official process thousands use every year. Who qualifies, how it works, and how to choose a school well under pressure.",
    publishedAt: "2026-09-06",
    readMinutes: 6,
    tags: ["CSSPS", "SHS placement", "BECE"],
  },
  {
    slug: "after-wassce-results",
    title: "Didn't get the WASSCE grades you needed? Your real options",
    description:
      "A clear plan for disappointing WASSCE results: reading your aggregate properly, nearby programmes, the Nov/Dec re-sit route, remarking and withheld results, and protecting the year.",
    excerpt:
      "A setback, not a verdict. How to read your results like an admissions officer, when a re-sit makes sense, and how to keep the year moving either way.",
    publishedAt: "2026-09-06",
    readMinutes: 7,
    tags: ["WASSCE", "Results", "Nov/Dec", "WAEC"],
  },
  {
    slug: "wassce-grades-explained",
    title: "WASSCE grades explained: A1 to F9, credits, and your aggregate",
    description:
      "What every WASSCE grade means, why C6 is the line that matters, and exactly how the best-six aggregate is calculated, with a worked example and the mistakes students make.",
    excerpt:
      "Is B3 good? Does D7 count? The full grade scale, why credits stop at C6, and how to compute your best-six aggregate correctly, with a worked example.",
    publishedAt: "2026-09-06",
    readMinutes: 6,
    tags: ["WASSCE", "Grades", "Aggregate", "WAEC"],
  },
  {
    slug: "ghana-university-admission-portals",
    title:
      "Ghana university admissions 2026/27: every official portal in one place",
    description:
      "The official admission pages for UG, KNUST, UCC, UEW, UPSA, UMaT and UHAS, what to prepare before applying, and the five application mistakes that repeat every year.",
    excerpt:
      "Results are in; applications begin. Every official portal linked, what you need before you open any of them, and the mistakes that cost admissions every cycle.",
    publishedAt: "2026-09-06",
    readMinutes: 6,
    tags: ["Admissions", "University", "UG", "KNUST"],
  },
  {
    slug: "knust-admissions-guide",
    title: "KNUST admissions: how applications and cut-offs really work",
    description:
      "Applying to KNUST: the official admissions page, the e-voucher process, programme subject requirements, how to read cut-off points properly, and what to do if your aggregate misses.",
    excerpt:
      "How KNUST admission actually works, minus the WhatsApp mythology: the e-voucher process, subject requirements, and how to read cut-off lists the right way.",
    publishedAt: "2026-09-06",
    readMinutes: 6,
    tags: ["KNUST", "Admissions", "University"],
  },
  {
    slug: "ges-academic-calendar",
    title:
      "GES 2026/27 academic calendar: reopening, vacation, BECE and WASSCE dates",
    description:
      "The current GES reopening and vacation dates for SHS and basic schools, the official source to verify against, and how to use the break without losing it.",
    excerpt:
      "When are schools reopening? The 2026/27 GES dates for SHS and basic school, plus BECE and WASSCE 2027 windows, with the official source linked.",
    publishedAt: "2026-09-06",
    updatedAt: "2026-09-06",
    readMinutes: 4,
    tags: ["GES", "Calendar", "SHS", "JHS"],
  },
  {
    slug: "ai-studying-wassce",
    title:
      "How Ghanaian students use AI to study for WASSCE, and where it goes wrong",
    description:
      "An honest guide from people who build AI study tools: where chatbots genuinely help WASSCE and BECE prep, the four ways they quietly fail students, and the rules that make AI useful.",
    excerpt:
      "AI is a phenomenal explainer and a terrible examiner. Where chatbots help, where they invent past questions that never existed, and the rules that keep you safe.",
    publishedAt: "2026-09-06",
    readMinutes: 7,
    tags: ["AI", "WASSCE", "Study tips"],
  },
  {
    slug: "wassce-novdec-2026-timetable",
    title:
      "WASSCE Nov/Dec 2026 timetable (official): dates for every Ghana paper",
    description:
      "The official WAEC timetable for the 2026 WASSCE for Private Candidates (Second Series), running 4 September to 29 October 2026, with dates and times for every major Ghana paper.",
    excerpt:
      "WAEC has released the final timetable, and the 'Nov/Dec' series actually runs 4 September to 29 October. Every Ghana paper, date by date.",
    publishedAt: "2026-09-04",
    readMinutes: 8,
    tags: ["WASSCE", "Nov/Dec", "WAEC", "Timetable"],
  },
  {
    slug: "how-to-use-bondzi",
    title: "How to use Bondzi: a step-by-step guide to smarter WAEC prep",
    description:
      "A complete walkthrough of the Bondzi app: past-question practice, AI explanations, spaced review, level tests, mock exams, and what's free versus paid.",
    excerpt:
      "From your first sign-up to your first full mock exam: how every part of Bondzi works, and the daily habit that actually moves grades.",
    publishedAt: "2026-09-04",
    readMinutes: 7,
    tags: ["Bondzi", "How-to", "Study plan"],
  },
  {
    slug: "ghana-new-curriculum-guide",
    title:
      "New SHS curriculum in Ghana: what changed, plus every official syllabus PDF",
    description:
      "A student's guide to Ghana's new SHS curriculum: whether it affects your exams, what changes in class, and direct download links to the official NaCCA syllabus for every subject.",
    excerpt:
      "Does the new curriculum affect your exam? Find out in one list, then download the official syllabus for every subject directly from NaCCA. No forwarded PDFs.",
    publishedAt: "2026-09-04",
    readMinutes: 8,
    tags: ["Curriculum", "NaCCA", "SHS", "Syllabus"],
  },
  {
    slug: "ghana-learning-materials-download",
    title:
      "curriculumresources.edu.gh: download every official SHS textbook free",
    description:
      "The official textbooks for Ghana's new curriculum are free. What learner materials are, why they beat pamphlets and forwarded PDFs, and where to download them for your level.",
    excerpt:
      "The official textbooks are free and most students don't know it. Where to download NaCCA's learner materials for your level, and how to actually study from them.",
    publishedAt: "2026-09-04",
    updatedAt: "2026-09-06",
    readMinutes: 6,
    tags: ["Learning materials", "NaCCA", "SHS", "JHS"],
  },
  {
    slug: "wassce-2026-timetable",
    title: "WASSCE 2026 timetable: dates, format, and how to plan your study",
    description:
      "A practical guide to the WASSCE 2026 series, the exam structure under WAEC, when papers typically run, and how to build a revision schedule that actually works.",
    excerpt:
      "When is the WASSCE 2026? How many papers? Here's the format every Ghanaian SHS candidate should know, plus a revision schedule that fits around school.",
    publishedAt: "2026-05-12",
    updatedAt: "2026-09-04",
    readMinutes: 6,
    tags: ["WASSCE", "WAEC", "Timetable", "Study plan"],
  },
  {
    slug: "waec-results-checker-ghana",
    title:
      "WAEC results checker: how to check your WASSCE 2026 results",
    description:
      "Step-by-step on how Ghanaian students check WAEC WASSCE and BECE results: where to go, what you need, and what to do if your result is withheld.",
    excerpt:
      "Where to go, what you need (serial number, PIN), what each grade means, and what to do if you can't find your result.",
    publishedAt: "2026-05-12",
    updatedAt: "2026-09-06",
    readMinutes: 5,
    tags: ["WAEC", "Results", "WASSCE", "BECE"],
  },
  {
    slug: "wassce-nov-dec-registration",
    title: "How to register for the WASSCE Nov/Dec series in Ghana",
    description:
      "Who can sit the WASSCE Nov/Dec series, when registration opens, what documents and fees you need, and how to choose the right subjects.",
    excerpt:
      "Private candidate, school leaver, or working professional? Here's how the WASSCE Nov/Dec registration actually works, and the mistakes to avoid.",
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
      "A full BECE 2026 preparation guide for Junior High School Form 3 students in Ghana, subjects, format, study routine, and the habits that move grades.",
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
