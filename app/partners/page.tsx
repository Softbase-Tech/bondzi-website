import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Coins,
  GraduationCap,
  Handshake,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { TrackedLink } from "@/components/analytics/TrackedLink";

/**
 * `/partners` — marketing page for the partner programme. Two
 * audiences we're speaking to:
 *   1. Content creators / influencers already reaching Ghanaian
 *      students on Instagram / TikTok / WhatsApp who monetise
 *      poorly today.
 *   2. Community tutors / coaches with a WhatsApp study group
 *      who'd hand-recommend Bondzi anyway.
 *
 * We show the actual rates + payout mechanics up front (nobody signs
 * up to a partner programme without knowing what they'll earn) and
 * keep the FAQ short + specific.
 */
export const metadata: Metadata = {
  title: "Partner programme — Bondzi",
  description:
    "Earn cash by referring Ghanaian students to Bondzi. GHS 30 per WASSCE Plus subscription, GHS 20 per 10 signups, GHS 2 per active student. Paid weekly to MoMo.",
  openGraph: {
    title: "Bondzi Partner programme",
    description:
      "Earn cash by referring Ghanaian students to Bondzi. Paid weekly to MoMo.",
    url: "https://bondzi.online/partners",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bondzi Partner programme",
    description:
      "Earn cash by referring Ghanaian students to Bondzi. Paid weekly to MoMo.",
  },
  alternates: {
    canonical: "https://bondzi.online/partners",
  },
};

const NAV = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "#how" },
  { label: "Rates", href: "#rates" },
  { label: "FAQ", href: "#faq" },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Who can be a Bondzi partner?",
    a: "Anyone with an audience of Ghanaian students. Creators on Instagram / TikTok / X, tutors running WhatsApp study groups, teachers who recommend Bondzi to classes, or parents whose kids' friends already ask about the app. There's no minimum audience — earnings scale with your referrals, so a WhatsApp group of 30 friends can still make real money.",
  },
  {
    q: "How much can I earn?",
    a: "A tutor with a WhatsApp study group of 40 active students who each buy Plus earns GHS 30 × 40 = GHS 1,200 in Plus commissions alone, plus GHS 80 in signup batches (4 batches of 10) and up to GHS 80 in answers bonuses. Real earnings depend on how engaged your audience is — Bondzi doesn't pay for signups that never come back to the app.",
  },
  {
    q: "When and how do I get paid?",
    a: "Payouts run weekly on Mondays via MTN MoMo, AirtelTigo Money, or Telecel Cash — you pick your provider during registration. Every payout carries a downloadable invoice PDF with the MoMo reference we sent, so your records match ours.",
  },
  {
    q: "Do you pay for students who sign up but never use the app?",
    a: "No — we deliberately don't. The signup batch commission only counts students who've answered at least 40 questions in exam sessions. The Plus commission requires them to actually pay for Plus. This is the same reason the ratecard is generous: we're paying for genuine engagement, not vanity metrics.",
  },
  {
    q: "How long do referrals stay attributed to me?",
    a: "90 days from the moment your student signs up with your code. If they buy Plus within that window, you earn. After 90 days the attribution expires — the student is still yours in terms of gratitude, but the commission window closes.",
  },
  {
    q: "What happens if a student asks for a refund?",
    a: "If a student refunds their Plus purchase, the commission is clawed back automatically. If we'd already paid you, the clawback sits as a negative offset in your ledger and nets against your next payout. This never puts you in a negative-balance debt situation — the offset just delays your next payout by however much it takes to earn back.",
  },
  {
    q: "Can I have more than one code?",
    a: "Yes — create as many as you like. Label them by campaign (\"Instagram Feb\", \"WhatsApp Group\", \"YouTube Channel\") so you can see which channel actually converts. Every code shares the same commission rate; the codes are just a tracker.",
  },
  {
    q: "How do I stop being a partner?",
    a: "Reply to any partner email and ask us to close your account. Outstanding earned commissions get paid out one last time, then we deactivate your codes.",
  },
];

