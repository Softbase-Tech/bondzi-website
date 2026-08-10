import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getMyPartner } from "@/lib/api/partner";

/**
 * Root `/partner` route. Splits on whether the signed-in user has a
 * partner row yet:
 *
 *   - No partner row     → /partner/register (start here)
 *   - Has partner row    → /partner/dashboard
 *
 * The (partner)/layout already gated on `session?.user`, so we can
 * assume an authenticated session here.
 */
export default async function PartnerIndexPage() {
  const session = await auth();
  const accessToken = session?.accessToken ?? null;
  if (!accessToken) redirect("/login?returnTo=%2Fpartner%2Fdashboard");
  const partner = await getMyPartner(accessToken);
  if (!partner) redirect("/partner/register");
  redirect("/partner/dashboard");
}
