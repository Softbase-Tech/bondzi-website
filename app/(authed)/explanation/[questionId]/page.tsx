import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { ExplanationPage } from "./ExplanationPage";

interface Props {
  params: Promise<{ questionId: string }>;
}

export const metadata: Metadata = {
  title: "Explanation",
  robots: { index: false, follow: false },
};

/**
 * Direct URL for a single-question explanation. Used by:
 *   - Deep links from notifications ("your question was explained")
 *   - Bookmarking a specific explanation for later
 *
 * The heavy lifting lives in the client component so paywall + retry
 * behaviour matches the sheet embedded in the result page. If the
 * user hits 402 here they land on the same PaywallDialog.
 */
export default async function ExplanationPageRoute({ params }: Props) {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");
  const { questionId } = await params;
  return <ExplanationPage questionId={questionId} />;
}
