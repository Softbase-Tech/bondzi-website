import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { ENV } from "@/lib/env";

/**
 * Proxies the backend's `/partner/payouts/:id/invoice.pdf` endpoint
 * through Next so the browser gets a same-origin download without ever
 * seeing the JWT.
 *
 * Why proxy instead of linking directly to the backend? A plain
 * `<a href={backendUrl}>` on a mobile browser wouldn't carry the
 * `Authorization: Bearer` header — cookies can't cross origins in a
 * simple GET. This route runs server-side, attaches the token from
 * the NextAuth session, streams the PDF back to the browser.
 *
 * Backend gates ownership on its own — a partner requesting another
 * partner's invoice ID gets a 400. We just relay whatever the
 * backend replied with.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;
  const session = await auth();
  const accessToken = session?.accessToken;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }
  const url = `${ENV.API_URL.replace(/\/+$/, "")}/partner/payouts/${encodeURIComponent(
    id,
  )}/invoice.pdf`;
  const upstream = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!upstream.ok) {
    const body = await upstream.text();
    return new NextResponse(body || "Failed to fetch invoice.", {
      status: upstream.status,
    });
  }
  const buffer = await upstream.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/pdf",
      "Content-Disposition":
        upstream.headers.get("Content-Disposition") ??
        `attachment; filename="bondzi-invoice-${id}.pdf"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
