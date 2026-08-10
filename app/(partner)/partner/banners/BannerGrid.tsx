"use client";

import { useState } from "react";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { PartnerBanner } from "@/lib/api/types";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/**
 * Client-side gallery. Handles download + copy-caption interactions.
 *
 * Mobile: 1 column of cards.
 * Tablet: 2 columns.
 * Desktop: 3 columns.
 *
 * Aspect ratios are enforced per-card so a story-format banner
 * (9:16) doesn't get squashed into a square tile. Uses aspect-ratio
 * utilities on the image wrapper.
 */
export function BannerGrid({
  banners,
  referralCode,
}: {
  banners: PartnerBanner[];
  referralCode: string | null;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {banners.map((b) => (
        <BannerCard key={b.id} banner={b} referralCode={referralCode} />
      ))}
    </div>
  );
}

function BannerCard({
  banner,
  referralCode,
}: {
  banner: PartnerBanner;
  referralCode: string | null;
}) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const aspectClass =
    banner.aspect === "story"
      ? "aspect-[9/16]"
      : banner.aspect === "landscape"
        ? "aspect-[16/9]"
        : "aspect-square";

  const dims =
    banner.widthPx && banner.heightPx
      ? `${banner.widthPx}×${banner.heightPx}`
      : null;

  async function handleDownload() {
    setDownloading(true);
    try {
      // Fetch as blob so mobile browsers save the file cleanly. A
      // direct <a download> often lands as a page navigation on
      // cross-origin URLs; the blob path always works.
      const res = await fetch(banner.imageUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ext = guessExtension(banner.imageUrl, blob.type);
      const filename = `bondzi-${slugify(banner.label)}.${ext}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't download the banner.",
      );
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopyCaption() {
    const caption = buildCaption(banner, referralCode);
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      toast.success("Caption copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info(caption);
    }
  }

  async function handleShare() {
    // Native Web Share when available (mobile browsers). Falls back
    // to copy-caption.
    const caption = buildCaption(banner, referralCode);
    const canShare =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function";
    if (!canShare) {
      await handleCopyCaption();
      return;
    }
    try {
      await navigator.share({
        title: banner.label,
        text: caption,
        url: banner.imageUrl,
      });
    } catch {
      // User cancelled or share failed — non-fatal.
    }
  }

  return (
    <Card interactive>
      <div
        className={cn(
          "relative w-full overflow-hidden border-b border-rule",
          aspectClass,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner.imageUrl}
          alt={banner.label}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <CardBody className="space-y-3">
        <div>
          <p className="text-[15px] font-semibold text-ink">
            {banner.label}
          </p>
          {banner.description ? (
            <p className="mt-1 text-[13px] text-ink-mute leading-relaxed">
              {banner.description}
            </p>
          ) : null}
          <p className="mt-1 text-[11px] font-mono uppercase tracking-wider text-ink-mute">
            {aspectLabel(banner.aspect)}
            {dims ? ` · ${dims}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-paper px-3 py-2 text-[13px] font-medium text-ink hover:border-rule-strong disabled:opacity-50 min-h-11"
          >
            <Download size={14} />
            {downloading ? "Downloading…" : "Download"}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-paper px-3 py-2 text-[13px] font-medium text-ink hover:border-rule-strong min-h-11"
          >
            <Share2 size={14} />
            Share
          </button>
          <button
            type="button"
            onClick={handleCopyCaption}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-paper px-3 py-2 text-[13px] font-medium text-ink hover:border-rule-strong min-h-11"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy caption"}
          </button>
        </div>
      </CardBody>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function aspectLabel(aspect: PartnerBanner["aspect"]): string {
  switch (aspect) {
    case "square":
      return "Square (1:1) — Instagram feed";
    case "story":
      return "Story (9:16) — Instagram / WhatsApp status";
    case "landscape":
      return "Landscape (16:9) — X / LinkedIn";
    default:
      return aspect;
  }
}

function buildCaption(
  banner: PartnerBanner,
  referralCode: string | null,
): string {
  const codeLine = referralCode
    ? `\n\nUse my Bondzi code ${referralCode} — you get a boost, I earn a bit. Everyone wins.`
    : "\n\nCheck out Bondzi — the WASSCE / BECE exam prep app.";
  return `${banner.description ?? banner.label}${codeLine}`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function guessExtension(url: string, mime: string): string {
  const fromMime = mime.split("/")[1]?.split(";")[0]?.trim();
  if (fromMime && /^(png|jpg|jpeg|webp|gif|avif|svg\+xml)$/.test(fromMime)) {
    return fromMime === "svg+xml" ? "svg" : fromMime;
  }
  const m = url.match(/\.([a-z0-9]+)(?:\?|#|$)/i);
  return m?.[1]?.toLowerCase() ?? "png";
}
