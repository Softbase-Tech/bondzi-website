import type { Metadata } from "next";
import { LegalPageView } from "../../components/legal/LegalPageView";
import { PRIVACY_POLICY_MD } from "../../lib/legal/content";

export const metadata: Metadata = {
  title: "Privacy Policy · Bondzi",
  description:
    "How Bondzi collects, uses, retains and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return <LegalPageView body={PRIVACY_POLICY_MD} />;
}
