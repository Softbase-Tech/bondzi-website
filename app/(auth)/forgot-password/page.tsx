import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description:
    "Reset your Bondzi password by email or SMS. We'll send you a 6-digit code.",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[32px] leading-tight text-ink">
          Forgot your password?
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          We&apos;ll send you a 6-digit code so you can set a new one.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
