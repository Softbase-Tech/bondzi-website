import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import {
  getCurrentPartnerTerms,
  getMyPartner,
} from "@/lib/api/partner";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EditMomoForm } from "./EditMomoForm";

export default async function PartnerProfilePage() {
  const session = await auth();
  const accessToken = session?.accessToken ?? null;
  if (!accessToken) redirect("/partner/signin?returnTo=%2Fpartner%2Fprofile");

  const partner = await getMyPartner(accessToken);
  if (!partner) redirect("/partner/register");
  const terms = await getCurrentPartnerTerms(accessToken).catch(() => null);
  const isBanned = partner.status === "banned";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <p className="kicker">Profile</p>
        <h1 className="display text-[28px] sm:text-[36px] mt-1">
          Your partner details
        </h1>
      </header>

      <Card>
        <CardHeader>
          <h2 className="text-[16px] font-semibold text-ink">Contact</h2>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px]">
            <Field label="Full name" value={partner.fullName} />
            <Field label="Email" value={partner.email} />
            <Field label="Phone" value={partner.phone} />
            <Field
              label="Country"
              value={partner.countryCode.toUpperCase()}
            />
          </dl>
          <p className="mt-4 text-[12.5px] text-ink-mute">
            Contact details are read-only here. To change your name /
            email / phone, edit your main Bondzi account.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-[16px] font-semibold text-ink">
            MoMo payout details
          </h2>
          <p className="text-[13px] text-ink-mute mt-1">
            Where we send your earnings. Update this only if you&apos;ve
            moved to a new MoMo number — the name must match the number
            registered with the provider.
          </p>
        </CardHeader>
        <CardBody>
          <EditMomoForm partner={partner} canEdit={!isBanned} />
        </CardBody>
      </Card>

      {terms ? (
        <Card>
          <CardHeader>
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <h2 className="text-[16px] font-semibold text-ink">
                Terms you accepted
              </h2>
              <span className="text-[12px] font-mono uppercase tracking-wider text-ink-mute">
                current v{terms.version}
              </span>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-[13px] text-ink-mute mb-3">
              You&apos;re on version {partnerVersionOf(partner.agreedTermsVersionId, terms)}.
              This is the version of the partner agreement that governs
              your commissions.
            </p>
            <details className="rounded-lg border border-rule bg-yellow-soft/30 p-3">
              <summary className="cursor-pointer text-[13px] font-medium text-ink-soft">
                Read the current terms
              </summary>
              <div className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
                {terms.bodyMd}
              </div>
            </details>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-mono uppercase tracking-wider text-ink-mute">
        {label}
      </dt>
      <dd className="mt-1 text-[15px] text-ink break-words">{value}</dd>
    </div>
  );
}

function partnerVersionOf(
  agreedId: string,
  currentTerms: { id: string; version: number },
): string {
  // Backend gives us the current terms only — if the ids match, show
  // the same version; otherwise we can't know the number without
  // another fetch (Phase 5 will add a /partner/terms/:id endpoint).
  if (agreedId === currentTerms.id) return String(currentTerms.version);
  return "earlier";
}
