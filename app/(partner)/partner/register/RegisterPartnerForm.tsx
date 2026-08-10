"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerAsPartner } from "@/lib/api/partner";
import { ApiError } from "@/lib/api/client";
import type { MomoProvider, PartnerTerms } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

const MOMO_OPTIONS: Array<{ value: MomoProvider; label: string }> = [
  { value: "mtn", label: "MTN MoMo" },
  { value: "airteltigo", label: "AirtelTigo Money" },
  { value: "telecel", label: "Telecel Cash" },
  { value: "other", label: "Other" },
];

/**
 * Register-as-partner form.
 *
 * Layout logic:
 *   - Mobile: single-column, generous vertical rhythm, one field per row.
 *   - md+   : two-column grid for MoMo details so it doesn't feel sparse
 *             on tablets and laptops.
 *
 * Validation is deliberately light on the client — the backend re-validates
 * everything (email uniqueness, MoMo format, terms version snapshot).
 * We only block the obvious empties + the terms-not-accepted state so a
 * form submit that would 400 anyway doesn't burn a round trip.
 */
export function RegisterPartnerForm({
  terms,
  userEmail,
  userName,
  userPhone,
}: {
  terms: PartnerTerms | null;
  userEmail: string;
  userName: string;
  userPhone: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [form, setForm] = useState({
    email: userEmail,
    phone: userPhone,
    fullName: userName,
    momoProvider: "mtn" as MomoProvider,
    momoNumber: "",
    momoAccountName: userName,
  });

  const canSubmit =
    accepted &&
    form.email.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.fullName.trim().length > 0 &&
    form.momoNumber.trim().length > 0 &&
    form.momoAccountName.trim().length > 0 &&
    !isPending;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!accepted) {
      setError("Please read and accept the partner agreement to continue.");
      return;
    }
    startTransition(async () => {
      try {
        await registerAsPartner({
          email: form.email.trim(),
          phone: form.phone.trim(),
          fullName: form.fullName.trim(),
          momoProvider: form.momoProvider,
          momoNumber: form.momoNumber.trim(),
          momoAccountName: form.momoAccountName.trim(),
        });
        toast.success("Partner account created — welcome!");
        router.push("/partner/dashboard");
        router.refresh();
      } catch (err) {
        const message =
          err instanceof ApiError
            ? Array.isArray(err.body?.message)
              ? err.body?.message[0] ?? err.message
              : err.body?.message ?? err.message
            : err instanceof Error
              ? err.message
              : "Something went wrong.";
        setError(message);
      }
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {terms ? <TermsCard terms={terms} /> : null}

      <Card>
        <CardHeader>
          <h2 className="text-[16px] font-semibold text-ink">
            Your details
          </h2>
          <p className="text-[13px] text-ink-mute mt-1">
            We&apos;ll use this to contact you about payouts. Your MoMo
            details are how we&apos;ll actually send you the money.
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Full name (must match your MoMo account)"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            autoComplete="name"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              enterKeyHint="next"
              required
            />
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              autoComplete="tel"
              enterKeyHint="next"
              required
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-[16px] font-semibold text-ink">
            Payout details (MoMo)
          </h2>
          <p className="text-[13px] text-ink-mute mt-1">
            Payouts run weekly. Make sure the MoMo number is registered in
            your name — we verify against your account.
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MomoProviderSelect
              value={form.momoProvider}
              onChange={(v) => setForm({ ...form, momoProvider: v })}
            />
            <Input
              label="MoMo number"
              type="tel"
              inputMode="tel"
              value={form.momoNumber}
              onChange={(e) => setForm({ ...form, momoNumber: e.target.value })}
              autoComplete="tel-national"
              placeholder="0244123456"
              required
            />
          </div>
          <Input
            label="MoMo account name"
            value={form.momoAccountName}
            onChange={(e) =>
              setForm({ ...form, momoAccountName: e.target.value })
            }
            autoComplete="name"
            hint="This must match the name registered against the MoMo number above."
            required
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-orange"
            />
            <span className="text-[14px] text-ink leading-relaxed">
              I&apos;ve read and accept the Bondzi partner agreement
              {terms ? ` (version ${terms.version})` : ""}. I understand
              that commissions are subject to fraud review and that
              payouts require an active, approved partner account.
            </span>
          </label>
          {error ? (
            <p className="text-[13px] font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            block
            loading={isPending}
            disabled={!canSubmit}
          >
            Create partner account
          </Button>
        </CardBody>
      </Card>
    </form>
  );
}

function MomoProviderSelect({
  value,
  onChange,
}: {
  value: MomoProvider;
  onChange: (v: MomoProvider) => void;
}) {
  return (
    <div className="w-full">
      <label
        className="block text-[13px] font-medium text-ink-soft mb-1.5"
        htmlFor="momo-provider"
      >
        MoMo provider
      </label>
      <div className="rounded-xl border border-rule-strong bg-paper focus-within:border-orange focus-within:ring-2 focus-within:ring-orange/20">
        <select
          id="momo-provider"
          className="w-full appearance-none bg-transparent min-h-12 px-3.5 py-2.5 text-[16px] text-ink outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value as MomoProvider)}
        >
          {MOMO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TermsCard({ terms }: { terms: PartnerTerms }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="text-[16px] font-semibold text-ink">
            Partner agreement
          </h2>
          <span className="text-[12px] font-mono uppercase tracking-wider text-ink-mute">
            v{terms.version}
          </span>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
          <RateTile
            label="Plus WASSCE"
            amount={`GHS ${terms.plusWassce}`}
            note="per paying user"
          />
          <RateTile
            label="Plus NOVDEC"
            amount={`GHS ${terms.plusNovdec}`}
            note="per paying user"
          />
          <RateTile
            label="Plus BECE"
            amount={`GHS ${terms.plusBece}`}
            note="per paying user"
          />
          <RateTile
            label="Signup batch"
            amount={`GHS ${terms.signupBatchAmountGhs}`}
            note={`per ${terms.signupBatchSize} users answering ≥ ${terms.signupMinCompletedAnswers}`}
          />
          <RateTile
            label="Answers bonus"
            amount={`GHS ${terms.answersBonusAmountGhs}`}
            note={`per paying user crossing ${terms.answersBonusThreshold} answers`}
          />
          <RateTile
            label="Attribution window"
            amount={`${terms.attributionWindowDays} days`}
            note="from user signup"
          />
        </ul>
        <details className="rounded-lg border border-rule bg-yellow-soft/30 p-3">
          <summary className="cursor-pointer text-[13px] font-medium text-ink-soft">
            Read the full terms
          </summary>
          <div className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
            {terms.bodyMd}
          </div>
        </details>
      </CardBody>
    </Card>
  );
}

function RateTile({
  label,
  amount,
  note,
}: {
  label: string;
  amount: string;
  note: string;
}) {
  return (
    <li className="rounded-xl border border-rule bg-bg/60 p-3">
      <p className="text-[11px] font-mono uppercase tracking-wider text-ink-mute">
        {label}
      </p>
      <p className="mt-1 text-[15px] font-semibold text-ink">{amount}</p>
      <p className="mt-0.5 text-[11.5px] text-ink-mute leading-snug">
        {note}
      </p>
    </li>
  );
}
