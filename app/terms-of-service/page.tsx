import type { Metadata } from "next";
import { getLegalPage } from "../../lib/api/legal";
import { LegalPageView } from "../../components/legal/LegalPageView";

export const metadata: Metadata = {
  title: "Terms of Service · Bondzi",
  description: "The terms that govern your use of Bondzi.",
};

export const revalidate = 3600;

export default async function TermsOfServicePage() {
  const page = await getLegalPage("terms");
  return <LegalPageView title="Terms of Service" body={page?.body ?? null} />;
}
