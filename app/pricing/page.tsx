import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { appPath } from "@/lib/urls";
import { ENV } from "@/lib/env";

/**
 * `/pricing` — public pricing page fed by the live plan catalogue
 * (`GET /plans?country=GH`, same endpoint the app's checkout uses), so
 * marketing prices can never drift from what students are actually
 * charged. Revalidated hourly; if the API is unreachable at render
 * time we degrade to the plan structure without figures rather than
 * showing stale or invented prices.
 */

export const metadata: Metadata = {
  title: "Pricing — Bondzi",
  description:
    "Bondzi pricing for Ghana: free past-question practice for everyone, one-time Plus access per exam, and Pro subscriptions with the full AI tutor. Paid in cedis via mobile money.",
  alternates: { canonical: "https://bondzi.online/pricing" },
  openGraph: {
    title: "Bondzi pricing",
    description:
      "Free to start. Plus and Pro paid in Ghana cedis via MTN, Telecel, or AirtelTigo mobile money.",
    url: "https://bondzi.online/pricing",
    type: "website",
  },
};

export const revalidate = 3600;

const NAV = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Partners", href: "/partners" },
];

interface CadenceView {
  price: number;
  durationDays: number;
  available: boolean;
}

interface PublicPlan {
  id: string;
  name: string;
  description: string | null;
  account: "plus" | "pro";
  level: string;
  paymentKind: "one_time" | "recurring";
  currency: string;
  isDefault: boolean;
  pricing: {
    monthly: CadenceView;
    sixMonth: CadenceView;
    annual: CadenceView;
  };
}

const LEVEL_LABEL: Record<string, string> = {
  bece: "BECE",
  wassce: "WASSCE",
  novdec: "Nov/Dec",
};
const LEVEL_ORDER = ["bece", "wassce", "novdec"];

