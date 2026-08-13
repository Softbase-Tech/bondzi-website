import type { Metadata } from "next";
import { getLegalPage } from "../../lib/api/legal";
import { LegalPageView } from "../../components/legal/LegalPageView";

export const metadata: Metadata = {
  title: "Privacy Policy · Bondzi",
  description:
    "How Bondzi collects, uses, retains and protects your personal data.",
};

export const revalidate = 3600;

export default async function PrivacyPolicyPage() {
  const page = await getLegalPage("privacy");
  return <LegalPageView title="Privacy Policy" body={page?.body ?? null} />;
}
