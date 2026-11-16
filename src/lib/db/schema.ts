import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  defaultCurrencyCode: text("default_currency_code").notNull().default("USD"),
  createdAt: text("created_at").notNull(),
});

export const currencies = sqliteTable("currencies", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  /** How many USD one unit of this currency equals (USD = 1). */
  rateToUsd: real("rate_to_usd").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  color: text("color").notNull().default("#0d9488"),
  icon: text("icon").notNull().default("circle"),
});

export const transactions = sqliteTable("transactions", {
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
  amount: real("amount").notNull(),
  note: text("note"),
  date: text("date").notNull(),
  createdAt: text("created_at").notNull(),
});

export const budgets = sqliteTable("budgets", {
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
  amount: real("amount").notNull(),
  period: text("period", { enum: ["month", "week", "day"] }).notNull(),
  startDate: text("start_date").notNull(),
});

export const savingsPlans = sqliteTable("savings_plans", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  currencyId: text("currency_id")
    .notNull()
    .references(() => currencies.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").notNull().default(0),
  periodicity: text("periodicity", { enum: ["month", "week", "day"] }).notNull(),
  durationUnits: integer("duration_units").notNull(),
  startDate: text("start_date").notNull(),
});

export type User = typeof users.$inferSelect;
export type Currency = typeof currencies.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type SavingsPlan = typeof savingsPlans.$inferSelect;
