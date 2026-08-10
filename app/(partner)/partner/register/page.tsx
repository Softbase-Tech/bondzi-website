import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getCurrentPartnerTerms, getMyPartner } from "@/lib/api/partner";
import { RegisterPartnerForm } from "./RegisterPartnerForm";

/**
 * Register-as-partner page. Two states:
 *
 *   1. User already has a partner row → bounce to /partner/dashboard.
 *   2. Otherwise → render the terms + registration form.
 *
 * Terms are fetched server-side and rendered inline so the user can
 * read what they're accepting before submitting.
 */
export default async function PartnerRegisterPage() {
  const session = await auth();
  const accessToken = session?.accessToken ?? null;
  if (!accessToken) redirect("/login?returnTo=%2Fpartner%2Fregister");

  const [partner, terms] = await Promise.all([
    getMyPartner(accessToken),
    getCurrentPartnerTerms(accessToken).catch(() => null),
  ]);
  if (partner) redirect("/partner/dashboard");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <p className="kicker">Partner programme</p>
        <h1 className="display text-[32px] sm:text-[40px] mt-1">
          Earn cash by referring students
        </h1>
        <p className="mt-3 text-ink-soft text-[15px] leading-relaxed max-w-prose">
          Register once, share your referral code, and earn commission every
          time a student you refer pays for Bondzi. Payouts land straight in
          your MoMo.
        </p>
      </div>
      <RegisterPartnerForm
        terms={terms}
        userEmail={session?.user?.email ?? ""}
        userName={session?.profile?.fullName ?? session?.user?.name ?? ""}
        userPhone={session?.profile?.phone ?? ""}
      />
    </div>
  );
}
