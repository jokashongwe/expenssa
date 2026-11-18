import { AppShell } from "@/components/layout/app-shell";
import { SpaceBanner } from "@/components/layout/space-banner";
import { getSpaceContext, listAccessibleSpaces } from "@/lib/space";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const space = await getSpaceContext();
  const { sharedAccepted } = await listAccessibleSpaces(space.user.id);
  const label = space.isOwnSpace
    ? space.user.name
    : `${space.user.name} · ${space.ownerName}`;

  return (
    <AppShell
      userName={label}
      spaces={{
        activeOwnerId: space.ownerId,
        ownUserId: space.user.id,
        ownName: space.user.name,
        spaces: sharedAccepted.map((s) => ({
          ownerId: s.ownerId,
          name: s.ownerName,
        })),
      }}
    >
      <SpaceBanner
        isOwnSpace={space.isOwnSpace}
        ownerName={space.ownerName}
      />
      {children}
    </AppShell>
  );
}
