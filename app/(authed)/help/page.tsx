import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, MessageSquare, Flag, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Help and feedback",
  description: "Report a wrong question, chat with support, share feedback.",
};

/**
 * Web mirror of the mobile Help & feedback landing. Same entry
 * points, same category prefills, same backend calls.
 */
export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-pm-navy">Help and feedback</h1>
        <p className="text-pm-slate-500">
          Open a ticket — we reply here and by email.
        </p>
      </header>

      <section className="rounded-2xl border border-pm-orange/30 bg-pm-orange-light/70 p-6 space-y-3">
        <div className="text-lg font-semibold text-pm-navy">
          You&apos;re on the beta
        </div>
        <p className="text-sm text-pm-slate-500">
          Your feedback shapes what ships. Takes about 5 minutes.
        </p>
        <Link
          href="/help/tickets/new?category=feedback"
          className="inline-block rounded-lg bg-pm-orange px-4 py-2 text-sm font-semibold text-white hover:bg-pm-orange-dark"
        >
          Open feedback →
        </Link>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-pm-slate-500">
          Common questions
        </h2>
        <div className="rounded-2xl border border-pm-slate-200 bg-white divide-y">
          <FaqLink
            question="Why is a subject locked?"
            answer="Free lets you practise Core Mathematics, English, Integrated Science and Social Studies. Electives (Physics, Chemistry, Business, Geography…) need Pro. Upgrade from any locked subject to see the plans."
          />
          <FaqLink
            question="How do I earn and spend XP?"
            answer="You earn XP for every correct answer (10 for past paper, 15 for quiz) plus a bonus when you finish an exam — the bonus scales with your accuracy. Spend XP from your Profile → Redeem."
          />
          <FaqLink
            question="Can I use Bondzi offline?"
            answer="Not yet. Right now you need a connection to load questions and grade answers. Offline downloads are on the roadmap."
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-pm-slate-500">
          Actions
        </h2>
        <div className="rounded-2xl border border-pm-slate-200 bg-white divide-y">
          <ActionLink
            icon={<Flag className="h-5 w-5 text-pm-slate-500" />}
            title="Report a wrong question"
            subtitle="A bad answer key, unclear wording, broken image"
            href="/help/tickets/new?category=wrong_question"
          />
          <ActionLink
            icon={<MessageSquare className="h-5 w-5 text-pm-slate-500" />}
            title="Chat with support"
            subtitle="Open a ticket — we reply here and by email"
            href="/help/tickets/new?category=general"
          />
          <ActionLink
            icon={<LifeBuoy className="h-5 w-5 text-pm-slate-500" />}
            title="Payment didn't go through"
            subtitle="MoMo failure, wrong amount, missing Pro access"
            href="/help/tickets/new?category=payment"
          />
        </div>
      </section>

      <Link
        href="/help/tickets"
        className="flex items-center justify-between rounded-2xl border border-pm-slate-200 bg-white px-4 py-4 hover:border-pm-slate-500"
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="h-5 w-5 text-pm-slate-500" />
          <div>
            <div className="font-semibold text-pm-navy">My tickets</div>
            <div className="text-sm text-pm-slate-500">
              Every enquiry you&apos;ve opened, with our replies
            </div>
          </div>
        </div>
        <span className="text-pm-slate-500">→</span>
      </Link>
    </div>
  );
}

function FaqLink({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer items-center justify-between px-4 py-4 text-sm font-semibold text-pm-navy">
        {question}
        <span className="text-pm-slate-500 group-open:rotate-180 transition">
          ▾
        </span>
      </summary>
      <div className="px-4 pb-4 text-sm text-pm-slate-500 leading-relaxed">
        {answer}
      </div>
    </details>
  );
}

function ActionLink({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-4 hover:bg-pm-slate-50"
    >
      {icon}
      <div className="flex-1">
        <div className="font-semibold text-pm-navy">{title}</div>
        <div className="text-sm text-pm-slate-500">{subtitle}</div>
      </div>
      <span className="text-pm-slate-500">→</span>
    </Link>
  );
}
