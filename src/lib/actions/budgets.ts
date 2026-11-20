"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { budgets } from "@/lib/db/schema";
import { getSpaceContext } from "@/lib/space";
import type { ActionState } from "./auth";

const budgetSchema = z.object({
  title: z.string().trim().max(80, "Titre trop long (80 caractères max)").optional(),
  categoryId: z.string().min(1),
  currencyId: z.string().min(1),
  amount: z.coerce.number().positive(),
  period: z.enum(["month", "week", "day"]),
  startDate: z.string().min(1),
});

/** Message clair si la colonne `title` n'a pas encore été migrée. */
function titleMigrationError(error: unknown): string {
  const msg =
    error instanceof Error ? `${error.message} ${String(error.cause ?? "")}` : "";
  if (/title/.test(msg) && /(does not exist|42703)/i.test(msg)) {
    return "Migration requise : exécutez scripts/migrate-budget-title.mjs puis réessayez.";
  }
  return "Impossible d'enregistrer le budget";
}

export async function createBudgetAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  const parsed = budgetSchema.safeParse({
    title: formData.get("title") || undefined,
    categoryId: formData.get("categoryId"),
    currencyId: formData.get("currencyId"),
    amount: formData.get("amount"),
    period: formData.get("period"),
    startDate: formData.get("startDate"),
  });
  if (!parsed.success) return { error: "Vérifiez les champs du budget" };

  const { title, ...rest } = parsed.data;
  try {
    await db.insert(budgets).values({
      id: crypto.randomUUID(),
      userId: ownerId,
      ...rest,
      // Sans titre, on n'écrit pas la colonne (fonctionne avant la migration)
      ...(title ? { title } : {}),
    });
  } catch (error) {
    return { error: titleMigrationError(error) };
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: "Budget créé" };
}

export async function updateBudgetAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  const id = String(formData.get("id") ?? "");
  const parsed = budgetSchema.safeParse({
    title: formData.get("title") || undefined,
    categoryId: formData.get("categoryId"),
    currencyId: formData.get("currencyId"),
    amount: formData.get("amount"),
    period: formData.get("period"),
    startDate: formData.get("startDate"),
  });
  if (!id || !parsed.success) return { error: "Données invalides" };

  try {
    await db
      .update(budgets)
      .set({ ...parsed.data, title: parsed.data.title || null })
      .where(and(eq(budgets.id, id), eq(budgets.userId, ownerId)));
  } catch (error) {
    return { error: titleMigrationError(error) };
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: "Budget mis à jour" };
}

export async function deleteBudgetAction(id: string): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  await db
    .delete(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.userId, ownerId)));
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: "Budget supprimé" };
}
