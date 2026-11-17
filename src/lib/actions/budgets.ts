"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { budgets } from "@/lib/db/schema";
import { getSpaceContext } from "@/lib/space";
import type { ActionState } from "./auth";

const budgetSchema = z.object({
  categoryId: z.string().min(1),
  currencyId: z.string().min(1),
  amount: z.coerce.number().positive(),
  period: z.enum(["month", "week", "day"]),
  startDate: z.string().min(1),
});

export async function createBudgetAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  const parsed = budgetSchema.safeParse({
    categoryId: formData.get("categoryId"),
    currencyId: formData.get("currencyId"),
    amount: formData.get("amount"),
    period: formData.get("period"),
    startDate: formData.get("startDate"),
  });
  if (!parsed.success) return { error: "Vérifiez les champs du budget" };

  await db.insert(budgets).values({
    id: crypto.randomUUID(),
    userId: ownerId,
    ...parsed.data,
  });

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
    categoryId: formData.get("categoryId"),
    currencyId: formData.get("currencyId"),
    amount: formData.get("amount"),
    period: formData.get("period"),
    startDate: formData.get("startDate"),
  });
  if (!id || !parsed.success) return { error: "Données invalides" };

  await db
    .update(budgets)
    .set(parsed.data)
    .where(and(eq(budgets.id, id), eq(budgets.userId, ownerId)));

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
