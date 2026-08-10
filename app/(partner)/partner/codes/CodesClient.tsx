"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Copy, Check } from "lucide-react";
import {
  createReferralCode,
  deactivateReferralCode,
  listMyReferralCodesClient,
  reactivateReferralCode,
} from "@/lib/api/partner";
import { ApiError } from "@/lib/api/client";
import type { PartnerReferralCode } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

/**
 * Codes management surface — client component so the create / toggle
 * mutations feel snappy without a full server round-trip on every
 * click. Refresh strategy: after each mutation we re-fetch the list
 * (small, single query, no need for optimistic updates yet).
 *
 * Layout:
 *   - Create form on top (single-row on md+, stacked on mobile).
 *   - Codes rendered as a stacked list of cards on mobile, table on
 *     lg+ so the code / label / created / status columns line up.
 */
export function CodesClient({
  initialCodes,
  canManage,
}: {
  initialCodes: PartnerReferralCode[];
  canManage: boolean;
}) {
  const [codes, setCodes] = useState(initialCodes);
  const [label, setLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    try {
      const fresh = await listMyReferralCodesClient();
      setCodes(fresh);
    } catch (err) {
      // Non-fatal — the row we just mutated will still be stale on
      // screen until the next render; toast so the user knows.
      const message =
        err instanceof ApiError ? err.message : "Couldn't refresh codes.";
      toast.error(message);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!label.trim()) return;
    startTransition(async () => {
      try {
        await createReferralCode({ label: label.trim() });
        setLabel("");
        toast.success("Code created");
        await refresh();
      } catch (err) {
        const message =
          err instanceof ApiError
            ? Array.isArray(err.body?.message)
              ? err.body?.message[0] ?? err.message
              : err.body?.message ?? err.message
            : "Couldn't create code.";
        toast.error(message);
      }
    });
  }

  async function toggleActive(code: PartnerReferralCode) {
    startTransition(async () => {
      try {
        if (code.isActive) await deactivateReferralCode(code.id);
        else await reactivateReferralCode(code.id);
        toast.success(code.isActive ? "Code deactivated" : "Code reactivated");
        await refresh();
      } catch (err) {
        const message =
          err instanceof ApiError
            ? Array.isArray(err.body?.message)
              ? err.body?.message[0] ?? err.message
              : err.body?.message ?? err.message
            : "Couldn't toggle code.";
        toast.error(message);
      }
    });
  }

  return (
    <div className="space-y-6">
      {canManage ? (
        <Card>
          <CardHeader>
            <h2 className="text-[15px] font-semibold text-ink">
              New code
            </h2>
            <p className="text-[13px] text-ink-mute mt-1">
              Give the code a label so you remember which channel it&apos;s
              for (e.g. &quot;Instagram Feb&quot;, &quot;WhatsApp group&quot;).
            </p>
          </CardHeader>
          <CardBody>
            <form
              onSubmit={handleCreate}
              className="flex flex-col md:flex-row md:items-end gap-3"
            >
              <div className="flex-1">
                <Input
                  label="Label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Instagram Feb"
                  maxLength={80}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                loading={isPending}
                disabled={!label.trim() || isPending}
                leftIcon={<Plus size={16} />}
              >
                Create code
              </Button>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {/* Mobile: card list */}
      <div className="lg:hidden space-y-3">
        {codes.length === 0 ? (
          <EmptyState />
        ) : (
          codes.map((c) => (
            <CodeCard
              key={c.id}
              code={c}
              canManage={canManage}
              onToggle={() => toggleActive(c)}
              busy={isPending}
            />
          ))
        )}
      </div>

      {/* Desktop / large tablet: table */}
      <div className="hidden lg:block">
        {codes.length === 0 ? (
          <EmptyState />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead className="text-left text-[12px] font-mono uppercase tracking-wider text-ink-mute">
                  <tr className="border-b border-rule">
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Label</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {codes.map((c) => (
                    <tr key={c.id}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[15px] tracking-wider">
                            {c.code}
                          </span>
                          <InlineCopy code={c.code} />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-ink-soft">
                        {c.label}
                        {c.isDefault ? (
                          <span className="ml-2 inline-flex items-center rounded-full bg-yellow-soft px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-orange-deep">
                            Default
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-ink-mute">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill isActive={c.isActive} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        {canManage && !c.isDefault ? (
                          <button
                            type="button"
                            onClick={() => toggleActive(c)}
                            disabled={isPending}
                            className="text-[13px] font-medium text-orange hover:text-orange-deep disabled:opacity-50"
                          >
                            {c.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        ) : (
                          <span className="text-[12px] text-ink-mute">
                            {c.isDefault ? "Default code" : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function CodeCard({
  code,
  canManage,
  onToggle,
  busy,
}: {
  code: PartnerReferralCode;
  canManage: boolean;
  onToggle: () => void;
  busy: boolean;
}) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[18px] tracking-wider text-ink">
                {code.code}
              </span>
              {code.isDefault ? (
                <span className="inline-flex items-center rounded-full bg-yellow-soft px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-orange-deep">
                  Default
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[13px] text-ink-soft break-words">
              {code.label}
            </p>
            <p className="text-[11.5px] text-ink-mute mt-0.5">
              Created {formatDate(code.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <InlineCopy code={code.code} />
            <StatusPill isActive={code.isActive} />
          </div>
        </div>
        {canManage && !code.isDefault ? (
          <button
            type="button"
            onClick={onToggle}
            disabled={busy}
            className="text-[13px] font-medium text-orange hover:text-orange-deep disabled:opacity-50 min-h-11 -mx-1 px-1 self-start"
          >
            {code.isActive ? "Deactivate code" : "Reactivate code"}
          </button>
        ) : null}
      </CardBody>
    </Card>
  );
}

function InlineCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info(`Copy manually: ${code}`);
    }
  }
  return (
    <button
      type="button"
      aria-label={`Copy code ${code}`}
      onClick={handleCopy}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rule text-ink-soft hover:border-rule-strong hover:text-ink"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function StatusPill({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium " +
        (isActive
          ? "bg-emerald-100 text-emerald-800"
          : "bg-ink/10 text-ink-mute")
      }
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardBody>
        <p className="text-[14px] text-ink-mute">
          No codes yet. Once your account is registered we generate a
          default code for you automatically — check back after
          registering.
        </p>
      </CardBody>
    </Card>
  );
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
