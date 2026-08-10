import type { Metadata } from "next";
import { Suspense } from "react";
import { PartnerForgotPasswordForm } from "./PartnerForgotPasswordForm";
import { Card, CardBody } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Forgot password — Bondzi Partner",
  robots: { index: false, follow: false },
};

/**
 * Password-reset step 1 for partners, served on the partner host.
 * Calls the same backend `/auth/forgot-password` endpoint the
 * student flow uses — there's one identity system, one password
 * reset. Only the UI wrapping differs.
 */
export default function PartnerForgotPasswordPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-14">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <p className="kicker">Bondzi Partner</p>
          <h1 className="display text-[32px] sm:text-[40px] mt-2">
            Forgot password
          </h1>
          <p className="mt-2 text-ink-soft text-[14px] leading-relaxed">
            Enter the email or phone linked to your account.
            We&apos;ll send a 6-digit code to reset your password.
          </p>
        </div>
        <Card>
          <CardBody>
            <Suspense fallback={null}>
              <PartnerForgotPasswordForm />
            </Suspense>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
