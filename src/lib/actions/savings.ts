"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { savingsPlans } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import type { ActionState } from "./auth";

const savingsSchema = z.object({
  name: z.string().min(2),
  currencyId: z.string().min(1),
  targetAmount: z.coerce.number().positive(),
  periodicity: z.enum(["month", "week", "day"]),
  durationUnits: z.coerce.number().int().positive(),
  startDate: z.string().min(1),
});

export async function createSavingsPlanAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = savingsSchema.safeParse({
    name: formData.get("name"),
    currencyId: formData.get("currencyId"),
    targetAmount: formData.get("targetAmount"),
    periodicity: formData.get("periodicity"),
    durationUnits: formData.get("durationUnits"),
    startDate: formData.get("startDate"),
  });

  if (!parsed.success) {
    return { error: "Vérifiez les champs du plan d'épargne" };
  }

  db.insert(savingsPlans)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      name: parsed.data.name.trim(),
      currencyId: parsed.data.currencyId,
      targetAmount: parsed.data.targetAmount,
      currentAmount: 0,
      periodicity: parsed.data.periodicity,
      durationUnits: parsed.data.durationUnits,
      startDate: parsed.data.startDate,
    })
    .run();

  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return { success: "Plan d'épargne créé" };
}

export async function updateSavingsPlanAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = savingsSchema.safeParse({
    name: formData.get("name"),
    currencyId: formData.get("currencyId"),
    targetAmount: formData.get("targetAmount"),
    periodicity: formData.get("periodicity"),
    durationUnits: formData.get("durationUnits"),
    startDate: formData.get("startDate"),
  });

  if (!id || !parsed.success) {
    return { error: "Données invalides" };
  }

  db.update(savingsPlans)
    .set({
      name: parsed.data.name.trim(),
      currencyId: parsed.data.currencyId,
      targetAmount: parsed.data.targetAmount,
      periodicity: parsed.data.periodicity,
      durationUnits: parsed.data.durationUnits,
      startDate: parsed.data.startDate,
    })
    .where(and(eq(savingsPlans.id, id), eq(savingsPlans.userId, user.id)))
    .run();

  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return { success: "Plan mis à jour" };
}

export async function contributeSavingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const amount = Number(formData.get("amount"));

  if (!id || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Montant de versement invalide" };
  }

  const plan = db
    .select()
    .from(savingsPlans)
    .where(and(eq(savingsPlans.id, id), eq(savingsPlans.userId, user.id)))
    .get();

  if (!plan) return { error: "Plan introuvable" };

  db.update(savingsPlans)
    .set({
      currentAmount: sql`${savingsPlans.currentAmount} + ${amount}`,
    })
    .where(and(eq(savingsPlans.id, id), eq(savingsPlans.userId, user.id)))
    .run();

  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return { success: "Versement enregistré" };
}

export async function deleteSavingsPlanAction(id: string): Promise<ActionState> {
  const user = await requireUser();
  db.delete(savingsPlans)
    .where(and(eq(savingsPlans.id, id), eq(savingsPlans.userId, user.id)))
    .run();
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return { success: "Plan supprimé" };
}
