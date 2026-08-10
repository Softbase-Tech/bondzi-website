import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

/**
 * "You've been signed out" landing page — served on the partner
 * subdomain so a partner logging out never lands on the student-app
 * login and gets confused about which surface they're on.
 *
 * Sign-in link points at `/partner/signin` (same host) so the
 * partner never leaves partners.bondzi.online during the sign-in
 * loop. Same-host login also means the browser writes the session
 * cookie on the host we're browsing, sidestepping any cookie-
 * domain-scoping concerns entirely.
 */
export default function PartnerSignedOutPage() {
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
            <Button href="/partner/signin" block>
              Sign in to partner portal
            </Button>
            <p className="text-[12.5px] text-ink-mute">
              Don&apos;t have a partner account yet?{" "}
              <Link
                href="https://bondzi.online/partners"
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
