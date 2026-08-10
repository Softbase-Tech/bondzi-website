"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { listMyAppealsClient, submitAppeal } from "@/lib/api/partner";
import { ApiError } from "@/lib/api/client";
import type { PartnerAppeal } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

/**
 * Client component managing submit + list refresh. Body is a plain
 * textarea (min 50 chars, matches backend DTO) — no rich text needed,
 * the review team wants to read plain English.
 *
 * Attachments are deferred to Phase 6+ — for now the appeal is text
 * only. Users who need to include evidence can email support with the
 * appeal_number as reference (that's how our email + this row are
 * linked anyway).
 */
export function AppealsClient({
  initialAppeals,
  canSubmit,
  openAppeal,
}: {
  initialAppeals: PartnerAppeal[];
  canSubmit: boolean;
  openAppeal: PartnerAppeal | null;
}) {
  const router = useRouter();
  const [appeals, setAppeals] = useState(initialAppeals);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    try {
      const fresh = await listMyAppealsClient();
      setAppeals(fresh);
    } catch {
      // Non-fatal; the page reload catches any drift.
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (body.trim().length < 50) {
      toast.error("Please write at least 50 characters.");
      return;
    }
    startTransition(async () => {
      try {
        await submitAppeal({ body: body.trim() });
        setBody("");
        toast.success("Appeal submitted");
        await refresh();
        router.refresh();
      } catch (err) {
        const message =
          err instanceof ApiError
            ? Array.isArray(err.body?.message)
              ? err.body?.message[0] ?? err.message
              : err.body?.message ?? err.message
            : "Couldn't submit the appeal.";
        toast.error(message);
      }
    });
  }

  return (
    <div className="space-y-6">
      {openAppeal ? (
        <Card>
          <CardHeader>
            <h2 className="text-[16px] font-semibold text-ink">
              Appeal #{openAppeal.appealNumber} — under review
            </h2>
          </CardHeader>
          <CardBody>
            <p className="text-[14px] text-ink-soft">
              You already have an open appeal. We&apos;ll email you as
              soon as our team responds.
            </p>
          </CardBody>
        </Card>
      ) : null}

      {canSubmit ? (
        <Card>
          <CardHeader>
            <h2 className="text-[16px] font-semibold text-ink">
              Open a new appeal
            </h2>
            <p className="text-[13px] text-ink-mute mt-1">
              Explain what happened and why the suspension should be
              reversed. Be specific — we read every appeal.
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="block text-[13px] font-medium text-ink-soft mb-1.5">
                  Your appeal
                </span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  minLength={50}
                  maxLength={2000}
                  className="w-full min-h-[140px] rounded-xl border border-rule-strong bg-paper px-3.5 py-2.5 text-[16px] leading-snug text-ink outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 resize-y"
                  placeholder="I received a suspension for … but the flagged sign-ups are from a genuine WhatsApp study group I coach — happy to share the group link."
                />
                <div className="mt-1.5 flex items-center justify-between text-[12px] text-ink-mute">
                  <span>Minimum 50 characters.</span>
                  <span>{body.length}/2000</span>
                </div>
              </label>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isPending}
                  disabled={body.trim().length < 50 || isPending}
                >
                  Submit appeal
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {appeals.length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="text-[16px] font-semibold text-ink">
              Your appeals
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {appeals.map((a) => (
              <AppealRow key={a.id} appeal={a} />
            ))}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

function AppealRow({ appeal }: { appeal: PartnerAppeal }) {
  const { icon, tone, label } = statusMeta(appeal.status);
  return (
    <div className="rounded-xl border border-rule p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[12px] uppercase tracking-wider text-ink-mute">
            Appeal #{appeal.appealNumber}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium ${tone}`}
          >
            {icon}
            {label}
          </span>
        </div>
        <span className="text-[11.5px] text-ink-mute">
          Opened {formatDate(appeal.openedAt)}
        </span>
      </div>
      <p className="text-[13.5px] leading-relaxed text-ink-soft whitespace-pre-wrap break-words">
        {appeal.body}
      </p>
      {appeal.status !== "open" && appeal.resolutionNote ? (
        <div className="rounded-lg border border-rule bg-yellow-soft/30 p-3">
          <p className="text-[11.5px] font-mono uppercase tracking-wider text-ink-mute">
            Note from the review team
          </p>
          <p className="mt-1 text-[13px] text-ink whitespace-pre-wrap break-words">
            {appeal.resolutionNote}
          </p>
        </div>
      ) : null}
      {appeal.resolvedAt ? (
        <p className="text-[11.5px] text-ink-mute">
          Resolved {formatDate(appeal.resolvedAt)}
        </p>
      ) : null}
    </div>
  );
}

function statusMeta(status: PartnerAppeal["status"]): {
  label: string;
  tone: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case "upheld":
      return {
        label: "Upheld",
        tone: "bg-emerald-100 text-emerald-800",
        icon: <CheckCircle2 size={12} />,
      };
    case "denied":
      return {
        label: "Denied",
        tone: "bg-red-100 text-red-800",
        icon: <XCircle size={12} />,
      };
    case "open":
    default:
      return {
        label: "Under review",
        tone: "bg-yellow-soft text-orange-deep",
        icon: <Clock size={12} />,
      };
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
