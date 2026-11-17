import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  text,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  defaultCurrencyCode: text("default_currency_code").notNull().default("USD"),
  createdAt: text("created_at").notNull(),
});

export const currencies = pgTable("currencies", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  /** How many USD one unit of this currency equals (USD = 1). */
  rateToUsd: doublePrecision("rate_to_usd").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  color: text("color").notNull().default("#0d9488"),
  icon: text("icon").notNull().default("circle"),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  currencyId: text("currency_id")
    .notNull()
    .references(() => currencies.id, { onDelete: "restrict" }),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  amount: doublePrecision("amount").notNull(),
  note: text("note"),
  date: text("date").notNull(),
  createdAt: text("created_at").notNull(),
});

export const budgets = pgTable("budgets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  currencyId: text("currency_id")
    .notNull()
    .references(() => currencies.id, { onDelete: "restrict" }),
  amount: doublePrecision("amount").notNull(),
  period: text("period", { enum: ["month", "week", "day"] }).notNull(),
  startDate: text("start_date").notNull(),
});

export const savingsPlans = pgTable("savings_plans", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  currencyId: text("currency_id")
    .notNull()
    .references(() => currencies.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  targetAmount: doublePrecision("target_amount").notNull(),
  currentAmount: doublePrecision("current_amount").notNull().default(0),
  periodicity: text("periodicity", { enum: ["month", "week", "day"] }).notNull(),
  durationUnits: integer("duration_units").notNull(),
  startDate: text("start_date").notNull(),
});

/**
 * Partage d'espace : le membre voit/édite les données du propriétaire
 * (transactions, budgets, etc. restent clés par owner.userId).
 */
export const spaceShares = pgTable(
  "space_shares",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    memberUserId: text("member_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["editor"] }).notNull().default("editor"),
    status: text("status", { enum: ["pending", "accepted"] })
      .notNull()
      .default("pending"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [unique("space_shares_owner_member_unique").on(t.ownerUserId, t.memberUserId)]
);

/** Dépenses prévisionnelles à cocher sous un budget (simulation d'écarts). */
export const budgetPlannedItems = pgTable("budget_planned_items", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  budgetId: text("budget_id")
    .notNull()
    .references(() => budgets.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  amount: doublePrecision("amount").notNull(),
  checked: boolean("checked").notNull().default(false),
});

export type User = typeof users.$inferSelect;
export type Currency = typeof currencies.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type SavingsPlan = typeof savingsPlans.$inferSelect;
export type BudgetPlannedItem = typeof budgetPlannedItems.$inferSelect;
export type SpaceShare = typeof spaceShares.$inferSelect;