export default function PartnersLandingPage() {
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
      {
        "@type": "ListItem",
        position: 2,
        name: "Partner programme",
        item: "https://bondzi.online/partners",
      },
    ],
  };
  return (
    <main id="main" className="bg-bg text-ink">
      <SiteHeader items={NAV} />
      <Hero />
      <How />
      <Rates />
      <WhoFor />
      <Trust />
      <Faq />
      <CTA />
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
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
          <div className="lg:col-span-7">
            <div className="kicker mb-5 sm:mb-6 flex items-center gap-3 flex-wrap">
              <span className="inline-block w-6 h-px bg-ink-mute" />
              Partner programme · Paid in cedis
            </div>
            <h1 className="display text-[36px] sm:text-[56px] md:text-[64px] lg:text-[80px] xl:text-[88px] font-medium text-ink">
              Send us students.
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">Earn cash.</span>
                <span
                  aria-hidden
                  className="absolute left-0 right-0 bottom-1 h-2.5 sm:h-3 lg:h-4 bg-yellow z-0"
                />
              </span>
            </h1>
            <p className="mt-6 sm:mt-8 max-w-xl text-[15.5px] sm:text-[17px] leading-[1.6] text-ink-soft">
              Bondzi pays creators, tutors, and WhatsApp-group leaders
              a commission every time a Ghanaian student signs up,
              engages, or upgrades using your code. Weekly payouts to
              MoMo. Everything transparent on your partner dashboard.
            </p>
            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3">
              <TrackedLink
                href="https://partners.bondzi.online/partner/register"
                event="cta_click"
                properties={{ surface: "partners", target: "partner_register_hero" }}
                className="inline-flex items-center gap-2 bg-orange text-on-brand px-5 h-12 rounded-full font-medium hover:bg-orange-deep transition-colors whitespace-nowrap"
              >
                Sign up as a partner
                <ArrowUpRight size={16} strokeWidth={2.25} />
              </TrackedLink>
              <a
                href="#rates"
                className="inline-flex items-center gap-2 px-5 h-12 rounded-full border border-ink/15 hover:border-ink/40 transition-colors text-[15px] whitespace-nowrap"
              >
                See the rates
                <ArrowRight size={16} strokeWidth={2.25} />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-rule bg-paper p-6 sm:p-7 shadow-[0_1px_0_rgba(20,20,20,0.03)]">
              <div className="kicker flex items-center gap-2">
                <Wallet size={14} strokeWidth={2} />
                A realistic week
              </div>
              <p className="mt-3 text-[15px] leading-[1.6] text-ink-soft">
                A community tutor with 15 active students in a
                WhatsApp study group:
              </p>
              <ul className="mt-4 space-y-2.5 text-[14px]">
                <StatRow label="12 sign-ups × Plus WASSCE" value="GHS 360" />
                <StatRow
                  label="1 batch of 10 active users"
                  value="GHS 20"
                />
                <StatRow
                  label="Bonus for 4 crossing 100 answers"
                  value="GHS 8"
                />
              </ul>
              <div className="mt-4 pt-4 border-t border-rule flex items-center justify-between">
                <span className="text-[13px] font-medium text-ink">
                  Weekly total
                </span>
                <span className="display text-[22px] text-ink">
                  GHS 388
                </span>
              </div>
              <p className="mt-3 text-[11.5px] text-ink-mute">
                Illustrative — earnings scale with engagement, not
                just sign-ups.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline justify-between gap-4">
      <span className="text-ink-soft">{label}</span>
      <span className="font-mono text-[13.5px] text-ink">{value}</span>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* How it works                                                               */
/* -------------------------------------------------------------------------- */

function How() {
  return (
    <section id="how" className="border-t border-rule bg-yellow-soft/60">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
        <div className="grid grid-cols-12 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="col-span-12 lg:col-span-4">
            <div className="kicker">How it works</div>
            <h2 className="display mt-3 text-[32px] sm:text-[44px] lg:text-[56px] font-medium leading-[1.02]">
              Three steps to your
              <br />
              first MoMo alert.
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-8 lg:col-start-5 text-[15px] text-ink-soft leading-[1.6] max-w-lg">
            No inventory. No delivery. No customer support. Just share
            a code and let the app do the work.
          </div>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Step
            n="01"
            title="Sign up as a partner"
            body="Register with your name, email, phone, and the MoMo details where you want to get paid. We'll email a confirmation and your unique referral code within minutes."
          />
          <Step
            n="02"
            title="Share your code"
            body="WhatsApp study group, Instagram bio, a comment under your videos, a printout in class. Students type your code when they sign up on the Bondzi app — you get credit for 90 days."
          />
          <Step
            n="03"
            title="Get paid every week"
            body="We tally what you earned on Sunday and pay out on Monday to your MoMo. Every payout comes with a downloadable invoice PDF for your records."
          />
        </ol>
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <li className="rounded-2xl border border-rule bg-paper p-5 sm:p-6">
      <p className="font-mono text-[12px] uppercase tracking-wider text-orange">
        Step {n}
      </p>
      <h3 className="mt-2 display text-[22px] sm:text-[24px] leading-tight text-ink">
        {title}
      </h3>
      <p className="mt-3 text-[14px] leading-[1.6] text-ink-soft">
        {body}
      </p>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Rates                                                                      */
/* -------------------------------------------------------------------------- */

function Rates() {
  return (
    <section id="rates" className="border-t border-rule">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
        <div className="grid grid-cols-12 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="col-span-12 lg:col-span-5">
            <div className="kicker">Ratecard</div>
            <h2 className="display mt-3 text-[32px] sm:text-[44px] lg:text-[56px] font-medium leading-[1.02]">
              What you earn,
              <br />
              exactly.
            </h2>
          </div>
          <p className="col-span-12 lg:col-span-6 lg:col-start-7 text-[15px] text-ink-soft leading-[1.6] max-w-lg">
            Every rate is public. We deliberately don&apos;t pay for
            empty signups — the ratecard rewards genuine engagement so
            the students you refer are the students you&apos;d be
            proud of.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <RateCard
            Icon={Coins}
            amount="GHS 30"
            title="Plus subscription — WASSCE / NOVDEC"
            body="One-time commission when a referred student purchases Bondzi Plus (WASSCE or NOVDEC) within 90 days of signing up with your code."
          />
          <RateCard
            Icon={Coins}
            amount="GHS 15"
            title="Plus subscription — BECE"
            body="Same as above for BECE Plus students. Lower price point, lower commission — same 90-day window."
          />
          <RateCard
            Icon={Users}
            amount="GHS 20"
            title="Every 10 active sign-ups"
            body="Paid as a batch of ten when ten of your referrals each complete exam sessions totalling 40+ answers. Rewards genuine users, not tyre-kickers."
          />
          <RateCard
            Icon={Sparkles}
            amount="GHS 2"
            title="Answers bonus"
            body="One-time top-up per paid-Plus student when they cross 100 completed answers — the moment they're clearly here to stay."
          />
          <RateCard
            Icon={PhoneCall}
            amount="MoMo"
            title="Paid weekly, in cedis"
            body="MTN MoMo, AirtelTigo Money, or Telecel Cash — you pick during signup. Payouts land every Monday with an invoice PDF."
          />
          <RateCard
            Icon={ShieldCheck}
            amount="90 days"
            title="Attribution window"
            body="From the moment your student signs up. If they buy Plus later than that, they're still yours socially — the commission just resets to zero."
          />
        </div>
      </div>
    </section>
  );
}

function RateCard({
  Icon,
  amount,
  title,
  body,
}: {
  Icon: typeof Coins;
  amount: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-rule bg-paper p-5 sm:p-6 flex flex-col gap-3 min-h-[220px]">
      <div className="flex items-center gap-2 text-ink-mute">
        <Icon size={14} strokeWidth={2} />
        <span className="kicker !text-[10.5px]">Rate</span>
      </div>
      <p className="display text-[32px] sm:text-[36px] leading-none font-medium text-ink">
        {amount}
      </p>
      <p className="text-[14px] font-medium text-ink">{title}</p>
      <p className="text-[13.5px] leading-[1.55] text-ink-soft">{body}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Who it's for                                                               */
/* -------------------------------------------------------------------------- */

function WhoFor() {
  return (
    <section className="border-t border-rule bg-yellow-soft/40">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
        <div className="grid grid-cols-12 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="col-span-12 lg:col-span-5">
            <div className="kicker">Built for</div>
            <h2 className="display mt-3 text-[32px] sm:text-[44px] lg:text-[56px] font-medium leading-[1.02]">
              People students
              <br />
              already listen to.
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <WhoTile
            Icon={Sparkles}
            title="Creators & influencers"
            body="If your audience is Ghanaian teenagers or twentysomethings, they're the ones sitting BECE, WASSCE, or NOVDEC right now. Post once — earn every time one signs up."
          />
          <WhoTile
            Icon={GraduationCap}
            title="Community tutors & coaches"
            body="Running WhatsApp study groups or after-school prep sessions? Your recommendation already carries weight. Now it pays."
          />
          <WhoTile
            Icon={MessageCircle}
            title="Group leaders & prefects"
            body="Class group chats, church youth groups, alumni networks — the small, trusted circles that actually drive decisions. Perfect fit."
          />
        </div>
      </div>
    </section>
  );
}

function WhoTile({
  Icon,
  title,
  body,
}: {
  Icon: typeof Handshake;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-rule bg-paper p-5 sm:p-6">
      <Icon size={22} strokeWidth={1.75} className="text-orange" />
      <h3 className="mt-4 text-[17px] font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-[1.55] text-ink-soft">
        {body}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Trust                                                                      */
/* -------------------------------------------------------------------------- */

function Trust() {
  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
        <div className="grid grid-cols-12 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="col-span-12 lg:col-span-6">
            <div className="kicker">Transparency by design</div>
            <h2 className="display mt-3 text-[32px] sm:text-[44px] lg:text-[56px] font-medium leading-[1.02]">
              Every credit
              <br />
              is traceable.
            </h2>
          </div>
          <p className="col-span-12 lg:col-span-6 text-[15px] text-ink-soft leading-[1.6] max-w-lg">
            We built the partner ledger so you can see exactly what
            you earned and when. Every commission carries the reason
            it fired — sub id, batch, threshold — so we&apos;re
            never paying twice for the same student.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <TrustTile
            title="See your ledger, live"
            body="Every commission appears in your dashboard the moment it fires — with amount, reason, and status (approved / paid / pending)."
          />
          <TrustTile
            title="Every payout comes with an invoice"
            body="One PDF per weekly payout, listing every commission we netted. Same document our accountants use — nothing hidden behind a summary."
          />
          <TrustTile
            title="Refunds handled automatically"
            body="If a referred student refunds their Plus, the commission is clawed back cleanly and shown on your ledger — no manual back-and-forth."
          />
        </div>
      </div>
    </section>
  );
}

function TrustTile({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-rule bg-paper p-5 sm:p-6">
      <div className="flex items-center gap-2 text-ink-mute">
        <ShieldCheck size={14} strokeWidth={2} />
        <span className="kicker !text-[10.5px]">Trust</span>
      </div>
      <h3 className="mt-3 text-[16px] font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-[1.55] text-ink-soft">
        {body}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                        */
/* -------------------------------------------------------------------------- */

function Faq() {
  return (
    <section id="faq" className="border-t border-rule bg-yellow-soft/40">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-28">
        <div className="grid grid-cols-12 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="col-span-12 lg:col-span-4">
            <div className="kicker">Common questions</div>
            <h2 className="display mt-3 text-[32px] sm:text-[44px] lg:text-[60px] font-medium leading-[1.02]">
              Everything
              <br />
              you might ask.
            </h2>
          </div>
        </div>
        <dl className="divide-y divide-rule border-t border-rule">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-4 sm:py-5">
              <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                <dt className="text-[16px] sm:text-[17px] font-medium text-ink leading-snug">
                  {f.q}
                </dt>
                <span
                  aria-hidden
                  className="mt-1 shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full border border-ink/15 text-ink-mute group-open:rotate-45 transition-transform"
                >
                  +
                </span>
              </summary>
              <dd className="mt-3 text-[14px] sm:text-[15px] leading-[1.65] text-ink-soft max-w-3xl">
                {f.a}
              </dd>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Final CTA                                                                  */
/* -------------------------------------------------------------------------- */

function CTA() {
  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
        <div className="rounded-3xl border border-orange/30 bg-paper p-8 sm:p-12 lg:p-16 text-center">
          <div className="kicker flex items-center justify-center gap-2 mb-4">
            <Handshake size={14} strokeWidth={2} />
            Ready to start
          </div>
          <h2 className="display text-[32px] sm:text-[44px] lg:text-[56px] font-medium leading-[1.02] max-w-2xl mx-auto">
            Your first payout is
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">one code away.</span>
              <span
                aria-hidden
                className="absolute left-0 right-0 bottom-1 h-2 sm:h-2.5 lg:h-3 bg-orange/25 z-0"
              />
            </span>
          </h2>
          <p className="mt-5 text-[15px] sm:text-[16px] text-ink-soft max-w-xl mx-auto leading-[1.6]">
            Registration takes about two minutes. Your referral code
            is live the moment you finish. We&apos;ll email you
            whenever you earn.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <TrackedLink
              href="https://partners.bondzi.online/partner/register"
              event="cta_click"
              properties={{ surface: "partners", target: "partner_register_footer" }}
              className="inline-flex items-center gap-2 bg-orange text-on-brand px-6 h-12 rounded-full font-medium hover:bg-orange-deep transition-colors whitespace-nowrap"
            >
              Sign up as a partner
              <ArrowUpRight size={16} strokeWidth={2.25} />
            </TrackedLink>
            <TrackedLink
              href="https://partners.bondzi.online/partner/signin"
              event="cta_click"
              properties={{ surface: "partners", target: "partner_signin" }}
              className="inline-flex items-center gap-2 px-6 h-12 rounded-full border border-ink/15 hover:border-ink/40 transition-colors text-[15px] whitespace-nowrap"
            >
              I&apos;m already a partner — sign in
              <ArrowRight size={16} strokeWidth={2.25} />
            </TrackedLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-rule bg-bg">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-8 sm:py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 sm:gap-8">
        <div>
          <span className="display text-[22px] font-medium">Bondzi</span>
          <p className="mt-3 text-[13px] text-ink-mute max-w-sm leading-snug">
            Partner programme · Paid weekly to MoMo · Made in Accra.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 sm:gap-x-10 gap-y-2 text-[13px] text-ink-soft">
          <Link href="/" className="hover:text-ink py-1">
            Home
          </Link>
          <Link href="/blog" className="hover:text-ink py-1">
            Blog
          </Link>
          <a
            href="mailto:support@bondzi.online"
            className="hover:text-ink py-1"
          >
            support@bondzi.online
          </a>
          <span className="text-ink-mute py-1">© 2026 Bondzi</span>
          <span className="text-ink-mute py-1">Cliffbase Tech, Ghana</span>
        </div>
      </div>
    </footer>
  );
}
