import Link from "next/link";
import { headers } from "next/headers";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

/**
 * "You've been signed out" landing page — served on the partner
 * subdomain so a partner logging out never lands on the student-app
 * login and gets confused about which surface they're on.
 *
 * Sign-in still lives on the app host (single source of truth for
 * credentials). We build the CTA URL server-side so we can compute
 * a `returnTo` that bounces the user back to whatever partner host
 * they were on (bare vs www — same convention as the proxy).
 */
export default async function PartnerSignedOutPage() {
  const h = await headers();
  const host =
    (
      h.get("x-forwarded-host") ??
      h.get("host") ??
      "partners.bondzi.online"
    )
      .toLowerCase()
      .split(":")[0];
  const returnTo = `https://${host}/partner/dashboard`;
  const loginUrl = `https://app.bondzi.online/login?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
      <div className="max-w-lg w-full text-center">
        <p className="kicker">Bondzi Partner</p>
        <h1 className="display text-[36px] sm:text-[44px] mt-2">
          Signed out
        </h1>
        <p className="mt-3 text-ink-soft text-[15px] leading-relaxed">
          You&apos;ve been signed out of the Bondzi partner portal.
          Thanks for the referrals — sign back in whenever you&apos;re
          ready.
        </p>
        <Card className="mt-8">
          <CardBody className="space-y-4">
            <p className="text-[14px] text-ink-mute">
              Signing in uses your same Bondzi account (email or
              phone).
            </p>
            <Button href={loginUrl} block external>
              Sign in to partner portal
            </Button>
            <p className="text-[12.5px] text-ink-mute">
              Don&apos;t have a partner account yet?{" "}
              <Link
                href="https://bondzi.online"
                className="font-medium text-orange hover:text-orange-deep"
              >
                Learn about the programme
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
