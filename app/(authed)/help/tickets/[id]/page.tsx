import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getSupportTicket } from "@/lib/api/support";
import { TicketDetailClient } from "./TicketDetailClient";

export const metadata: Metadata = {
  title: "Ticket",
};

/**
 * Ticket detail — SSR prefetch of the thread, then hand to the client
 * for the reply composer + optimistic mutations.
 */
export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");
  const { id } = await params;
  const detail = await getSupportTicket(session.accessToken, id).catch(
    () => null,
  );
  if (!detail) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <TicketDetailClient initial={detail} />
    </div>
  );
}
