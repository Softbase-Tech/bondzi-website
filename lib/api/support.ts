import { api, apiServer } from "./client";

/**
 * Support-ticket client for the web (app.bondzi.online). Mirrors the
 * mobile shape so the same backend serves both — the contract lives
 * in backend/src/modules/support/support-tickets.service.ts.
 */

export type SupportCategory =
  | "feedback"
  | "wrong_question"
  | "payment"
  | "general";
export type SupportStatus = "open" | "closed";

export interface SupportAttachment {
  url: string;
  mime: string;
  sizeBytes: number;
  originalFilename?: string;
}

export interface SupportTicketRow {
  id: string;
  ticketNumber: string;
  category: SupportCategory;
  subject: string;
  status: SupportStatus;
  relatedTicketNumber: string | null;
  lastReplyAt: string;
  lastReplyBy: "user" | "admin";
  closedAt: string | null;
  createdAt: string;
  messageCount: number;
  preview: string;
}

export interface SupportTicketMessage {
  id: string;
  senderRole: "user" | "admin" | "system";
  senderId: string | null;
  senderName: string | null;
  body: string;
  attachments: SupportAttachment[];
  createdAt: string;
}

export interface SupportTicketDetail extends SupportTicketRow {
  messages: SupportTicketMessage[];
  context: Record<string, unknown> | null;
}

export interface CreateTicketPayload {
  category: SupportCategory;
  subject: string;
  body: string;
  relatedTicketNumber?: string;
  context?: Record<string, unknown>;
  attachments?: SupportAttachment[];
}

export interface CreateMessagePayload {
  body: string;
  attachments?: SupportAttachment[];
}

export async function listSupportTickets(
  accessToken: string,
): Promise<SupportTicketRow[]> {
  return apiServer<SupportTicketRow[]>(accessToken, "/support/tickets");
}

export async function listSupportTicketsClient(): Promise<SupportTicketRow[]> {
  return api<SupportTicketRow[]>("/support/tickets");
}

export async function getSupportTicket(
  accessToken: string,
  id: string,
): Promise<SupportTicketDetail> {
  return apiServer<SupportTicketDetail>(
    accessToken,
    `/support/tickets/${encodeURIComponent(id)}`,
  );
}

export async function getSupportTicketClient(
  id: string,
): Promise<SupportTicketDetail> {
  return api<SupportTicketDetail>(
    `/support/tickets/${encodeURIComponent(id)}`,
  );
}

export async function createSupportTicket(
  payload: CreateTicketPayload,
): Promise<SupportTicketDetail> {
  return api<SupportTicketDetail>("/support/tickets", {
    method: "POST",
    body: payload,
  });
}

export async function replySupportTicket(
  id: string,
  payload: CreateMessagePayload,
): Promise<SupportTicketDetail> {
  return api<SupportTicketDetail>(
    `/support/tickets/${encodeURIComponent(id)}/messages`,
    { method: "POST", body: payload },
  );
}

/**
 * Uploads one image/PDF and returns the attachment descriptor the
 * caller drops into a message payload's `attachments[]` array.
 *
 * The shared api() client hardcodes JSON serialization, so this
 * helper does its own fetch with FormData. It reuses NextAuth's
 * session to attach the same Bearer token.
 */
export async function uploadSupportAttachment(
  file: File,
): Promise<SupportAttachment> {
  const { getSession } = await import("next-auth/react");
  const { ENV } = await import("../env");
  const session = await getSession();
  const accessToken =
    (session as unknown as { accessToken?: string } | null)?.accessToken ??
    null;

  const form = new FormData();
  form.append("file", file, file.name);

  const url = `${ENV.API_URL.replace(/\/$/, "")}/support/attachments`;
  const res = await fetch(url, {
    method: "POST",
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
    body: form,
  });
  const text = await res.text();
  const parsed = text.length ? (JSON.parse(text) as unknown) : undefined;
  if (!res.ok) {
    const message =
      (parsed as { message?: string } | undefined)?.message ?? "Upload failed";
    throw new Error(message);
  }
  const env = parsed as { data?: SupportAttachment } | SupportAttachment | undefined;
  const data =
    env && "data" in (env as Record<string, unknown>)
      ? (env as { data: SupportAttachment }).data
      : (env as SupportAttachment);
  return data;
}
