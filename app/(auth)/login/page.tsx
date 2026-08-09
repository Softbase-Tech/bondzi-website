import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Bondzi to continue your streak, unlock AI explanations, and pick up where you left off.",
};

export default function LoginPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[32px] leading-tight text-ink">
          Welcome back
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          Sign in to continue your streak.
        </p>
      </div>
      {/* Suspense is here to shield useSearchParams from bailing the whole
          page out of static generation — the form reads `?returnTo` to
          route the user back where they came from after login. */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
