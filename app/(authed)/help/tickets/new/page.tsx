import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { NewTicketForm } from "./NewTicketForm";

export const metadata: Metadata = {
  title: "New enquiry",
};

/**
 * New-ticket page — server component gates the auth, hands the raw
 * category / related / questionId params through to the client form.
 * Matches the mobile pathname + query shape so a link in an email
 * takes the user to the same place on both surfaces.
 */
export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    subject?: string;
    body?: string;
    related?: string;
    questionId?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <NewTicketForm
        initialCategory={params.category}
        initialSubject={params.subject}
        initialBody={params.body}
        related={params.related}
        questionId={params.questionId}
      />
    </div>
  );
}
