"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { currencies, users } from "@/lib/db/schema";
import { unitsPerUsdToRate } from "@/lib/money";
import { requireUser } from "@/lib/session";
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
  const user = await requireUser();
  const parsed = currencySchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    unitsPerUsd: formData.get("unitsPerUsd"),
  });

  if (!parsed.success) {
    return { error: "Vérifiez le code, le nom et le taux" };
  }

  const code = parsed.data.code.toUpperCase().trim();
  const existing = db
    .select()
    .from(currencies)
    .where(and(eq(currencies.userId, user.id), eq(currencies.code, code)))
    .get();

  if (existing) {
    return { error: `La devise ${code} existe déjà` };
  }

  const rateToUsd = code === "USD" ? 1 : unitsPerUsdToRate(parsed.data.unitsPerUsd);

  db.insert(currencies)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      code,
      name: parsed.data.name.trim(),
      rateToUsd,
      isDefault: false,
    })
    .run();

  revalidatePath("/settings/currencies");
  revalidatePath("/dashboard");
  return { success: `Devise ${code} ajoutée` };
}

export async function updateCurrencyAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = currencySchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    unitsPerUsd: formData.get("unitsPerUsd"),
  });

  if (!id || !parsed.success) {
    return { error: "Données invalides" };
  }

  const row = db
    .select()
    .from(currencies)
    .where(and(eq(currencies.id, id), eq(currencies.userId, user.id)))
    .get();

  if (!row) return { error: "Devise introuvable" };

  const code = parsed.data.code.toUpperCase().trim();
  const rateToUsd = code === "USD" ? 1 : unitsPerUsdToRate(parsed.data.unitsPerUsd);

  db.update(currencies)
    .set({
      code,
      name: parsed.data.name.trim(),
      rateToUsd,
    })
    .where(and(eq(currencies.id, id), eq(currencies.userId, user.id)))
    .run();

  revalidatePath("/settings/currencies");
  revalidatePath("/dashboard");
  return { success: "Devise mise à jour" };
}

export async function deleteCurrencyAction(id: string): Promise<ActionState> {
  const user = await requireUser();
  const row = db
    .select()
    .from(currencies)
    .where(and(eq(currencies.id, id), eq(currencies.userId, user.id)))
    .get();

  if (!row) return { error: "Devise introuvable" };
  if (row.isDefault || row.code === "USD") {
    return { error: "Impossible de supprimer la devise par défaut USD" };
  }

  try {
    db.delete(currencies)
      .where(and(eq(currencies.id, id), eq(currencies.userId, user.id)))
      .run();
  } catch {
    return { error: "Cette devise est utilisée par des transactions ou budgets" };
  }

  revalidatePath("/settings/currencies");
  return { success: "Devise supprimée" };
}

export async function setDisplayCurrencyAction(
  code: string
): Promise<ActionState> {
  const user = await requireUser();
  const currency = db
    .select()
    .from(currencies)
    .where(and(eq(currencies.userId, user.id), eq(currencies.code, code)))
    .get();

  if (!currency) return { error: "Devise introuvable" };

  db.update(users)
    .set({ defaultCurrencyCode: currency.code })
    .where(eq(users.id, user.id))
    .run();

  revalidatePath("/settings/currencies");
  revalidatePath("/dashboard");
  return { success: `Devise d'affichage : ${currency.code}` };
}
