import { AppShell } from "@/components/layout/app-shell";
import { SpaceBanner } from "@/components/layout/space-banner";
import { getSpaceContext } from "@/lib/space";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const space = await getSpaceContext();
  const label = space.isOwnSpace
    ? space.user.name
    : `${space.user.name} · ${space.ownerName}`;

  return (
    <AppShell userName={label}>
      <SpaceBanner
        isOwnSpace={space.isOwnSpace}
        ownerName={space.ownerName}
      />
      {children}
    </AppShell>
  );
}
