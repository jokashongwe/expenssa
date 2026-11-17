"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { getSpaceContext } from "@/lib/space";
import type { ActionState } from "./auth";

const categorySchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  type: z.enum(["income", "expense"]),
  color: z.string().min(4),
  icon: z.string().min(1),
});

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    color: formData.get("color") || "#0d9488",
    icon: formData.get("icon") || "circle",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  await db.insert(categories).values({
    id: crypto.randomUUID(),
    userId: ownerId,
    name: parsed.data.name.trim(),
    type: parsed.data.type,
    color: parsed.data.color,
    icon: parsed.data.icon,
  });

  revalidatePath("/categories");
  revalidatePath("/transactions");
  return { success: "Catégorie créée" };
}

export async function updateCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  const id = String(formData.get("id") ?? "");
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    color: formData.get("color") || "#0d9488",
    icon: formData.get("icon") || "circle",
  });
  if (!id || !parsed.success) return { error: "Données invalides" };

  await db
    .update(categories)
    .set({
      name: parsed.data.name.trim(),
      type: parsed.data.type,
      color: parsed.data.color,
      icon: parsed.data.icon,
    })
    .where(and(eq(categories.id, id), eq(categories.userId, ownerId)));

  revalidatePath("/categories");
  return { success: "Catégorie mise à jour" };
}

export async function deleteCategoryAction(id: string): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  try {
    await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, ownerId)));
  } catch {
    return { error: "Impossible de supprimer : catégorie utilisée" };
  }
  revalidatePath("/categories");
  return { success: "Catégorie supprimée" };
}
