import Image from "next/image";
import { SiteHeader } from "../components/site/SiteHeader";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpenText,
  Sparkles,
  Repeat,
  Flame,
  Trophy,
  GraduationCap,
  WifiOff,
  Smartphone,
  ShieldCheck,
  Quote,
  Plus,
} from "lucide-react";

const NAV = [
  { label: "Inside", href: "#inside" },
  { label: "Subjects", href: "#subjects" },
  { label: "FAQ", href: "#faq" },
  { label: "Blog", href: "/blog" },
];

const BECE_SUBJECTS = [
  "Mathematics",
  "English Language",
  "Integrated Science",
  "Social Studies",
  "Religious & Moral Education",
  "Basic Design & Technology",
  "Ghanaian Language",
  "French",
];

const WASSCE_CORE = [
  "Core Mathematics",
  "English Language",
  "Integrated Science",
  "Social Studies",
];

const WASSCE_ELECTIVES = [
  "Elective Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Geography",
  "Government",
  "History",
  "Literature in English",
  "ICT",
  "French",
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is Bondzi?",
    a: "Bondzi is an exam-prep app built for Ghanaian students sitting the BECE (Junior High School) and the WAEC WASSCE (Senior High School). It bundles nine years of past questions, an AI tutor that explains every wrong answer, and a spaced-repetition schedule that brings shaky topics back until they stick.",
  },
  {
    q: "Does Bondzi cover the WAEC WASSCE Nov/Dec exam for private candidates?",
    a: "Yes. The same WASSCE past-question bank, AI tutor, and spaced-repetition schedule serve school candidates sitting WASSCE in May/June and private candidates sitting the Nov/Dec series. The syllabus is identical across both windows — only the registration process and timetable differ.",
  },
  {
    q: "Which exams and subjects does Bondzi cover?",
    a: "All core BECE subjects — Mathematics, English Language, Integrated Science, Social Studies, RME, BDT, Ghanaian Language, and French — plus the most-sat WASSCE subjects, including Core Mathematics, Elective Mathematics, English Language, Integrated Science, Physics, Chemistry, Biology, Economics, Geography, Government, History, Literature in English, ICT, and French.",
  },
  {
    q: "Is Bondzi free?",
    a: "Yes. The full past-question bank, your daily review schedule, your subject progress, and the leaderboard are free forever. Bondzi Pro unlocks AI-written explanations on demand, AI-generated practice tests, and removes ads. Pro is paid monthly or annually in cedis through Paystack, by MTN, Telecel, or AirtelTigo mobile money.",
  },
  {
    q: "Does Bondzi work without internet?",
    a: "Yes — Bondzi caches your subjects, past questions, and progress on the device. You can answer a paper on a bus with no signal; the app reconciles your score and streak the next time it sees a network.",
  },
  {
    q: "How does the AI tutor work?",
    a: "When you get a question wrong, Bondzi generates a step-by-step explanation pitched at your syllabus level. The first time anyone needs an explanation for a question we generate it; from then on it's cached and instant for the next student. We fall back to a static expert explanation if the AI tutor is unavailable.",
  },
  {
    q: "Is Bondzi available on iPhone?",
    a: "We are Android-first because that is where Ghanaian students actually study. iOS is on the public waitlist and will follow once we hit our Android targets.",
  },
  {
    q: "Can Bondzi help me check my WAEC results?",
    a: "Bondzi is a prep tool, not the WAEC results portal — official WASSCE and BECE results are released through WAEC Ghana's checker at waecgh.org with a scratch card serial number and PIN. We publish guides on how to check results when each series is released; the best thing Bondzi can do is help you score well in the first place so checking is a celebration, not a stress event.",
  },
  {
    q: "Who builds Bondzi?",
    a: "Bondzi is built in Accra by Softbase Tech. We started from frustration with the photocopied past-paper prep market and a belief that a student in Wa should get the same prep tools as a student in East Legon.",
  },
];

