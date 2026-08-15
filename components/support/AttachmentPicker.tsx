"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { X, Paperclip, Loader2 } from "lucide-react";
import {
  uploadSupportAttachment,
  type SupportAttachment,
} from "@/lib/api/support";
import { ENV } from "@/lib/env";

const MAX = 3;
const ACCEPT = "image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf";

/**
 * Web mirror of the mobile picker. Same 3-cap, same allowed types,
 * same DTO shape. Uploads immediately on select so the send action
 * commits with URLs already in hand.
 */
export function AttachmentPicker({
  value,
  onChange,
}: {
  value: SupportAttachment[];
  onChange: (next: SupportAttachment[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX - value.length;
    if (room <= 0) return;
    setBusy(true);
    try {
      const uploaded: SupportAttachment[] = [];
      for (const file of Array.from(files).slice(0, room)) {
        const out = await uploadSupportAttachment(file);
        uploaded.push(out);
      }
      onChange([...value, ...uploaded].slice(0, MAX));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (idx: number) =>
    onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((a, i) => (
          <div key={a.url} className="relative">
            {a.mime.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={absoluteUrl(a.url)}
                alt={a.originalFilename ?? "attachment"}
                className="h-20 w-20 rounded-lg object-cover border border-pm-slate-200"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-pm-slate-200 bg-white text-[10px] text-pm-slate-500 text-center px-1">
                {a.originalFilename ?? "file"}
              </div>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pm-navy text-white"
              aria-label={`Remove attachment ${i + 1}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length < MAX ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-pm-slate-200 text-pm-slate-500 hover:border-pm-slate-500 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Paperclip className="h-5 w-5" />
                <span className="text-[10px]">Add</span>
              </>
            )}
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <p className="text-xs text-pm-slate-500">
        Up to 3 images or PDFs. Max 5MB each.
      </p>
    </div>
  );
}

function absoluteUrl(url: string): string {
  if (url.startsWith("http")) return url;
  return `${ENV.API_URL.replace(/\/$/, "")}${url}`;
}
