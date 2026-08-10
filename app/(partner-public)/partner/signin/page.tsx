import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PartnerSigninForm } from "./PartnerSigninForm";
import { Card, CardBody } from "@/components/ui/Card";

/**
 * Partner-branded sign-in on the partner host itself. Same NextAuth
 * Credentials provider as the student login, same backend, same
 * session cookie — just served from partners.bondzi.online so the
 * cookie the browser writes lives on the host the partner is
 * actually on. Eliminates the cross-subdomain handoff (and the
 * cookie-domain scoping fragility that came with it).
 *
 * Same-account rule: one Bondzi account, two surfaces. A partner
 * signs in here with their normal Bondzi credentials; the backend's
 * PartnerAuthGuard is what determines whether they can actually see
 * partner routes.
 */
export const metadata: Metadata = {
  title: "Partner sign in — Bondzi",
  description:
    "Sign in to the Bondzi partner portal to manage codes, payouts, and earnings.",
  robots: { index: false, follow: false },
};

export default function PartnerSigninPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-14 sm:py-20">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <p className="kicker">Bondzi Partner</p>
          <h1 className="display text-[32px] sm:text-[40px] mt-2">
            Sign in
          </h1>
          <p className="mt-2 text-ink-soft text-[14px] leading-relaxed">
            Use your Bondzi account — same login you use on the
            student app. If you haven&apos;t registered as a partner
            yet, sign in first and we&apos;ll walk you through it.
          </p>
        </div>
        <Card>
          <CardBody>
            <Suspense fallback={null}>
              <PartnerSigninForm />
            </Suspense>
          </CardBody>
        </Card>
        <p className="mt-6 text-center text-[13px] text-ink-mute">
          New here?{" "}
          <Link
            href="/partner/register"
            className="font-medium text-orange hover:text-orange-deep"
          >
            Create a partner account
          </Link>
        </p>
      </div>
    </div>
  );
}
