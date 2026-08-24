import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ENV } from "@/lib/env";

/**
 * Partner share link: `https://bondzi.online/r/<CODE>`.
 *
 * Sets the partner-referral cookie server-side and bounces to the
 * homepage, so a partner has one clean URL to put in a WhatsApp status
 * or an Instagram bio. The student never sees a code field — when they
 * eventually register on app.bondzi.online, the register call picks the
 * code up off the cookie.
 *
 * Server-side rather than a client page for two reasons: the cookie is
 * set before any JS runs (so it survives a student who bounces
 * immediately), and there's no flash of an intermediate page.
 *
 * Any campaign params on the link are forwarded to the homepage so a
 * partner can tag their own posts — `/r/ABC123?utm_source=instagram`
 * keeps working as a campaign link too.
 */
export const dynamic = "force-dynamic";

const PARTNER_COOKIE = "bondzi_partner_ref";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
/** Codes are 7-char alphanumeric; allow a little slack, reject the rest. */
const CODE_PATTERN = /^[A-Z0-9]{4,32}$/;

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  const { code } = await ctx.params;
  const normalised = (code ?? "").trim().toUpperCase();

  // Forward any campaign params so /r/ works as a taggable link too.
  const target = new URL("/", req.nextUrl.origin);
  req.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const res = NextResponse.redirect(target, 302);

  // Validate before writing. An unknown code is harmless server-side
  // (the backend no-ops on codes it can't resolve), but a malformed
  // one is worth dropping here rather than storing junk for 30 days.
  if (CODE_PATTERN.test(normalised)) {
    res.cookies.set({
      name: PARTNER_COOKIE,
      value: normalised,
      path: "/",
      maxAge: MAX_AGE_SECONDS,
      sameSite: "lax",
      // Readable by the register form on app.bondzi.online — the whole
      // point. Not httpOnly for the same reason. It carries no identity
      // and grants nothing; the backend re-validates the code and runs
      // its own fraud checks before crediting any partner.
      httpOnly: false,
      secure: ENV.APP_ENV === "production",
      ...(ENV.APP_ENV === "production" ? { domain: ".bondzi.online" } : {}),
    });
  }

  return res;
}
