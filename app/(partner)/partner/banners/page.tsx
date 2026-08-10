import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getMyPartner, listBanners, listMyReferralCodes } from "@/lib/api/partner";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { BannerGrid } from "./BannerGrid";

/**
 * Banner gallery. Server-fetches the active catalogue + the partner's
 * default code, then hands off to the client grid which handles
 * download / share-with-code interactions.
 */
export default async function PartnerBannersPage() {
  const session = await auth();
  const accessToken = session?.accessToken ?? null;
  if (!accessToken) redirect("/login?returnTo=%2Fpartner%2Fbanners");
  const partner = await getMyPartner(accessToken);
  if (!partner) redirect("/partner/register");

  const [banners, codes] = await Promise.all([
    listBanners(accessToken).catch(() => []),
    listMyReferralCodes(accessToken).catch(() => []),
  ]);
  const defaultCode = codes.find((c) => c.isDefault) ?? codes[0] ?? null;

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Share assets</p>
        <h1 className="display text-[28px] sm:text-[36px] mt-1">
          Banner gallery
        </h1>
        <p className="mt-2 text-ink-soft text-[14px] leading-relaxed max-w-prose">
          Ready-to-post images for Instagram, WhatsApp status, X, and
          more. Tap any banner to download the original. Pair it with
          your referral code
          {defaultCode ? (
            <>
              {" "}
              (
              <span className="font-mono text-[13px] text-ink">
                {defaultCode.code}
              </span>
              )
            </>
          ) : null}{" "}
          when you post.
        </p>
      </header>
      {banners.length === 0 ? (
        <Card>
          <CardHeader>
            <h2 className="text-[16px] font-semibold text-ink">
              No banners yet
            </h2>
          </CardHeader>
          <CardBody>
            <p className="text-[14px] text-ink-mute">
              We&apos;re preparing shareable artwork. Check back soon —
              we&apos;ll email you when the first batch drops.
            </p>
          </CardBody>
        </Card>
      ) : (
        <BannerGrid banners={banners} referralCode={defaultCode?.code ?? null} />
      )}
    </div>
  );
}
