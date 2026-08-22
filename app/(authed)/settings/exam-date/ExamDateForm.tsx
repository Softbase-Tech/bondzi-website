"use client";

import { useMemo, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateProfile } from "@/lib/api/user";
import type { SafeUser } from "@/lib/api/types";

interface Props {
  profile: SafeUser;
}

/**
 * Day / month / year input trio + a dark preview card that mirrors
 * the profile countdown. Client-side validation matches backend:
 * future-only, within five years, sane calendar.
 *
 * "Clear" is a destructive-ish action but low-risk (server just wipes
 * the column), so it uses a link-style Pressable rather than a modal.
 */
export function ExamDateForm({ profile }: Props) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [pending, startTransition] = useTransition();

  const seed = useMemo(() => {
    const iso = profile.targetExamDate;
    if (!iso) return { d: "", m: "", y: "" };
    const [y, m, d] = iso.split("-");
    return {
      d: String(parseInt(d ?? "", 10) || ""),
      m: String(parseInt(m ?? "", 10) || ""),
      y: String(parseInt(y ?? "", 10) || ""),
    };
  }, [profile.targetExamDate]);

  const [day, setDay] = useState(seed.d);
  const [month, setMonth] = useState(seed.m);
  const [year, setYear] = useState(seed.y);

  const examLabel =
    profile.examType === "bece"
      ? "BECE"
      : profile.examType === "novdec"
        ? "NOVDEC"
        : "WASSCE";

  const iso: string | null = useMemo(() => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!d || !m || !y) return null;
    const currentYear = new Date().getFullYear();
    if (y < currentYear || y > currentYear + 5) return null;
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;
    const value = `${y.toString().padStart(4, "0")}-${m
      .toString()
      .padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
    const ts = Date.parse(`${value}T00:00:00Z`);
    if (Number.isNaN(ts)) return null;
    if (ts < Date.now()) return null;
    if (ts > Date.now() + 5 * 365.25 * 86_400_000) return null;
    return value;
  }, [day, month, year]);

  const daysAway = useMemo(() => {
    if (!iso) return null;
    const ts = Date.parse(`${iso}T00:00:00Z`);
    return Math.max(0, Math.ceil((ts - Date.now()) / 86_400_000));
  }, [iso]);

  const stored = profile.targetExamDate ?? null;
  const cleared = day === "" && month === "" && year === "" && stored !== null;
  const dirty = (iso ?? null) !== stored || cleared;
  const showInvalid = (day || month || year) && iso === null;

  const save = (targetExamDate: string | null) => {
    startTransition(async () => {
      try {
        const updated = await updateProfile({ targetExamDate });
        await updateSession({ profile: updated });
        toast.success(
          targetExamDate === null
            ? "Exam date cleared"
            : "Exam date updated",
        );
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not save.";
        toast.error(msg);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[#0F172A] text-white p-6 overflow-hidden">
        <div className="text-[11px] font-semibold tracking-widest uppercase text-white/60">
          Preview
        </div>
        <div className="flex items-end gap-2 mt-2">
          <span
            className="font-display leading-none"
            style={{ fontSize: 44, letterSpacing: -0.5 }}
          >
            {daysAway !== null ? daysAway : "—"}
          </span>
          <span className="text-[15px] font-semibold text-white/85 pb-1">
            {daysAway === 1 ? "day" : "days"}
          </span>
        </div>
        <div className="text-[13px] font-semibold text-white/75 mt-1">
          {iso
            ? `until ${examLabel} · ${new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
            : `Set your ${examLabel} date to see the countdown.`}
        </div>
      </div>

      <div>
        <div className="font-display text-[17px] text-ink mb-3">
          When is the exam?
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Day"
            placeholder="DD"
            inputMode="numeric"
            maxLength={2}
            value={day}
            onChange={(e) => setDay(e.target.value.replace(/\D/g, ""))}
          />
          <Input
            label="Month"
            placeholder="MM"
            inputMode="numeric"
            maxLength={2}
            value={month}
            onChange={(e) => setMonth(e.target.value.replace(/\D/g, ""))}
          />
          <Input
            label="Year"
            placeholder="YYYY"
            inputMode="numeric"
            maxLength={4}
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        {showInvalid ? (
          <p className="mt-3 text-[13px] font-medium text-red-600">
            Enter a valid future date within the next 5 years.
          </p>
        ) : (
          <p className="mt-3 text-[13px] text-ink-mute leading-relaxed">
            We store the day exactly — no timezone gymnastics.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={() => (cleared ? save(null) : iso ? save(iso) : undefined)}
          loading={pending}
          disabled={pending || !dirty || (!cleared && !iso)}
        >
          {stored ? "Update exam date" : "Save exam date"}
        </Button>
        {stored ? (
          <button
            type="button"
            onClick={() => save(null)}
            disabled={pending}
            className="text-[13.5px] font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Clear exam date
          </button>
        ) : null}
      </div>
    </div>
  );
}
