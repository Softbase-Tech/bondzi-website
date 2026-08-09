import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set a new password",
  description:
    "Enter the code we sent you and choose a new password for your Bondzi account.",
};

export default function ResetPasswordPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[32px] leading-tight text-ink">
          Set a new password
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          Type the 6-digit code we sent, then choose a new password.
        </p>
      </div>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
