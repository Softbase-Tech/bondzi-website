import type { Metadata } from "next";
import { LegalPageView } from "../../components/legal/LegalPageView";
import { TERMS_OF_SERVICE_MD } from "../../lib/legal/content";

export const metadata: Metadata = {
  title: "Terms of Service · Bondzi",
  description: "The terms that govern your use of Bondzi.",
};

export default function TermsOfServicePage() {
  return <LegalPageView body={TERMS_OF_SERVICE_MD} />;
}