const SUBJECTS = [
  "Core Mathematics",
  "English Language",
  "Integrated Science",
  "Social Studies",
  "Elective Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Geography",
  "History",
  "Literature in English",
  "ICT",
  "French",
  "Religious & Moral Education",
  "Basic Design & Technology",
  "Ghanaian Language",
];

const FEATURES = [
  {
    n: "01",
    Icon: BookOpenText,
    title: "Real past papers",
    body: "Nine years of WASSCE and BECE past questions, sorted by subject, topic, paper and year. The same questions your exam will look like — because they’re the ones your exam came from.",
    tag: "Question bank",
  },
  {
    n: "02",
    Icon: Sparkles,
    title: "Wrong answers, explained",
    body: "Miss a question and an AI tutor walks you through it — step by step, in the same language your teacher would use. Generated on demand, cached for the next student.",
    tag: "AI explanations",
  },
  {
    n: "03",
    Icon: Repeat,
    title: "Spaced repetition",
    body: "Every question you stumble on comes back tomorrow, then in three days, then a week. SM-2, the algorithm medical students use, tuned for SHS and JHS workloads.",
    tag: "SRS",
  },
  {
    n: "04",
    Icon: GraduationCap,
    title: "Bondzi Test",
    body: "Fresh AI-written questions calibrated to your syllabus level and weak topics. Not a question bank — a tutor that won’t repeat itself.",
    tag: "Adaptive",
  },
  {
    n: "05",
    Icon: Trophy,
    title: "Weekly leaderboard",
    body: "A weekly top-100 by exam type, refreshed every Monday. Visible enough to be motivating, anonymous enough to keep it kind.",
    tag: "Community",
  },
  {
    n: "06",
    Icon: Flame,
    title: "Streaks, XP, levels",
    body: "The boring habit of studying every day, dressed up in numbers that grow. Built so showing up is the win, not the score.",
    tag: "Habits",
  },
];

const GOALS = [
  {
    code: "SDG 4",
    name: "Quality Education",
    color: "#C5192D",
    points: [
      "Free tier covers every past paper and the full SRS — the parts that decide whether you pass.",
      "Targets 4.1 (secondary completion) and 4.6 (functional literacy and numeracy) directly.",
    ],
  },
  {
    code: "SDG 9",
    name: "Industry, Innovation & Infrastructure",
    color: "#FD6925",
    points: [
      "Offline-first caching and a sub-50MB build target 4.c — universal access to ICT on the phones students already own.",
      "Push and SMS fallback means a student without data still gets reminded to review.",
    ],
  },
  {
    code: "SDG 10",
    name: "Reduced Inequalities",
    color: "#DD1367",
    points: [
      "The student in Bolgatanga sees the same AI tutor as the student in East Legon. Pricing in cedis, paid via mobile money.",
      "Targets 10.2 — economic and social inclusion regardless of where a student went to JHS.",
    ],
  },
];

