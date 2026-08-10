import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getMyPartner } from "@/lib/api/partner";
import { PartnerHeader } from "@/components/partner/PartnerHeader";
import { PartnerBottomTabBar } from "@/components/partner/PartnerBottomTabBar";
import { PartnerSidebar } from "@/components/partner/PartnerSidebar";

/**
 * Layout for the entire `/partner/*` surface.
 *
 * Auth gate: `auth()` reads the encrypted NextAuth cookie server-side;
 * an unsigned request is redirected to /login with a returnTo so the
 * user lands back on the same page after signing in. The proxy also
 * guards the (partner) group — this is defence in depth.
 *
 * Layout shape:
 *   Mobile (< md)  →  Header + main + BottomTabBar (footer)
 *   Tablet (md+)   →  Header + [Sidebar | main] two-column
 *
 * The main pane is bottom-padded on mobile to clear the fixed tab
 * bar (respecting the iOS safe area) and returns to normal on md+.
 */
export default async function PartnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    // Same-host redirect — the partner-branded signin lives at
    // /partner/signin on this host. The proxy also gates unauthed
    // /partner/* traffic to the same target, so this is defence-
    // in-depth against a mis-scoped proxy rule.
    redirect("/partner/signin?returnTo=%2Fpartner%2Fdashboard");
  }
  // Read the partner status once so the nav can decide whether to
  // surface the Appeals tab on mobile. Non-fatal — if the request
  // errors (e.g. backend down) the tab just stays hidden until the
  // next reload.
  const accessToken = session.accessToken ?? null;
  const partner = accessToken ? await getMyPartner(accessToken).catch(() => null) : null;
  const isSuspended = partner?.status === "suspended";

  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <PartnerHeader />
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10 flex-1 flex flex-col md:flex-row gap-0 md:gap-8">
        <PartnerSidebar showAppeals={isSuspended} />
        <main
          id="main"
          className="flex-1 min-w-0 py-6 sm:py-8 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-10"
        >
          {children}
        </main>
      </div>
      <PartnerBottomTabBar showAppeals={isSuspended} />
    </div>
  );
}
