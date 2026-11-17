"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { currencies, users } from "@/lib/db/schema";
import { unitsPerUsdToRate } from "@/lib/money";
import { getSpaceContext } from "@/lib/space";
import type { ActionState } from "./auth";

const currencySchema = z.object({
  code: z.string().min(2).max(8),
  name: z.string().min(2),
  unitsPerUsd: z.coerce.number().positive(),
});

export async function createCurrencyAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  const parsed = currencySchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    unitsPerUsd: formData.get("unitsPerUsd"),
  });
  if (!parsed.success) return { error: "Vérifiez le code, le nom et le taux" };

  const code = parsed.data.code.toUpperCase().trim();
  const [existing] = await db
    .select()
    .from(currencies)
    .where(and(eq(currencies.userId, ownerId), eq(currencies.code, code)))
    .limit(1);
  if (existing) return { error: `La devise ${code} existe déjà` };

  const rateToUsd =
    code === "USD" ? 1 : unitsPerUsdToRate(parsed.data.unitsPerUsd);

  await db.insert(currencies).values({
    id: crypto.randomUUID(),
    userId: ownerId,
    code,
    name: parsed.data.name.trim(),
    rateToUsd,
    isDefault: false,
  });

  revalidatePath("/settings/currencies");
  revalidatePath("/dashboard");
  return { success: `Devise ${code} ajoutée` };
}

export async function updateCurrencyAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  const id = String(formData.get("id") ?? "");
  const parsed = currencySchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    unitsPerUsd: formData.get("unitsPerUsd"),
  });
  if (!id || !parsed.success) return { error: "Données invalides" };

  const [row] = await db
    .select()
    .from(currencies)
    .where(and(eq(currencies.id, id), eq(currencies.userId, ownerId)))
    .limit(1);
  if (!row) return { error: "Devise introuvable" };

  const code = parsed.data.code.toUpperCase().trim();
  const rateToUsd =
    code === "USD" ? 1 : unitsPerUsdToRate(parsed.data.unitsPerUsd);

  await db
    .update(currencies)
    .set({ code, name: parsed.data.name.trim(), rateToUsd })
    .where(and(eq(currencies.id, id), eq(currencies.userId, ownerId)));

  revalidatePath("/settings/currencies");
  revalidatePath("/dashboard");
  return { success: "Devise mise à jour" };
}

export async function deleteCurrencyAction(id: string): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  const [row] = await db
    .select()
    .from(currencies)
    .where(and(eq(currencies.id, id), eq(currencies.userId, ownerId)))
    .limit(1);
  if (!row) return { error: "Devise introuvable" };
  if (row.isDefault || row.code === "USD") {
    return { error: "Impossible de supprimer la devise par défaut USD" };
  }

  try {
    await db
      .delete(currencies)
      .where(and(eq(currencies.id, id), eq(currencies.userId, ownerId)));
  } catch {
    return { error: "Cette devise est utilisée par des transactions ou budgets" };
  }

  revalidatePath("/settings/currencies");
  return { success: "Devise supprimée" };
}

export async function setDisplayCurrencyAction(
  code: string
): Promise<ActionState> {
  const { ownerId, canWrite } = await getSpaceContext();
  if (!canWrite) return { error: "Lecture seule sur cet espace" };

  const [currency] = await db
    .select()
    .from(currencies)
    .where(and(eq(currencies.userId, ownerId), eq(currencies.code, code)))
    .limit(1);
  if (!currency) return { error: "Devise introuvable" };

  await db
    .update(users)
    .set({ defaultCurrencyCode: currency.code })
    .where(eq(users.id, ownerId));

  revalidatePath("/settings/currencies");
  revalidatePath("/dashboard");
  return { success: `Devise d'affichage : ${currency.code}` };
}
