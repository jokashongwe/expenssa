"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { currencies, incomeSources } from "@/lib/db/schema";
import { getSpaceContext } from "@/lib/space";
import type { ActionState } from "./auth";

const incomeSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(80),
  currencyId: z.string().min(1, "Choisissez une devise"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  frequency: z.enum(["month", "year"]),
});

function parse(formData: FormData) {
  const parsed = incomeSchema.safeParse({
    name: formData.get("name"),
    currencyId: formData.get("currencyId"),
    amount: formData.get("amount"),
    frequency: formData.get("frequency"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      error: {
        error: issue?.message ?? "Données invalides",
        field: typeof issue?.path[0] === "string" ? issue.path[0] : undefined,
      } satisfies ActionState,
    };
  }
  return { data: parsed.data };
}

async function ownsCurrency(ownerId: string, currencyId: string) {
  const [row] = await db
    .select({ id: currencies.id })
    .from(currencies)
    .where(and(eq(currencies.id, currencyId), eq(currencies.userId, ownerId)))
    .limit(1);
  return !!row;
}

function revalidate() {
  revalidatePath("/income");
  revalidatePath("/dashboard");
}

export async function createIncomeSourceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  const { data, error } = parse(formData);
  if (!data) return error;
  if (!(await ownsCurrency(ownerId, data.currencyId))) {
    return { error: "Devise introuvable", field: "currencyId" };
  }

  await db.insert(incomeSources).values({
    id: crypto.randomUUID(),
    userId: ownerId,
    createdAt: new Date().toISOString(),
    ...data,
  });

  revalidate();
  return { success: "Source de revenu ajoutée" };
}

export async function updateIncomeSourceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  const id = String(formData.get("id") ?? "");
  const { data, error } = parse(formData);
  if (!id) return { error: "Données invalides" };
  if (!data) return error;
  if (!(await ownsCurrency(ownerId, data.currencyId))) {
    return { error: "Devise introuvable", field: "currencyId" };
  }

  await db
    .update(incomeSources)
    .set(data)
    .where(and(eq(incomeSources.id, id), eq(incomeSources.userId, ownerId)));

  revalidate();
  return { success: "Source de revenu mise à jour" };
}

export async function deleteIncomeSourceAction(
  id: string
): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  await db
    .delete(incomeSources)
    .where(and(eq(incomeSources.id, id), eq(incomeSources.userId, ownerId)));

  revalidate();
  return { success: "Source de revenu supprimée" };
}
