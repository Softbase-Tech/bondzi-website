import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getCurrentPartnerTerms, getMyPartner } from "@/lib/api/partner";
import { PartnerOnboardingFlow } from "./PartnerOnboardingFlow";

/**
 * Partner onboarding on the partner host. Three states:
 *
 *   - Not signed in            → PartnerOnboardingFlow in "create
 *                                account + become partner" mode
 *                                (email → OTP → full details + MoMo
 *                                + agreement → auto-signin → done).
 *   - Signed in, no partner    → PartnerOnboardingFlow in "become
 *                                partner" mode (MoMo + agreement,
 *                                personal details prefilled from
 *                                account).
 *   - Signed in, has partner   → redirect to dashboard.
 *
 * Terms are fetched server-side when possible so the user reads
 * exactly the version they're accepting. For unauthed users we
 * degrade gracefully — the tile summary in the form still lists
 * the numbers.
 */
export default async function PartnerRegisterPage() {
  const session = await auth();
  const accessToken = session?.accessToken ?? null;

  // Authed: check for existing partner, short-circuit if so.
  if (accessToken) {
    const partner = await getMyPartner(accessToken);
    if (partner) redirect("/partner/dashboard");
  }

  // Fetch terms if we can — needs an access token. Unauthed
  // visitors see the numbers from the form's tile summary; the full
  // body markdown loads once they authenticate mid-flow.
  const terms = accessToken
    ? await getCurrentPartnerTerms(accessToken).catch(() => null)
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6 sm:mb-8 text-center">
        <p className="kicker">Bondzi Partner</p>
        <h1 className="display text-[32px] sm:text-[40px] mt-1">
          Become a partner
        </h1>
        <p className="mt-3 text-ink-soft text-[15px] leading-relaxed">
          Register once, share your code, earn commission every time
          a student you refer pays for Bondzi. Weekly MoMo payouts.
        </p>
      </div>
      <PartnerOnboardingFlow
        isSignedIn={Boolean(accessToken)}
        prefill={{
          email: session?.user?.email ?? "",
          fullName:
            session?.profile?.fullName ?? session?.user?.name ?? "",
          phone: session?.profile?.phone ?? "",
        }}
        termsBodyMd={terms?.bodyMd ?? null}
        termsVersion={terms?.version ?? null}
      />
    </div>
  );
}
