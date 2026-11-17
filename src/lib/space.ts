import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { spaceShares, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";

export const ACTIVE_OWNER_COOKIE = "expenssa_active_owner";

export type SpaceContext = {
  user: { id: string; email: string; name: string };
  /** Propriétaire des données actuellement affichées / modifiées */
  ownerId: string;
  isOwnSpace: boolean;
  canWrite: boolean;
  ownerName: string;
};

async function hasAcceptedShare(memberId: string, ownerId: string) {
  const [row] = await db
    .select({ id: spaceShares.id })
    .from(spaceShares)
    .where(
      and(
        eq(spaceShares.memberUserId, memberId),
        eq(spaceShares.ownerUserId, ownerId),
        eq(spaceShares.status, "accepted")
      )
    )
    .limit(1);
  return !!row;
}

export async function getActiveOwnerId(userId: string): Promise<string> {
  const jar = await cookies();
  const candidate = jar.get(ACTIVE_OWNER_COOKIE)?.value;
  if (!candidate || candidate === userId) return userId;
  if (await hasAcceptedShare(userId, candidate)) return candidate;
  return userId;
}

export async function getSpaceContext(): Promise<SpaceContext> {
  const user = await requireUser();
  const ownerId = await getActiveOwnerId(user.id);
  const isOwnSpace = ownerId === user.id;
  const canWrite = isOwnSpace || (await hasAcceptedShare(user.id, ownerId));

  let ownerName = user.name;
  if (!isOwnSpace) {
    const [owner] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, ownerId))
      .limit(1);
    ownerName = owner?.name ?? "Espace partagé";
  }

  return {
    user: { id: user.id, email: user.email!, name: user.name! },
    ownerId,
    isOwnSpace,
    canWrite,
    ownerName,
  };
}

export async function listAccessibleSpaces(userId: string) {
  const own = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const shared = await db
    .select({
      shareId: spaceShares.id,
      ownerId: spaceShares.ownerUserId,
      status: spaceShares.status,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(spaceShares)
    .innerJoin(users, eq(spaceShares.ownerUserId, users.id))
    .where(eq(spaceShares.memberUserId, userId));

  return {
    own: own[0]!,
    sharedAccepted: shared.filter((s) => s.status === "accepted"),
    sharedPending: shared.filter((s) => s.status === "pending"),
  };
}

export async function listOutgoingShares(ownerId: string) {
  return db
    .select({
      id: spaceShares.id,
      memberId: spaceShares.memberUserId,
      status: spaceShares.status,
      createdAt: spaceShares.createdAt,
      memberName: users.name,
      memberEmail: users.email,
    })
    .from(spaceShares)
    .innerJoin(users, eq(spaceShares.memberUserId, users.id))
    .where(eq(spaceShares.ownerUserId, ownerId));
}

export async function findIncomingPending(userId: string) {
  return db
    .select({
      id: spaceShares.id,
      ownerId: spaceShares.ownerUserId,
      createdAt: spaceShares.createdAt,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(spaceShares)
    .innerJoin(users, eq(spaceShares.ownerUserId, users.id))
    .where(
      and(
        eq(spaceShares.memberUserId, userId),
        eq(spaceShares.status, "pending")
      )
    );
}

/** Vérifie qu'un utilisateur a un accès (propre ou partagé accepté) à un owner. */
export async function assertCanAccess(userId: string, ownerId: string) {
  if (userId === ownerId) return true;
  return hasAcceptedShare(userId, ownerId);
}