async function fetchPlans(): Promise<PublicPlan[] | null> {
  try {
    const base = ENV.API_URL.replace(/\/+$/, "");
    const res = await fetch(`${base}/plans?country=GH`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    const rows = Array.isArray(json)
      ? json
      : (json as { data?: unknown })?.data;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return rows as PublicPlan[];
  } catch {
    return null;
  }
}

function ghs(amount: number): string {
  return `GHS ${amount % 1 === 0 ? amount : amount.toFixed(2)}`;
}

function byLevel(plans: PublicPlan[]): PublicPlan[] {
  return [...plans].sort(
    (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level),
  );
}

const FREE_FEATURES = [
  "Thirty-four years of WAEC past questions, every subject",
  "Daily spaced-repetition review of what you got wrong",
  "Progress tracking, streaks, XP and the weekly leaderboard",
  "10 AI explanations every month",
  "Works offline — practice syncs when you're back online",
];

const PLUS_FEATURES = [
  "Everything in Free",
  "Full AI tutor — an explanation on every wrong answer",
  "Pay once, keep it — no renewals",
];

const PRO_FEATURES = [
  "Everything in Plus",
  "AI Level Tests — fresh questions calibrated to your syllabus",
  "Weakness analytics and curated drills on your weak topics",
  "Full mock exams with post-exam breakdowns",
];

export default async function PricingPage() {
  const plans = await fetchPlans();
  const plus = plans ? byLevel(plans.filter((p) => p.account === "plus")) : [];
  const pro = plans
    ? byLevel(plans.filter((p) => p.account === "pro" && p.isDefault))
    : [];

  const jsonLd = plans
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Bondzi",
        description:
          "WASSCE and BECE exam prep with past questions and an AI tutor.",
        brand: { "@type": "Brand", name: "Bondzi" },
        offers: [
          {
            "@type": "Offer",
            name: "Bondzi Free",
            price: "0",
            priceCurrency: "GHS",
          },
          ...plus.map((p) => ({
            "@type": "Offer",
            name: p.name,
            price: String(p.pricing.monthly.price),
            priceCurrency: p.currency,
          })),
          ...pro.map((p) => ({
            "@type": "Offer",
            name: `${p.name} (monthly)`,
            price: String(p.pricing.monthly.price),
            priceCurrency: p.currency,
          })),
        ],
      }
    : null;

  return (
    <main id="main" className="bg-bg text-ink min-h-screen">
      <SiteHeader items={NAV} />

      <section className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 pt-12 sm:pt-16 pb-8">
        <div className="kicker">Pricing</div>
        <h1 className="display text-[34px] sm:text-[48px] lg:text-[56px] font-medium leading-[1.05] mt-3 max-w-3xl">
          Free to study seriously. Paid when you want the full tutor.
        </h1>
        <p className="mt-5 text-[16px] sm:text-[17px] text-ink-soft max-w-2xl leading-[1.6]">
          Every price below comes straight from our live catalogue — what you
          see is what checkout charges, in Ghana cedis, paid with MTN,
          Telecel, or AirtelTigo mobile money. No card needed.
        </p>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 pb-16 sm:pb-20">
        <div className="grid md:grid-cols-3 gap-5">
          {/* Free */}
          <div className="paper-card rounded-lg p-6 sm:p-7 flex flex-col">
            <h2 className="display text-[24px] font-medium">Free</h2>
            <div className="mt-2">
              <span className="display text-[34px] font-medium">GHS 0</span>
              <span className="text-[13px] text-ink-mute"> · forever</span>
            </div>
            <p className="mt-3 text-[14px] text-ink-soft leading-[1.55]">
              The full question bank and the study system. Enough to prepare
              properly — not a trial.
            </p>
            <ul className="mt-5 space-y-2.5 text-[14px] text-ink-soft flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <Check
                    size={16}
                    strokeWidth={2.5}
                    className="text-orange shrink-0 mt-0.5"
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <TrackedLink
              href={appPath("/register")}
              event="cta_click"
              properties={{ surface: "pricing", target: "register" }}
              className="mt-6 inline-flex items-center justify-center bg-ink text-bg px-5 h-12 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Start free
            </TrackedLink>
          </div>

          {/* Plus */}
          <div className="paper-card rounded-lg p-6 sm:p-7 flex flex-col border-2 border-orange relative">
            <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 bg-orange text-on-brand text-[11.5px] font-medium px-3 py-1 rounded-full">
              <Sparkles size={12} strokeWidth={2.5} />
              Pay once, keep forever
            </div>
            <h2 className="display text-[24px] font-medium">Plus</h2>
            <div className="mt-2">
              {plus.length > 0 ? (
                <span className="display text-[34px] font-medium">
                  {ghs(Math.min(...plus.map((p) => p.pricing.monthly.price)))}
                  <span className="text-[15px] text-ink-mute font-normal">
                    {" "}
                    one-time, from
                  </span>
                </span>
              ) : (
                <span className="display text-[22px] font-medium">
                  One-time payment
                </span>
              )}
            </div>
            <p className="mt-3 text-[14px] text-ink-soft leading-[1.55]">
              One payment for your exam level, yours for good — built for the
              student who wants the AI tutor without a subscription.
            </p>
            {plus.length > 0 && (
              <div className="mt-4 rounded-md bg-paper border border-rule divide-y divide-rule text-[13.5px]">
                {plus.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3.5 py-2.5"
                  >
                    <span className="text-ink-soft">
                      {LEVEL_LABEL[p.level] ?? p.level.toUpperCase()}
                    </span>
                    <span className="font-medium text-ink">
                      {ghs(p.pricing.monthly.price)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <ul className="mt-5 space-y-2.5 text-[14px] text-ink-soft flex-1">
              {PLUS_FEATURES.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <Check
                    size={16}
                    strokeWidth={2.5}
                    className="text-orange shrink-0 mt-0.5"
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <TrackedLink
              href={appPath("/register")}
              event="cta_click"
              properties={{ surface: "pricing", target: "register" }}
              className="mt-6 inline-flex items-center justify-center bg-orange text-on-brand px-5 h-12 rounded-full font-medium hover:bg-orange-deep transition-colors"
            >
              Get Plus
            </TrackedLink>
          </div>

          {/* Pro */}
          <div className="paper-card rounded-lg p-6 sm:p-7 flex flex-col">
            <h2 className="display text-[24px] font-medium">Pro</h2>
            <div className="mt-2">
              {pro.length > 0 ? (
                <span className="display text-[34px] font-medium">
                  {ghs(Math.min(...pro.map((p) => p.pricing.monthly.price)))}
                  <span className="text-[15px] text-ink-mute font-normal">
                    {" "}
                    / month, from
                  </span>
                </span>
              ) : (
                <span className="display text-[22px] font-medium">
                  Subscription
                </span>
              )}
            </div>
            <p className="mt-3 text-[14px] text-ink-soft leading-[1.55]">
              The complete system — AI tests, analytics, and drills — for the
              student treating this exam like a campaign.
            </p>
            {pro.length > 0 && (
              <div className="mt-4 rounded-md bg-paper border border-rule divide-y divide-rule text-[13.5px]">
                {pro.map((p) => (
                  <div key={p.id} className="px-3.5 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-soft">
                        {LEVEL_LABEL[p.level] ?? p.level.toUpperCase()}
                      </span>
                      <span className="font-medium text-ink">
                        {ghs(p.pricing.monthly.price)}/mo
                      </span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-ink-mute text-right">
                      {p.pricing.sixMonth.available &&
                        `${ghs(p.pricing.sixMonth.price)} / 6 months · `}
                      {p.pricing.annual.available &&
                        `${ghs(p.pricing.annual.price)} / year`}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <ul className="mt-5 space-y-2.5 text-[14px] text-ink-soft flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <Check
                    size={16}
                    strokeWidth={2.5}
                    className="text-orange shrink-0 mt-0.5"
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <TrackedLink
              href={appPath("/register")}
              event="cta_click"
              properties={{ surface: "pricing", target: "register" }}
              className="mt-6 inline-flex items-center justify-center bg-ink text-bg px-5 h-12 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Get Pro
            </TrackedLink>
          </div>
        </div>

        {!plans && (
          <p className="mt-6 text-[13px] text-ink-mute">
            Live prices are shown inside the app —{" "}
            <TrackedLink
              href={appPath("/register")}
              event="cta_click"
              properties={{ surface: "pricing", target: "register" }}
              className="underline hover:text-ink"
            >
              create a free account
            </TrackedLink>{" "}
            to see current plans for your exam.
          </p>
        )}

        <div className="mt-12 sm:mt-16 max-w-2xl">
          <h2 className="display text-[24px] sm:text-[28px] font-medium">
            Pricing questions
          </h2>
          <dl className="mt-6 space-y-6">
            <div>
              <dt className="font-medium text-[15px]">How do I pay?</dt>
              <dd className="mt-1.5 text-[14px] text-ink-soft leading-[1.6]">
                With mobile money — MTN MoMo, Telecel Cash, or AirtelTigo
                Money. Prices are in Ghana cedis and any applicable VAT is
                handled at checkout.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[15px]">
                What&apos;s the difference between Plus and Pro?
              </dt>
              <dd className="mt-1.5 text-[14px] text-ink-soft leading-[1.6]">
                Plus is a one-time payment that permanently unlocks the full
                AI tutor for your exam level. Pro is a subscription that adds
                the diagnostic layer on top — AI Level Tests, weakness
                analytics, curated drills, and full mock exams.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[15px]">
                Is the free plan really enough to prepare?
              </dt>
              <dd className="mt-1.5 text-[14px] text-ink-soft leading-[1.6]">
                Yes — it includes the entire past-question bank, the daily
                review system, and 10 AI explanations a month. Upgrade when
                you find yourself wanting an explanation on every wrong
                answer, not before.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[15px]">
                Do prices differ by exam?
              </dt>
              <dd className="mt-1.5 text-[14px] text-ink-soft leading-[1.6]">
                Yes. BECE, WASSCE, and Nov/Dec each have their own Plus and
                Pro pricing, shown above. You pick your exam level when you
                sign up.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <footer className="border-t border-rule bg-bg">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-10 py-8 sm:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <span className="display text-[22px] font-medium">Bondzi</span>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-soft">
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
            <Link href="/blog" className="hover:text-ink">
              Blog
            </Link>
            <Link href="/partners" className="hover:text-ink">
              Partners
            </Link>
            <span className="text-ink-mute">
              © 2026 Bondzi · Cliffbase Technologies, Ghana
            </span>
          </div>
        </div>
      </footer>

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </main>
  );
}
