"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { budgetPlannedItems, budgets } from "@/lib/db/schema";
import { getSpaceContext } from "@/lib/space";
import type { ActionState } from "./auth";

const itemSchema = z.object({
  budgetId: z.string().min(1),
  label: z.string().min(2, "Libellé trop court"),
  amount: z.coerce.number().positive("Montant invalide"),
});

async function assertBudgetOwner(ownerId: string, budgetId: string) {
  const [row] = await db
    .select({ id: budgets.id })
    .from(budgets)
    .where(and(eq(budgets.id, budgetId), eq(budgets.userId, ownerId)))
    .limit(1);
  return !!row;
}

export async function createPlannedItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  const parsed = itemSchema.safeParse({
    budgetId: formData.get("budgetId"),
    label: formData.get("label"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  if (!(await assertBudgetOwner(ownerId, parsed.data.budgetId))) {
    return { error: "Budget introuvable" };
  }

  await db.insert(budgetPlannedItems).values({
    id: crypto.randomUUID(),
    userId: ownerId,
    budgetId: parsed.data.budgetId,
    label: parsed.data.label.trim(),
    amount: parsed.data.amount,
    checked: true,
  });

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: "Dépense prévisionnelle ajoutée" };
}

export async function togglePlannedItemAction(
  id: string,
  checked: boolean
): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  await db
    .update(budgetPlannedItems)
    .set({ checked })
    .where(
      and(
        eq(budgetPlannedItems.id, id),
        eq(budgetPlannedItems.userId, ownerId)
      )
    );

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: checked ? "Prévision cochée" : "Prévision décochée" };
}

export async function deletePlannedItemAction(id: string): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  await db
    .delete(budgetPlannedItems)
    .where(
      and(
        eq(budgetPlannedItems.id, id),
        eq(budgetPlannedItems.userId, ownerId)
      )
    );

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: "Prévision supprimée" };
}
