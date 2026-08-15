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
