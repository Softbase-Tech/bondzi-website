"use client";

import { useState } from "react";
import Link from "next/link";
import {
  replySupportTicket,
  type SupportAttachment,
  type SupportTicketDetail,
} from "@/lib/api/support";
import { AttachmentPicker } from "@/components/support/AttachmentPicker";
import { ENV } from "@/lib/env";
import { toast } from "sonner";

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

/**
 * Client half of the ticket detail. Renders the message thread as
 * left/right bubbles, provides the reply composer for open tickets,
 * and shows a "New ticket referencing this one" CTA when the ticket
 * is closed.
 */
export function TicketDetailClient({
  initial,
}: {
  initial: SupportTicketDetail;
}) {
  const [detail, setDetail] = useState<SupportTicketDetail>(initial);
  const [reply, setReply] = useState("");
  const [attachments, setAttachments] = useState<SupportAttachment[]>([]);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (reply.trim().length === 0 || sending) return;
    setSending(true);
    try {
      const fresh = await replySupportTicket(detail.id, {
        body: reply.trim(),
        attachments: attachments.length ? attachments : undefined,
      });
      setDetail(fresh);
      setReply("");
      setAttachments([]);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not send reply",
      );
    } finally {
      setSending(false);
    }
  };

  const absoluteUrl = (url: string) =>
    url.startsWith("http") ? url : `${ENV.API_URL.replace(/\/$/, "")}${url}`;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Link
          href="/help/tickets"
          className="text-xs text-pm-slate-500 hover:text-pm-navy"
        >
          ← All tickets
        </Link>
        <h1 className="text-2xl font-bold text-pm-navy">
          {detail.subject}
        </h1>
        <p className="text-sm text-pm-slate-500 font-mono">
          {detail.ticketNumber} · {detail.status === "closed" ? "Closed" : "Open"}
          {detail.relatedTicketNumber
            ? ` · continues ${detail.relatedTicketNumber}`
            : ""}
        </p>
      </header>

      <section className="space-y-3">
        {detail.messages.map((m) => {
          if (m.senderRole === "system") {
            return (
              <div key={m.id} className="flex justify-center">
                <div className="rounded-full bg-pm-slate-100 px-3 py-1 text-xs text-pm-slate-500">
                  {m.body}
                </div>
              </div>
            );
          }
          const isAdmin = m.senderRole === "admin";
          return (
            <div
              key={m.id}
              className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-lg rounded-2xl px-4 py-3 ${isAdmin ? "bg-pm-slate-100" : "bg-pm-orange-light border border-pm-orange/30"}`}
              >
                <div
                  className={`text-[11px] font-semibold mb-1 ${isAdmin ? "text-pm-navy" : "text-pm-orange-dark"}`}
                >
                  {isAdmin ? m.senderName ?? "Bondzi team" : "You"}
                </div>
                <div className="whitespace-pre-wrap text-sm text-pm-navy">
                  {m.body}
                </div>
                {m.attachments.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.attachments.map((a) => {
                      const href = absoluteUrl(a.url);
                      if (a.mime.startsWith("image/")) {
                        return (
                          <a
                            key={a.url}
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={href}
                              alt={a.originalFilename ?? "attachment"}
                              className="h-28 w-28 rounded-lg object-cover border border-white/60"
                            />
                          </a>
                        );
                      }
                      return (
                        <a
                          key={a.url}
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md bg-white/70 px-2 py-1 text-xs text-pm-navy hover:bg-white"
                        >
                          📎 {a.originalFilename ?? "attachment"}
                        </a>
                      );
                    })}
                  </div>
                ) : null}
                <div className="mt-2 text-[10px] text-pm-slate-500">
                  {relativeTime(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {detail.status === "open" ? (
        <section className="rounded-2xl border border-pm-slate-200 bg-white p-4 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-pm-slate-500">
            Your reply
          </label>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply…"
            className="w-full min-h-32 rounded-lg border border-pm-slate-200 px-3 py-2 focus:border-pm-orange focus:outline-none"
          />
          <AttachmentPicker value={attachments} onChange={setAttachments} />
          <button
            type="button"
            onClick={send}
            disabled={reply.trim().length === 0 || sending}
            className="rounded-lg bg-pm-orange px-4 py-2 text-sm font-semibold text-white hover:bg-pm-orange-dark disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send reply"}
          </button>
        </section>
      ) : (
        <section className="rounded-2xl border border-pm-slate-200 bg-white p-4 space-y-3">
          <p className="text-sm text-pm-slate-500">
            This ticket is closed. Start a new ticket if the problem comes
            back — we&apos;ll have the history.
          </p>
          <Link
            href={`/help/tickets/new?related=${encodeURIComponent(detail.ticketNumber)}`}
            className="inline-block rounded-lg border border-pm-slate-200 bg-white px-4 py-2 text-sm font-semibold text-pm-navy hover:border-pm-slate-500"
          >
            New ticket referencing this one
          </Link>
        </section>
      )}
    </div>
  );
}
