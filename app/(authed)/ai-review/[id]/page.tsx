import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { getAiReviewServer } from "@/lib/api/ai-review";
import type { AiReviewFull } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { renderMarkdown } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "AI Study Review",
  description: "Your personalised study report.",
};

export default async function AiReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.accessToken || !session.user) redirect("/login");

  let review: AiReviewFull | null = null;
  try {
    review = await getAiReviewServer(session.accessToken, id);
  } catch {
    review = null;
  }

  return (
    <div className="max-w-[760px] mx-auto space-y-5">
      <Link
        href="/ai-review"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-mute transition-colors hover:text-ink motion-reduce:transition-none"
      >
        <ChevronLeft size={16} /> Back to reviews
      </Link>

      {!review ? (
        <Card className="p-8 text-center">
          <p className="font-display text-[18px] text-ink">
            Couldn&apos;t load this review.
          </p>
          <p className="mt-1 text-[13.5px] text-ink-soft">
            It may have been removed, or the link is wrong.
          </p>
        </Card>
      ) : (
        <>
          <header>
            <div className="flex items-center gap-2 text-orange">
              <Sparkles size={18} />
              <span className="text-[11px] font-semibold uppercase tracking-widest">
                AI Study Review
                {review.mode === "bootstrap" ? " · warm-up" : ""}
              </span>
            </div>
            <h1 className="mt-2 font-display text-[28px] sm:text-[34px] leading-tight text-ink">
              Your study report
            </h1>
            <p className="mt-1 text-[13px] text-ink-mute">
              Generated{" "}
              {new Date(review.generatedAt).toLocaleDateString("en-GH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </header>
          <Card className="p-5 sm:p-7">
            <div
              className="prose-bondzi max-w-none"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(review.content),
              }}
            />
          </Card>
        </>
      )}
    </div>
  );
}
