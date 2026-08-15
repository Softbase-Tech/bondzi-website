import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listSupportTickets } from "@/lib/api/support";

/** Compact relative-time formatter — cheap alternative to date-fns. */
function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export const metadata: Metadata = {
  title: "My tickets",
};

/**
 * Web ticket list. Open tickets pinned at the top with a "Awaiting
 * reply" badge when the last message came from admin — matching the
 * mobile REPLY chip so students see the same signal on both surfaces.
 */
export default async function TicketsPage() {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");

  const tickets = await listSupportTickets(session.accessToken).catch(
    () => [],
  );
  const open = tickets.filter((t) => t.status === "open");
  const closed = tickets.filter((t) => t.status === "closed");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-pm-navy">My tickets</h1>
          <p className="text-pm-slate-500">
            Every enquiry you&apos;ve opened.
          </p>
        </div>
        <Link
          href="/help/tickets/new"
          className="rounded-lg bg-pm-orange px-4 py-2 text-sm font-semibold text-white hover:bg-pm-orange-dark"
        >
          New enquiry
        </Link>
      </header>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-pm-slate-200 bg-white p-8 text-center space-y-3">
          <div className="font-semibold text-pm-navy">No tickets yet</div>
          <p className="text-sm text-pm-slate-500">
            Open one from{" "}
            <Link href="/help" className="text-pm-orange underline">
              Help &amp; feedback
            </Link>{" "}
            when you need us.
          </p>
        </div>
      ) : (
        <>
          {open.length > 0 ? (
            <TicketGroup title="Open" tickets={open} />
          ) : null}
          {closed.length > 0 ? (
            <TicketGroup title="Closed" tickets={closed} muted />
          ) : null}
        </>
      )}
    </div>
  );
}

function TicketGroup({
  title,
  tickets,
  muted,
}: {
  title: string;
  tickets: Awaited<ReturnType<typeof listSupportTickets>>;
  muted?: boolean;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-bold uppercase tracking-wider text-pm-slate-500">
        {title}
      </h2>
      <div className="rounded-2xl border border-pm-slate-200 bg-white divide-y">
        {tickets.map((t) => (
          <Link
            key={t.id}
            href={`/help/tickets/${t.id}`}
            className="flex items-start gap-3 px-4 py-4 hover:bg-pm-slate-50"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className={`font-semibold ${muted ? "text-pm-slate-500" : "text-pm-navy"} truncate`}
                >
                  {t.subject}
                </div>
                {t.status === "open" && t.lastReplyBy === "admin" ? (
                  <span className="inline-flex items-center rounded-full bg-pm-orange px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Reply
                  </span>
                ) : null}
              </div>
              {t.preview ? (
                <div className="text-sm text-pm-slate-500 mt-1 line-clamp-2">
                  {t.preview}
                </div>
              ) : null}
              <div className="text-xs text-pm-slate-500 mt-2 font-mono">
                {t.ticketNumber} · updated {relativeTime(t.lastReplyAt)}
              </div>
            </div>
            <span className="text-pm-slate-500">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
