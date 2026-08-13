import type { Metadata } from "next";
import { LegalPageView } from "../../components/legal/LegalPageView";
import { ACCOUNT_DELETION_MD } from "../../lib/legal/content";

export const metadata: Metadata = {
  title: "Account & Data Deletion · Bondzi",
  description:
    "How to delete your Bondzi account and what happens to your data.",
};

export default function AccountDeletionPage() {
  return <LegalPageView body={ACCOUNT_DELETION_MD} />;
}
