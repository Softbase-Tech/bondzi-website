import type { Metadata } from "next";
import { getLegalPage } from "../../lib/api/legal";
import { LegalPageView } from "../../components/legal/LegalPageView";

export const metadata: Metadata = {
  title: "Account & Data Deletion · Bondzi",
  description:
    "How to delete your Bondzi account and what happens to your data.",
};

export const revalidate = 3600;

export default async function AccountDeletionPage() {
  const page = await getLegalPage("account-deletion");
  return (
    <LegalPageView title="Account & Data Deletion" body={page?.body ?? null} />
  );
}
