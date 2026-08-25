import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LifeBuoy, MessageSquare, Flag, HelpCircle } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { listFaqEntries } from "@/lib/api/faq";

export const metadata: Metadata = {
  title: "Help and feedback",
  description: "Report a wrong question, chat with support, share feedback.",
};

/**
 * Web mirror of the mobile Help & feedback landing. Fetches the same
 * FAQ list the mobile Help hub reads from /faq — a single admin
 * update flows to both surfaces without a rebuild. Each row deep-
 * links to /help/faq/:slug rendering the full markdown answer.
 */
export default async function HelpPage() {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");

  // Best-effort: an FAQ fetch failure shouldn't take the whole
  // help hub down — the tickets links and Actions block are still
  // useful. Fall back to an empty list + an inline retry link.
  const faq = await listFaqEntries(session.accessToken).catch(() => null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-ink">Help and feedback</h1>
        <p className="text-ink-mute">
          Open a ticket — we reply here and by email.
        </p>
      </header>

      <section className="rounded-2xl border border-orange/30 bg-yellow-soft/70 p-6 space-y-3">
        <div className="text-lg font-semibold text-ink">
          You&apos;re on the beta
        </div>
        <p className="text-sm text-ink-mute">
          Your feedback shapes what ships. Takes about 5 minutes.
        </p>
        <Link
          href="/help/tickets/new?category=feedback"
          className="inline-block rounded-lg bg-orange px-4 py-2 text-sm font-semibold text-white hover:bg-orange-deep"
        >
          Open feedback →
        </Link>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-mute">
          Common questions
        </h2>
        <div className="rounded-2xl border border-rule bg-paper divide-y">
          {faq === null ? (
            <div className="px-4 py-6 text-sm text-ink-mute">
              We couldn&apos;t load the FAQ right now.{" "}
              <Link href="/help" className="text-orange underline">
                Try again
              </Link>
              , or scroll to Actions below to open a ticket.
            </div>
          ) : faq.length === 0 ? (
            <div className="px-4 py-6 text-sm text-ink-mute">
              No FAQ entries yet — check back soon.
            </div>
          ) : (
            faq.map((entry) => (
              <FaqLink
                key={entry.id}
                slug={entry.slug}
                question={entry.question}
              />
            ))
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-mute">
          Actions
        </h2>
        <div className="rounded-2xl border border-rule bg-paper divide-y">
          <ActionLink
            icon={<Flag className="h-5 w-5 text-ink-mute" />}
            title="Report a wrong question"
            subtitle="A bad answer key, unclear wording, broken image"
            href="/help/tickets/new?category=wrong_question"
          />
          <ActionLink
            icon={<MessageSquare className="h-5 w-5 text-ink-mute" />}
            title="Chat with support"
            subtitle="Open a ticket — we reply here and by email"
            href="/help/tickets/new?category=general"
          />
          <ActionLink
            icon={<LifeBuoy className="h-5 w-5 text-ink-mute" />}
            title="Payment didn't go through"
            subtitle="MoMo failure, wrong amount, missing Pro access"
            href="/help/tickets/new?category=payment"
          />
        </div>
      </section>

      <Link
        href="/help/tickets"
        className="flex items-center justify-between rounded-2xl border border-rule bg-paper px-4 py-4 hover:border-rule-strong"
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="h-5 w-5 text-ink-mute" />
          <div>
            <div className="font-semibold text-ink">My tickets</div>
            <div className="text-sm text-ink-mute">
              Every enquiry you&apos;ve opened, with our replies
            </div>
          </div>
        </div>
        <span className="text-ink-mute">→</span>
      </Link>
    </div>
  );
}

function FaqLink({ slug, question }: { slug: string; question: string }) {
  return (
    <Link
      href={`/help/faq/${slug}`}
      className="flex items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-ink hover:bg-bg"
    >
      <span className="flex-1">{question}</span>
      <span className="text-ink-mute">→</span>
    </Link>
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
      className="flex items-center gap-3 px-4 py-4 hover:bg-bg"
    >
      {icon}
      <div className="flex-1">
        <div className="font-semibold text-ink">{title}</div>
        <div className="text-sm text-ink-mute">{subtitle}</div>
      </div>
      <span className="text-ink-mute">→</span>
    </Link>
  );
}
