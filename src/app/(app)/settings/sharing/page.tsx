import { SharingClient } from "@/components/sharing/sharing-client";
import { requireUser } from "@/lib/session";
import {
  findIncomingPending,
  getActiveOwnerId,
  listAccessibleSpaces,
  listOutgoingShares,
} from "@/lib/space";

export default async function SharingPage() {
  const user = await requireUser();
  const activeOwnerId = await getActiveOwnerId(user.id);
  const spaces = await listAccessibleSpaces(user.id);
  const outgoing = await listOutgoingShares(user.id);
  const incoming = await findIncomingPending(user.id);

  return (
    <SharingClient
      activeOwnerId={activeOwnerId}
      ownUserId={user.id}
      ownName={user.name ?? "Moi"}
      outgoing={outgoing}
      incoming={incoming}
      accessible={spaces.sharedAccepted}
    />
  );
}
