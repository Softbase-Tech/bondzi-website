import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { AuthedHeader } from "@/components/authed/AuthedHeader";
import { BottomTabBar } from "@/components/authed/BottomTabBar";
import { VerifyEmailBanner } from "@/components/authed/VerifyEmailBanner";
import { PushManager } from "@/components/push/PushManager";
import { SessionErrorGuard } from "./SessionErrorGuard";

/**
 * Layout for every authed surface (dashboard, subjects, exam sessions,
 * settings). Two guards:
 *
 *   1. Server-side session check. `auth()` reads the encrypted cookie
 *      on the request; if missing we redirect to /login. This runs on
 *      EVERY request that hits the (authed) group — proxy.ts also
 *      guards but a defense-in-depth check here means a mis-scoped
 *      proxy rule can't leak the layout.
 *
 *   2. Client-side error-state watcher (`SessionErrorGuard`) that
 *      listens for the token's `error` flag (DeviceKicked,
 *      RefreshTokenExpired, RefreshFailed) and force-signs-out the
 *      user with the right toast. Server can't do this because token
 *      refresh happens at request time, not on a schedule.
 */
export default async function AuthedLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <SessionErrorGuard />
      {/* Push token refresh + foreground-push toasts. Renders nothing. */}
      <PushManager />
      <VerifyEmailBanner />
      <AuthedHeader />
      <main
        id="main"
        className="flex-1 mx-auto w-full max-w-[1280px] px-5 sm:px-6 lg:px-10 py-6 sm:py-10 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-10"
      >
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
