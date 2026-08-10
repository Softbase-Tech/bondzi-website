import type { Metadata } from "next";
import { Suspense } from "react";
import { PartnerResetPasswordForm } from "./PartnerResetPasswordForm";
import { Card, CardBody } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Reset password — Bondzi Partner",
  robots: { index: false, follow: false },
};

export default function PartnerResetPasswordPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-14">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <p className="kicker">Bondzi Partner</p>
          <h1 className="display text-[32px] sm:text-[40px] mt-2">
            Reset password
          </h1>
        </div>
        <Card>
          <CardBody>
            <Suspense fallback={null}>
              <PartnerResetPasswordForm />
            </Suspense>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
