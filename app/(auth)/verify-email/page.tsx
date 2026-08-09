import type { Metadata } from "next";
import { VerifyEmailForm } from "./VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verify your email",
  description:
    "Enter the 6-digit code we sent to confirm your email address.",
};

export default function VerifyEmailPage() {
  return (
    <div>
      <VerifyEmailForm />
    </div>
  );
}
