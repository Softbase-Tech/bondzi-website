import type { Metadata } from "next";
import { MailCheck, MailX } from "lucide-react";
import { requestRaw } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ token?: string | string[] }>;
}

/**
 * One-click email unsubscribe landing page. Every Bondzi email's
 * unsubscribe link points here with a signed `token` query param.
 *
 * Public by design — it's opened from an email client, almost always
 * logged out — so it lives outside the (authed) group and proxy.ts
 * allowlists it on every host. The backend endpoint is public too
 * (the token IS the authorisation): GET /mail/unsubscribe?token=…
 * responds `{ ok: boolean }` — true means all engagement emails for
 * that account are now off; false means missing/invalid/expired token.
 *
 * Server component: the unsubscribe call happens during render, so the
 * email client's single click is the whole flow — no JS required.
 */
export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = params.token;
  const token = typeof raw === "string" ? raw : (raw?.[0] ?? "");

  let ok = false;
  if (token.length > 0) {
    try {
      const res = await requestRaw<{ ok: boolean }>("/mail/unsubscribe", {
        query: { token },
      });
      ok = res?.ok === true;
    } catch {
      // Network/backend failure reads the same as an invalid token to
      // the user — the retry is simply clicking the email link again.
      ok = false;
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center px-5 py-12">
      <Card className="w-full max-w-[440px] p-6 sm:p-8 text-center">
        <div
          className={`mx-auto inline-flex items-center justify-center w-12 h-12 rounded-2xl ${
            ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {ok ? <MailCheck size={22} /> : <MailX size={22} />}
        </div>
        <h1 className="mt-4 font-display text-[26px] leading-[1.1] text-ink">
          {ok ? "You're unsubscribed" : "Link not valid"}
        </h1>
        <p className="mt-2 text-[14.5px] text-ink-soft">
          {ok
            ? "You're unsubscribed from Bondzi emails. You can turn them back on anytime in your account settings."
            : "This unsubscribe link is invalid or expired. If you still want to stop Bondzi emails, you can manage them in your account settings."}
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          <Button href="/settings/notifications" variant="outline" size="sm">
            Manage email preferences
          </Button>
          <Button href="/" variant="ghost" size="sm">
            Back to Bondzi
          </Button>
        </div>
      </Card>
    </div>
  );
}
