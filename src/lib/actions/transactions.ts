"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories, transactions } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import type { ActionState } from "./auth";

const transactionSchema = z.object({
  categoryId: z.string().min(1),
  currencyId: z.string().min(1),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  note: z.string().optional(),
  date: z.string().min(1),
});

export async function createTransactionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = transactionSchema.safeParse({
    categoryId: formData.get("categoryId"),
    currencyId: formData.get("currencyId"),
    amount: formData.get("amount"),
    note: formData.get("note") || undefined,
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const [category] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.id, parsed.data.categoryId),
        eq(categories.userId, user.id)
      )
    )
    .limit(1);

  if (!category) return { error: "Catégorie introuvable" };

  await db.insert(transactions).values({
    id: crypto.randomUUID(),
    userId: user.id,
    categoryId: parsed.data.categoryId,
    currencyId: parsed.data.currencyId,
    type: category.type,
    amount: parsed.data.amount,
    note: parsed.data.note?.trim() || null,
    date: parsed.data.date,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  return { success: "Transaction enregistrée" };
}

export async function updateTransactionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = transactionSchema.safeParse({
    categoryId: formData.get("categoryId"),
    currencyId: formData.get("currencyId"),
    amount: formData.get("amount"),
    note: formData.get("note") || undefined,
    date: formData.get("date"),
  });

  if (!id || !parsed.success) {
    return { error: "Données invalides" };
  }

  const [category] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.id, parsed.data.categoryId),
        eq(categories.userId, user.id)
      )
    )
    .limit(1);

  if (!category) return { error: "Catégorie introuvable" };

  await db
    .update(transactions)
    .set({
      categoryId: parsed.data.categoryId,
      currencyId: parsed.data.currencyId,
      type: category.type,
      amount: parsed.data.amount,
      note: parsed.data.note?.trim() || null,
      date: parsed.data.date,
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  return { success: "Transaction mise à jour" };
}

export async function deleteTransactionAction(id: string): Promise<ActionState> {
  const user = await requireUser();
  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  return { success: "Transaction supprimée" };
}

export async function listTransactions(filters?: {
  type?: "income" | "expense";
  categoryId?: string;
}) {
  const user = await requireUser();
  const conditions = [eq(transactions.userId, user.id)];
  if (filters?.type) conditions.push(eq(transactions.type, filters.type));
  if (filters?.categoryId)
    conditions.push(eq(transactions.categoryId, filters.categoryId));

  return db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date));
}
