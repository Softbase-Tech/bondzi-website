"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createSupportTicket,
  type SupportAttachment,
  type SupportCategory,
} from "@/lib/api/support";
import { AttachmentPicker } from "@/components/support/AttachmentPicker";
import { toast } from "sonner";

const CATEGORIES: { id: SupportCategory; label: string; subtitle: string }[] = [
  {
    id: "general",
    label: "General enquiry",
    subtitle: "Anything not covered by the other categories",
  },
  {
    id: "feedback",
    label: "Feedback on the app",
    subtitle: "Tell us what to build, fix, or drop",
  },
  {
    id: "wrong_question",
    label: "Report a wrong question",
    subtitle: "A wrong answer key, unclear wording, broken image",
  },
  {
    id: "payment",
    label: "Payment issue",
    subtitle: "MoMo did not go through, wrong amount, missing Pro",
  },
];

export function NewTicketForm({
  initialCategory,
  related,
  questionId,
}: {
  initialCategory?: string;
  related?: string;
  questionId?: string;
}) {
  const router = useRouter();
  const [category, setCategory] = useState<SupportCategory>(
    initialCategory === "feedback" ||
      initialCategory === "wrong_question" ||
      initialCategory === "payment"
      ? initialCategory
      : "general",
  );
  const [subject, setSubject] = useState(
    questionId ? "Wrong question report" : "",
  );
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<SupportAttachment[]>([]);
  const [sending, setSending] = useState(false);

  const canSend =
    subject.trim().length >= 3 && body.trim().length >= 10 && !sending;

  const submit = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const ticket = await createSupportTicket({
        category,
        subject: subject.trim(),
        body: body.trim(),
        relatedTicketNumber: related,
        context: questionId ? { questionId } : undefined,
        attachments: attachments.length ? attachments : undefined,
      });
      toast.success(`Ticket ${ticket.ticketNumber} opened`);
      router.push(`/help/tickets/${ticket.id}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not open ticket";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-pm-navy">New enquiry</h1>
      </header>

      {related ? (
        <div className="rounded-lg bg-pm-slate-50 px-4 py-3 text-sm text-pm-slate-500">
          Continues ticket{" "}
          <span className="font-semibold text-pm-navy">{related}</span>. We&apos;ll
          link them so ops has the history.
        </div>
      ) : null}

      <section className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-pm-slate-500">
          Category
        </div>
        <div className="rounded-2xl border border-pm-slate-200 bg-white divide-y">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-pm-slate-50"
            >
              <span className="mt-1 flex h-5 w-5 items-center justify-center">
                {category === c.id ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-pm-orange">
                    <span className="h-2.5 w-2.5 rounded-full bg-pm-orange" />
                  </span>
                ) : (
                  <span className="h-5 w-5 rounded-full border-2 border-pm-slate-200" />
                )}
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-pm-navy">
                  {c.label}
                </span>
                <span className="mt-0.5 block text-sm text-pm-slate-500">
                  {c.subtitle}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <div>
        <label className="block text-sm font-semibold text-pm-navy mb-1">
          Subject
        </label>
        <input
          type="text"
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="One sentence summary"
          className="w-full rounded-lg border border-pm-slate-200 px-3 py-2 focus:border-pm-orange focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-pm-navy mb-1">
          Message
        </label>
        <textarea
          maxLength={4000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What happened? Steps, times, screenshots if you have them"
          className="w-full min-h-48 rounded-lg border border-pm-slate-200 px-3 py-2 focus:border-pm-orange focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-pm-slate-500">
          Screenshots (optional)
        </div>
        <AttachmentPicker value={attachments} onChange={setAttachments} />
      </div>

      <p className="text-xs text-pm-slate-500 leading-relaxed">
        We&apos;ll reply here and via push. Include as much detail as you can —
        we can&apos;t respond faster than the info you give us.
      </p>

      <button
        type="button"
        onClick={submit}
        disabled={!canSend}
        className="w-full rounded-lg bg-pm-orange px-4 py-3 font-semibold text-white hover:bg-pm-orange-dark disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send"}
      </button>
    </div>
  );
}