export default function Home() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://bondzi.online/",
      },
    ],
  };

  return (
    <main id="main" className="bg-bg text-ink">
      <SiteHeader items={NAV} />
      <Hero />
      <SubjectTicker />
      <Dispatch />
      <Inside />
      <Built />
      <Subjects />
      <Goals />
      <Voices />
      <Faq />
      <GetTheApp />
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 pt-10 sm:pt-14 lg:pt-20 pb-14 sm:pb-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
          {/* Left: editorial headline */}
          <div className="lg:col-span-7">
            <div className="kicker mb-5 sm:mb-6 flex items-center gap-3 flex-wrap">
              <span className="inline-block w-6 h-px bg-ink-mute" />
              Issue 01 · WASSCE &amp; BECE · Made in Ghana
            </div>

            <h1 className="display text-[36px] sm:text-[56px] md:text-[64px] lg:text-[80px] xl:text-[88px] font-medium text-ink">
              Every past question.
              <br />
              Every wrong answer
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">explained.</span>
                <span
                  aria-hidden
                  className="absolute left-0 right-0 bottom-1 h-2.5 sm:h-3 lg:h-4 bg-yellow z-0"
                />
              </span>
            </h1>

            <p className="mt-6 sm:mt-8 max-w-xl text-[15.5px] sm:text-[17px] leading-[1.6] text-ink-soft">
              Bondzi is the exam-prep companion built for Ghanaian SHS and JHS
              students. Nine years of past papers, an AI tutor that explains the
              questions you get wrong, and a review schedule that won&apos;t let
              you forget. On the bus. In a power cut. Offline.
            </p>

            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#get"
                className="inline-flex items-center gap-2 bg-orange text-paper px-5 h-12 rounded-full font-medium hover:bg-orange-deep transition-colors whitespace-nowrap"
              >
                Get Bondzi App
                <ArrowRight size={16} strokeWidth={2.25} />
              </a>
              <a
                href="#inside"
                className="inline-flex items-center gap-2 px-5 h-12 rounded-full border border-ink/15 hover:border-ink/40 transition-colors text-[15px] whitespace-nowrap"
              >
                See what&apos;s inside
              </a>
            </div>

            <dl className="mt-10 sm:mt-12 grid grid-cols-3 gap-4 sm:gap-6 max-w-lg">
              <Stat n="22" label="Subjects, BECE + WASSCE" />
              <Stat n="34 yrs" label="Past papers indexed" />
              <Stat n="∞" label="AI explanations" />
            </dl>
          </div>

          {/* Right: editorial portrait. Photo: a young Ghanaian student
              concentrating during a maths lesson in Accra. Unsplash. */}
          <div className="lg:col-span-5">
            <figure className="relative aspect-[4/5] w-full overflow-hidden rounded-md border border-rule bg-paper">
              <Image
                src="https://images.unsplash.com/photo-1744809495173-217ca4faa8bc?auto=format&fit=crop&w=1200&q=70"
                alt="A Ghanaian student in Accra concentrating during a maths lesson"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 480px, 100vw"
                priority
              />
              <figcaption className="absolute left-3 bottom-3 right-3 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] text-paper font-mono tracking-wide">
                <span className="bg-ink/70 backdrop-blur-sm px-2 py-1 rounded-sm">
                  ACCRA · GHANA
                </span>
                <span className="bg-ink/70 backdrop-blur-sm px-2 py-1 rounded-sm">
                  STUDYING: CORE MATHS
                </span>
              </figcaption>
            </figure>
            <p className="mt-3 text-[12px] text-ink-mute leading-snug">
              Bondzi was built for the seven hundred thousand Ghanaian students
              sitting BECE and WASSCE every year — and the millions who&apos;ve
              been before them.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <dt className="display text-[26px] sm:text-[30px] lg:text-[34px] font-medium leading-none text-ink">
        {n}
      </dt>
      <dd className="mt-2 text-[11px] sm:text-[12px] text-ink-mute leading-snug">
        {label}
      </dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Subject ticker                                                             */
/* -------------------------------------------------------------------------- */

function SubjectTicker() {
  const items = [...SUBJECTS, ...SUBJECTS];
  return (
    <section className="border-y border-rule bg-paper overflow-hidden">
      <div className="relative">
        <div className="marquee-track flex whitespace-nowrap py-4">
          {items.map((s, i) => (
            <span
              key={`${s}-${i}`}
              className="inline-flex items-center gap-3 px-6 text-[14px] text-ink-soft"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange" />
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Dispatch — editorial letter                                                */
/* -------------------------------------------------------------------------- */

function Dispatch() {
  return (
    <section className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-28">
      <div className="grid grid-cols-12 gap-6 sm:gap-8">
        <div className="col-span-12 lg:col-span-3">
          <div className="kicker">A letter, briefly</div>
          <h2 className="display mt-3 text-[26px] sm:text-[30px] lg:text-[36px] font-medium">
            Why we built it.
          </h2>
          <div className="mt-6 rule-h-strong" />
        </div>

        <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-[15px] sm:text-[16px] leading-[1.65] text-ink-soft">
          <p className="first-letter:display first-letter:text-[52px] sm:first-letter:text-[64px] first-letter:font-medium first-letter:float-left first-letter:leading-[0.85] first-letter:mr-2 first-letter:mt-1 first-letter:text-ink">
            In Ghana, two exams decide a great deal of a young person&apos;s
            future. The BECE sends fourteen-year-olds toward the senior school
            that will shape the next three years of their life. The WASSCE,
            three years later, decides who walks into a university, a
            polytechnic, or another path entirely.
          </p>
          <p>
            And yet, the prep market for these exams looks the way it did a
            decade ago. Photocopied past papers, weekend classes most families
            can&apos;t afford, and tutors who&apos;ll mark your answer but
            can&apos;t tell you why it was wrong. The students who pass tend to
            be the ones whose parents could pay for those answers.
          </p>
          <p>
            Bondzi takes the parts of expensive prep that actually move marks —
            the explanations, the steady review, the diagnostic of what
            you&apos;re weak at — and ships them in an app that opens in English
            on a phone that already lives in your pocket.
          </p>
          <p className="text-ink font-medium">
            We don&apos;t think a student in a JHS in the Upper East should get
            a worse prep experience than a student in an international school in
            Accra. So we built one tool, and we&apos;re giving the parts that
            matter away free.
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Inside — features                                                          */
/* -------------------------------------------------------------------------- */

function Inside() {
  return (
    <section id="inside" className="border-t border-rule">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 sm:gap-6">
          <div>
            <div className="kicker">Inside the app</div>
            <h2 className="display mt-3 text-[32px] sm:text-[44px] lg:text-[60px] font-medium leading-[1.02]">
              Six things,
              <br />
              built carefully.
            </h2>
          </div>
          <p className="text-ink-soft max-w-md text-[14.5px] sm:text-[15px]">
            We resisted the temptation to ship sixty features. These six are the
            ones we&apos;d miss if they were gone.
          </p>
        </div>

        <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-rule border border-rule">
          {FEATURES.map((f) => (
            <article
              key={f.n}
              className="bg-bg p-7 sm:p-8 lg:p-10 flex flex-col gap-4 sm:gap-5 min-h-[260px] sm:min-h-[300px] lg:min-h-[320px] hover:bg-paper transition-colors"
            >
              <header className="flex items-start justify-between">
                <span className="kicker">{f.tag}</span>
                <span className="display text-[28px] sm:text-[34px] leading-none text-ink-mute">
                  {f.n}
                </span>
              </header>
              <f.Icon
                size={26}
                strokeWidth={1.5}
                className="text-orange shrink-0"
              />
              <h3 className="display text-[22px] sm:text-[24px] font-medium leading-tight text-ink">
                {f.title}
              </h3>
              <p className="text-[14px] sm:text-[14.5px] text-ink-soft leading-[1.6]">
                {f.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Built for here — Ghana / offline                                           */
/* -------------------------------------------------------------------------- */

function Built() {
  return (
    <section id="built" className="bg-ink text-bg">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-5">
            <div className="kicker text-yellow">Reach</div>
            <h2 className="display mt-3 text-[32px] sm:text-[44px] lg:text-[60px] font-medium leading-[1.02]">
              Built where
              <br />
              it matters.
            </h2>
            <p className="mt-5 sm:mt-6 text-[15px] sm:text-[16px] leading-[1.65] text-bg/70">
              A student in Bawku shouldn&apos;t need a fibre connection to
              revise tonight&apos;s topic. Bondzi caches your subjects, your
              questions, and your offline answers locally — and reconciles when
              the network comes back.
            </p>

            <ul className="mt-8 sm:mt-10 space-y-5">
              <Trait
                Icon={WifiOff}
                title="Offline-first"
                body="Past questions, answers, and progress cached on device. Answer a paper on a bus with no signal; it syncs the next time you connect."
              />
              <Trait
                Icon={Smartphone}
                title="Built for the phones students own"
                body="Hermes-compiled, sub-fifty-megabyte install. Runs comfortably on the entry-level Android devices that dominate Ghana."
              />
              <Trait
                Icon={ShieldCheck}
                title="Mobile-money native"
                body="Subscriptions paid in cedis through Paystack — MTN, Telecel, AirtelTigo. No card required."
              />
            </ul>
          </div>

          {/* Photo collage: three confirmed Accra/Ghana scenes from Unsplash.
              Top — instructor teaching in an Accra classroom. Bottom-left —
              group of Ghanaian students sitting together. Bottom-right —
              students walking home from school in Accra. */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-3">
            <figure className="col-span-2 relative aspect-[16/10] overflow-hidden rounded-md border border-ink-soft/30">
              <Image
                src="https://images.unsplash.com/photo-1744809482817-9a9d4fc280af?auto=format&fit=crop&w=1600&q=70"
                alt="A teacher instructing students in a classroom in Accra, Ghana"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 700px, 100vw"
              />
            </figure>
            <figure className="relative aspect-square overflow-hidden rounded-md border border-ink-soft/30">
              <Image
                src="https://images.unsplash.com/photo-1687794504223-8bdc02e25ef6?auto=format&fit=crop&w=900&q=70"
                alt="A group of young Ghanaian students sitting together in Accra"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 340px, 50vw"
              />
            </figure>
            <figure className="relative aspect-square overflow-hidden rounded-md border border-ink-soft/30">
              <Image
                src="https://images.unsplash.com/photo-1744809463771-dca1b7bf46ac?auto=format&fit=crop&w=900&q=70"
                alt="Ghanaian students walking home after school in Accra"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 340px, 50vw"
              />
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

function Trait({
  Icon,
  title,
  body,
}: {
  Icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-4">
      <Icon size={22} strokeWidth={1.5} className="mt-1 text-yellow shrink-0" />
      <div>
        <div className="text-bg font-medium text-[15px]">{title}</div>
        <p className="text-bg/65 text-[14px] leading-[1.55] mt-1">{body}</p>
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Subjects — real headings for SEO                                           */
/* -------------------------------------------------------------------------- */

function Subjects() {
  return (
    <section id="subjects" className="border-t border-rule">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-28">
        <div className="grid grid-cols-12 gap-6 sm:gap-8 mb-10 sm:mb-12">
          <div className="col-span-12 lg:col-span-5">
            <div className="kicker">Every subject. Both exams.</div>
            <h2 className="display mt-3 text-[32px] sm:text-[44px] lg:text-[60px] font-medium leading-[1.02]">
              From BECE Form 3
              <br />
              to WASSCE Nov/Dec.
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-6 lg:col-start-7 text-[14.5px] sm:text-[15px] text-ink-soft leading-[1.65]">
            <p>
              Bondzi covers the full WAEC curriculum for both Ghanaian
              examinations. School candidates sitting WASSCE in May/June and
              private candidates registering for the WASSCE Nov/Dec series get
              the same question bank, the same AI tutor, and the same
              spaced-repetition schedule. BECE candidates in JHS 3 get the full
              set of core and elective papers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-rule border border-rule">
          <article className="bg-paper p-7 sm:p-8 lg:p-10">
            <header className="mb-5">
              <div className="kicker">BECE · JHS</div>
              <h3 className="display text-[22px] sm:text-[24px] font-medium text-ink mt-2 leading-tight">
                Basic Education Certificate Examination
              </h3>
              <p className="text-[13.5px] text-ink-soft mt-3 leading-[1.55]">
                Sat at the end of Junior High School. Decides which Senior High
                you walk into.
              </p>
            </header>
            <ul className="space-y-2 text-[14.5px] text-ink leading-[1.6]">
              {BECE_SUBJECTS.map((s) => (
                <li key={s} className="flex gap-2.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="bg-paper p-7 sm:p-8 lg:p-10">
            <header className="mb-5">
              <div className="kicker">WASSCE Core · SHS</div>
              <h3 className="display text-[22px] sm:text-[24px] font-medium text-ink mt-2 leading-tight">
                Required by every WASSCE candidate
              </h3>
              <p className="text-[13.5px] text-ink-soft mt-3 leading-[1.55]">
                The four core papers every candidate sits — May/June or Nov/Dec.
              </p>
            </header>
            <ul className="space-y-2 text-[14.5px] text-ink leading-[1.6]">
              {WASSCE_CORE.map((s) => (
                <li key={s} className="flex gap-2.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="bg-paper p-7 sm:p-8 lg:p-10">
            <header className="mb-5">
              <div className="kicker">WASSCE Electives · SHS</div>
              <h3 className="display text-[22px] sm:text-[24px] font-medium text-ink mt-2 leading-tight">
                Your three elective papers
              </h3>
              <p className="text-[13.5px] text-ink-soft mt-3 leading-[1.55]">
                The science, business, arts and humanities papers — pick three
                based on your programme.
              </p>
            </header>
            <ul className="space-y-2 text-[14.5px] text-ink leading-[1.6]">
              {WASSCE_ELECTIVES.map((s) => (
                <li key={s} className="flex gap-2.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <p className="mt-8 text-[12px] text-ink-mute max-w-3xl">
          Don&apos;t see your subject? We&apos;re adding new papers monthly.
          Email{" "}
          <a
            href="mailto:info@bondzi.online"
            className="text-orange hover:underline"
          >
            info@bondzi.online
          </a>{" "}
          and we&apos;ll prioritise.
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Goals — SDGs as annual-report appendix                                     */
/* -------------------------------------------------------------------------- */

function Goals() {
  return (
    <section id="goals" className="border-t border-rule">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-28">
        <div className="grid grid-cols-12 gap-6 sm:gap-8 mb-10 sm:mb-12">
          <div className="col-span-12 lg:col-span-5">
            <div className="kicker">What we measure ourselves against</div>
            <h2 className="display mt-3 text-[32px] sm:text-[44px] lg:text-[60px] font-medium leading-[1.02]">
              The goals,
              <br />
              named honestly.
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-6 lg:col-start-7 text-[14.5px] sm:text-[15px] text-ink-soft leading-[1.65]">
            <p>
              We aligned Bondzi against the UN Sustainable Development Goals
              that genuinely fit — not all seventeen as a marketing claim, but
              the three where shipping the product moves the indicator. Here
              they are, with the parts of Bondzi that earn each of them.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-rule border border-rule">
          {GOALS.map((g) => (
            <article key={g.code} className="bg-paper p-7 sm:p-8 lg:p-10">
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="inline-flex items-center justify-center text-paper font-bold text-[14px] w-12 h-12 rounded-sm"
                  style={{ backgroundColor: g.color }}
                >
                  {g.code.replace("SDG ", "")}
                </span>
                <div>
                  <div className="kicker">{g.code}</div>
                  <div className="font-medium text-[15px] text-ink leading-tight mt-0.5">
                    {g.name}
                  </div>
                </div>
              </div>
              <ul className="space-y-4 text-[14.5px] text-ink-soft leading-[1.6]">
                {g.points.map((p, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: g.color }}
                    />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-8 text-[12px] text-ink-mute max-w-3xl">
          Source: United Nations Department of Economic and Social Affairs,
          Sustainable Development Goals. We name only the goals where Bondzi has
          a credible contribution; we&apos;ll publish year-on-year indicators on
          a public dashboard from 2026.
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Voices — student-empowerment pull quote                                    */
/* -------------------------------------------------------------------------- */

function Voices() {
  return (
    <section className="bg-yellow-soft border-t border-rule">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-28">
        <div className="grid grid-cols-12 gap-6 sm:gap-10 items-start">
          <div className="col-span-12 lg:col-span-2">
            <Quote
              size={36}
              strokeWidth={1.25}
              className="text-orange sm:hidden"
            />
            <Quote
              size={48}
              strokeWidth={1.25}
              className="text-orange hidden sm:block"
            />
          </div>
          <blockquote className="col-span-12 lg:col-span-9 display text-[22px] sm:text-[32px] md:text-[36px] lg:text-[48px] leading-[1.18] font-medium text-ink">
            “The first time a question I got wrong was actually{" "}
            <em className="not-italic relative inline-block">
              explained
              <span
                aria-hidden
                className="absolute left-0 right-0 bottom-1 h-1.5 sm:h-2 lg:h-2.5 bg-orange/40 -z-0"
              />
            </em>{" "}
            — not just marked — I realised I&apos;d been studying the wrong way
            for two years.”
          </blockquote>
        </div>
        <div className="mt-6 sm:mt-8 lg:ml-[16.66%] text-[12px] sm:text-[13px] text-ink-soft">
          — Composite student account, drawn from twelve onboarding interviews ·
          Greater Accra, Ashanti, Upper East
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                        */
/* -------------------------------------------------------------------------- */

function Faq() {
  return (
    <section id="faq" className="border-t border-rule">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-28">
        <div className="grid grid-cols-12 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="col-span-12 lg:col-span-4">
            <div className="kicker">Frequently asked</div>
            <h2 className="display mt-3 text-[32px] sm:text-[44px] lg:text-[60px] font-medium leading-[1.02]">
              Things parents
              <br />
              and students ask.
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-7 lg:col-start-6">
            <ul className="divide-y divide-rule border-y border-rule">
              {FAQ.map((item, i) => (
                <li key={i} className="group">
                  <details className="py-5 sm:py-6 lg:py-7">
                    <summary className="flex items-start justify-between gap-4 sm:gap-6 cursor-pointer list-none">
                      <h3 className="display text-[18px] sm:text-[22px] lg:text-[26px] font-medium leading-tight text-ink">
                        {item.q}
                      </h3>
                      <Plus
                        size={20}
                        strokeWidth={1.5}
                        className="mt-1.5 sm:mt-2 text-ink-mute shrink-0 transition-transform group-open:rotate-45"
                      />
                    </summary>
                    <p className="mt-3 sm:mt-4 sm:pr-10 text-[14.5px] sm:text-[15.5px] leading-[1.65] text-ink-soft">
                      {item.a}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Get the app                                                                */
/* -------------------------------------------------------------------------- */

function GetTheApp() {
  return (
    <section id="get" className="border-t border-rule">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-28">
        <div className="paper-card rounded-lg p-6 sm:p-8 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="kicker">Get Bondzi App</div>
            <h2 className="display mt-3 text-[32px] sm:text-[44px] lg:text-[60px] font-medium leading-[1.02]">
              Pass your paper.
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">Then go further.</span>
                <span
                  aria-hidden
                  className="absolute left-0 right-0 bottom-1 h-2.5 sm:h-3 lg:h-4 bg-yellow z-0"
                />
              </span>
            </h2>
            <p className="mt-5 sm:mt-6 text-[15px] sm:text-[16px] leading-[1.65] text-ink-soft max-w-xl">
              Free to download. Free to revise. The AI tutor and Bondzi Test
              live behind Bondzi Pro — paid in cedis, by mobile money, and
              cheaper than a single weekend tutor session.
            </p>
            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3">
              <a
                href="https://expo.dev/artifacts/eas/oA5ZFub4WNxKkYEg5Wn2yn.apk"
                className="inline-flex items-center gap-2 bg-ink text-bg px-5 h-12 rounded-full font-medium hover:bg-orange transition-colors whitespace-nowrap text-[14px] sm:text-[15px]"
                rel="noopener"
              >
                Download Android APK
                <ArrowUpRight size={16} strokeWidth={2.25} />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-5 h-12 rounded-full border border-ink/15 hover:border-ink/40 transition-colors text-[14px] sm:text-[15px] whitespace-nowrap"
              >
                iOS · waitlist
              </a>
            </div>
            <p className="mt-3 text-[11.5px] sm:text-[12px] text-ink-mute leading-snug max-w-md">
              Direct APK · v1.0.0 · ~70&nbsp;MB. On Play Store soon. Enable
              install from unknown sources if your phone asks.
            </p>
          </div>
          <div className="lg:col-span-5 order-1 lg:order-2">
            <PhoneMock />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Phone mock — iPhone-style frame around the app screenshot                  */
/* -------------------------------------------------------------------------- */

function PhoneMock() {
  return (
    <div className="relative flex items-center justify-center py-2">
      {/* Soft brand-yellow wash behind the device. Earns its place by
          tying the phone visually to the section's accent colour and
          giving the device weight on the cream paper background. */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="w-[78%] aspect-square rounded-full bg-yellow opacity-50 blur-3xl" />
      </div>

      {/* Phone body */}
      <div className="relative w-full max-w-[280px] aspect-[1320/2868]">
        <div
          className="absolute inset-0 bg-ink rounded-[2.75rem]"
          style={{
            boxShadow:
              "0 30px 60px -18px rgba(20,20,20,0.45), 0 16px 28px -16px rgba(20,20,20,0.30)",
          }}
        >
          {/* Side buttons — small, dark, just enough to read as a phone */}
          <span
            aria-hidden
            className="absolute -left-[2px] top-[18%] w-[3px] h-[3.5%] bg-ink rounded-l-[2px]"
          />
          <span
            aria-hidden
            className="absolute -left-[2px] top-[25%] w-[3px] h-[7%] bg-ink rounded-l-[2px]"
          />
          <span
            aria-hidden
            className="absolute -left-[2px] top-[34%] w-[3px] h-[7%] bg-ink rounded-l-[2px]"
          />
          <span
            aria-hidden
            className="absolute -right-[2px] top-[28%] w-[3px] h-[10%] bg-ink rounded-r-[2px]"
          />

          {/* Screen — inset on all sides so the bezel reads cleanly */}
          <div className="absolute inset-[6px] rounded-[2.25rem] overflow-hidden bg-bg">
            <Image
              src="/iphone16ProMax.png"
              alt="Bondzi app home screen showing the daily streak, today's goal, an in-progress Mathematics exam and the subject grid"
              fill
              className="object-cover object-top"
              sizes="(min-width: 1024px) 280px, 70vw"
            />
          </div>
        </div>

        {/* Ground reflection / floor shadow — adds depth without being decorative noise */}
        <div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 bottom-[-18px] w-[70%] h-3 rounded-full bg-ink/20 blur-md"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-bg">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-8 sm:py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 sm:gap-8">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/brand/icon.png"
              alt=""
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="display text-[22px] font-medium">Bondzi</span>
          </div>
          <p className="mt-3 text-[13px] text-ink-mute max-w-sm leading-snug">
            Made in Accra. For students sitting BECE and WASSCE, anywhere in
            Ghana.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 sm:gap-x-10 gap-y-2 text-[13px] text-ink-soft">
          <a href="#inside" className="hover:text-ink py-1">
            Inside
          </a>
          <a href="#built" className="hover:text-ink py-1">
            Reach
          </a>
          <a href="#goals" className="hover:text-ink py-1">
            Goals
          </a>
          <a
            href="mailto:info@bondzi.online"
            className="hover:text-ink py-1 col-span-2 sm:col-span-1 truncate"
          >
            info@bondzi.online
          </a>
          <span className="text-ink-mute py-1">© 2026 Bondzi</span>
          <span className="text-ink-mute py-1">Softbase Tech, Ghana</span>
        </div>
      </div>
    </footer>
  );
}
