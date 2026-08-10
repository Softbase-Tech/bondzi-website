"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateMyMomo } from "@/lib/api/partner";
import { ApiError } from "@/lib/api/client";
import type { MomoProvider, PartnerProfile } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const MOMO_OPTIONS: Array<{ value: MomoProvider; label: string }> = [
  { value: "mtn", label: "MTN MoMo" },
  { value: "airteltigo", label: "AirtelTigo Money" },
  { value: "telecel", label: "Telecel Cash" },
  { value: "other", label: "Other" },
];

/**
 * Inline edit form for MoMo details. All three fields are editable in
 * one shot (PATCH /partner/me/momo) — a partner switching providers
 * usually also switches numbers and often re-registers the account in
 * a different name, so splitting into per-field forms would just add
 * ceremony.
 */
export function EditMomoForm({
  partner,
  canEdit,
}: {
  partner: PartnerProfile;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    momoProvider: partner.momoProvider,
    momoNumber: partner.momoNumber,
    momoAccountName: partner.momoAccountName,
  });

  const dirty =
    form.momoProvider !== partner.momoProvider ||
    form.momoNumber !== partner.momoNumber ||
    form.momoAccountName !== partner.momoAccountName;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dirty) return;
    startTransition(async () => {
      try {
        await updateMyMomo({
          momoProvider: form.momoProvider,
          momoNumber: form.momoNumber.trim(),
          momoAccountName: form.momoAccountName.trim(),
        });
        toast.success("MoMo details updated");
        router.refresh();
      } catch (err) {
        const message =
          err instanceof ApiError
            ? Array.isArray(err.body?.message)
              ? err.body?.message[0] ?? err.message
              : err.body?.message ?? err.message
            : "Couldn't update MoMo details.";
        toast.error(message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-full">
          <label
            htmlFor="momo-provider"
            className="block text-[13px] font-medium text-ink-soft mb-1.5"
          >
            MoMo provider
          </label>
          <div className="rounded-xl border border-rule-strong bg-paper focus-within:border-orange focus-within:ring-2 focus-within:ring-orange/20">
            <select
              id="momo-provider"
              className="w-full appearance-none bg-transparent min-h-12 px-3.5 py-2.5 text-[16px] text-ink outline-none disabled:opacity-50"
              value={form.momoProvider}
              onChange={(e) =>
                setForm({
                  ...form,
                  momoProvider: e.target.value as MomoProvider,
                })
              }
              disabled={!canEdit || isPending}
            >
              {MOMO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="MoMo number"
          type="tel"
          inputMode="tel"
          value={form.momoNumber}
          onChange={(e) => setForm({ ...form, momoNumber: e.target.value })}
          disabled={!canEdit || isPending}
        />
      </div>
      <Input
        label="MoMo account name"
        value={form.momoAccountName}
        onChange={(e) =>
          setForm({ ...form, momoAccountName: e.target.value })
        }
        hint="Must match the name on the MoMo number above."
        disabled={!canEdit || isPending}
      />
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:justify-end">
        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          disabled={!canEdit || !dirty || isPending}
        >
          Save changes
        </Button>
      </div>
    </form>
  );
}
