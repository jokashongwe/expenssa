import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, currencies } from "@/lib/db/schema";

const DEFAULT_CATEGORIES = [
  { name: "Salaire", type: "income" as const, color: "#059669", icon: "wallet" },
  { name: "Autres revenus", type: "income" as const, color: "#10b981", icon: "plus-circle" },
  { name: "Alimentation", type: "expense" as const, color: "#f59e0b", icon: "utensils" },
  { name: "Transport", type: "expense" as const, color: "#3b82f6", icon: "car" },
  { name: "Logement", type: "expense" as const, color: "#8b5cf6", icon: "home" },
  { name: "Loisirs", type: "expense" as const, color: "#ec4899", icon: "smile" },
  { name: "Santé", type: "expense" as const, color: "#ef4444", icon: "heart" },
  { name: "Autre", type: "expense" as const, color: "#64748b", icon: "circle" },
];

export async function seedUserDefaults(userId: string) {
  const existingCurrencies = await db
    .select({ id: currencies.id })
    .from(currencies)
    .where(eq(currencies.userId, userId))
    .limit(1);

  if (existingCurrencies.length === 0) {
    await db.insert(currencies).values({
      id: crypto.randomUUID(),
      userId,
      code: "USD",
      name: "Dollar américain",
      rateToUsd: 1,
      isDefault: true,
    });
  }

  const existingCategories = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.userId, userId))
    .limit(1);

  if (existingCategories.length === 0) {
    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map((cat) => ({
        id: crypto.randomUUID(),
        userId,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
      }))
    );
  }
}
