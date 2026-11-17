"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { spaceShares, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { ACTIVE_OWNER_COOKIE } from "@/lib/space";
import type { ActionState } from "./auth";

const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
});

export async function inviteToSpaceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email invalide" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  if (email === user.email?.toLowerCase()) {
    return { error: "Vous ne pouvez pas vous inviter vous-même" };
  }

  const [member] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!member) {
    return {
      error:
        "Aucun compte Expenssa avec cet email. La personne doit d'abord s'inscrire.",
    };
  }

  const [existing] = await db
    .select()
    .from(spaceShares)
    .where(
      and(
        eq(spaceShares.ownerUserId, user.id),
        eq(spaceShares.memberUserId, member.id)
      )
    )
    .limit(1);

  if (existing) {
    if (existing.status === "accepted") {
      return { error: "Cet utilisateur a déjà accès à votre espace" };
    }
    return { error: "Une invitation est déjà en attente pour cet email" };
  }

  await db.insert(spaceShares).values({
    id: crypto.randomUUID(),
    ownerUserId: user.id,
    memberUserId: member.id,
    role: "editor",
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/settings/sharing");
  return { success: `Invitation envoyée à ${member.name} (${member.email})` };
}

export async function acceptShareAction(shareId: string): Promise<ActionState> {
  const user = await requireUser();
  const [share] = await db
    .select()
    .from(spaceShares)
    .where(
      and(
        eq(spaceShares.id, shareId),
        eq(spaceShares.memberUserId, user.id),
        eq(spaceShares.status, "pending")
      )
    )
    .limit(1);

  if (!share) return { error: "Invitation introuvable" };

  await db
    .update(spaceShares)
    .set({ status: "accepted" })
    .where(eq(spaceShares.id, shareId));

  revalidatePath("/settings/sharing");
  revalidatePath("/dashboard");
  return { success: "Invitation acceptée — vous pouvez basculer vers cet espace" };
}

export async function declineShareAction(shareId: string): Promise<ActionState> {
  const user = await requireUser();
  const [share] = await db
    .select()
    .from(spaceShares)
    .where(
      and(
        eq(spaceShares.id, shareId),
        or(
          eq(spaceShares.memberUserId, user.id),
          eq(spaceShares.ownerUserId, user.id)
        )
      )
    )
    .limit(1);

  if (!share) return { error: "Invitation introuvable" };

  await db.delete(spaceShares).where(eq(spaceShares.id, share.id));

  const jar = await cookies();
  if (jar.get(ACTIVE_OWNER_COOKIE)?.value === share.ownerUserId) {
    jar.set(ACTIVE_OWNER_COOKIE, user.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  revalidatePath("/settings/sharing");
  revalidatePath("/", "layout");
  return { success: "Invitation refusée / accès retiré" };
}

export async function revokeShareAction(shareId: string): Promise<ActionState> {
  const user = await requireUser();
  const [share] = await db
    .select()
    .from(spaceShares)
    .where(
      and(eq(spaceShares.id, shareId), eq(spaceShares.ownerUserId, user.id))
    )
    .limit(1);

  if (!share) return { error: "Partage introuvable" };

  await db.delete(spaceShares).where(eq(spaceShares.id, share.id));

  revalidatePath("/settings/sharing");
  revalidatePath("/", "layout");
  return { success: "Accès révoqué" };
}

export async function switchSpaceAction(ownerId: string): Promise<ActionState> {
  const user = await requireUser();

  if (ownerId !== user.id) {
    const [share] = await db
      .select()
      .from(spaceShares)
      .where(
        and(
          eq(spaceShares.memberUserId, user.id),
          eq(spaceShares.ownerUserId, ownerId),
          eq(spaceShares.status, "accepted")
        )
      )
      .limit(1);
    if (!share) return { error: "Accès non autorisé à cet espace" };
  }

  const jar = await cookies();
  jar.set(ACTIVE_OWNER_COOKIE, ownerId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  return { success: "Espace actif mis à jour" };
}
