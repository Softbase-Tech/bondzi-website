import type { ReactNode } from "react";

/**
 * Layout for the public corner of the partner subdomain — the
 * signed-out landing today, potentially a partner-branded marketing
 * page or terms preview in later phases. Deliberately distinct from
 * the `(partner)` group's layout so it inherits NO auth guard, NO
 * sidebar/nav, NO fetch of the current partner. This surface must
 * work for a user who's not signed in.
 */
export default function PartnerPublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
