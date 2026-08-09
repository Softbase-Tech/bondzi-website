import type { Metadata } from "next";
import { RegisterFlow } from "./RegisterFlow";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Sign up for Bondzi to unlock past questions, AI explanations, and personalised revision.",
};

export default function RegisterPage() {
  return (
    <div>
      <RegisterFlow />
    </div>
  );
}
