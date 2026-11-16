import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  budgets,
  categories,
  currencies,
  savingsPlans,
  transactions,
  users,
} from "@/lib/db/schema";
import { periodRange, type Period } from "@/lib/dates";
import { toDisplayAmount } from "@/lib/money";

export function getUserRecord(userId: string) {
  return db.select().from(users).where(eq(users.id, userId)).get()!;
}

export function getUserCurrencies(userId: string) {
  return db
    .select()
    .from(currencies)
    .where(eq(currencies.userId, userId))
    .all();
}

export function getDisplayCurrency(userId: string) {
  const user = getUserRecord(userId);
  const list = getUserCurrencies(userId);
  return (
    list.find((c) => c.code === user.defaultCurrencyCode) ??
    list.find((c) => c.isDefault) ??
    list[0]
  );
}

export function getUserCategories(userId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .all();
}

export function getUserTransactions(userId: string) {
  return db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      note: transactions.note,
      date: transactions.date,
      categoryId: transactions.categoryId,
      currencyId: transactions.currencyId,
      categoryName: categories.name,
      categoryColor: categories.color,
      currencyCode: currencies.code,
      rateToUsd: currencies.rateToUsd,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .innerJoin(currencies, eq(transactions.currencyId, currencies.id))
    .where(eq(transactions.userId, userId))
    .all()
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getDashboardStats(userId: string) {
  const display = getDisplayCurrency(userId);
  const month = periodRange("month");
  const txs = getUserTransactions(userId);
  let income = 0;
  let expense = 0;
  const byCategory: Record<string, { name: string; color: string; total: number }> =
    {};

  for (const tx of txs) {
    const converted = toDisplayAmount(
      tx.amount,
      { rateToUsd: tx.rateToUsd },
      display
    );
    if (tx.type === "income") income += converted;
    else expense += converted;

    if (tx.type === "expense" && tx.date >= month.start && tx.date <= month.end) {
      if (!byCategory[tx.categoryId]) {
        byCategory[tx.categoryId] = {
          name: tx.categoryName,
          color: tx.categoryColor,
          total: 0,
        };
      }
      byCategory[tx.categoryId].total += converted;
    }
  }

  const monthTxs = txs.filter(
    (t) => t.date >= month.start && t.date <= month.end
  );
  let monthIncome = 0;
  let monthExpense = 0;
  for (const tx of monthTxs) {
    const converted = toDisplayAmount(
      tx.amount,
      { rateToUsd: tx.rateToUsd },
      display
    );
    if (tx.type === "income") monthIncome += converted;
    else monthExpense += converted;
  }

  const budgetRows = db
    .select({
      id: budgets.id,
      amount: budgets.amount,
      period: budgets.period,
      categoryId: budgets.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      currencyId: budgets.currencyId,
      rateToUsd: currencies.rateToUsd,
      currencyCode: currencies.code,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .innerJoin(currencies, eq(budgets.currencyId, currencies.id))
    .where(eq(budgets.userId, userId))
    .all();

  const budgetProgress = budgetRows.map((b) => {
    const range = periodRange(b.period as Period);
    const spent = txs
      .filter(
        (t) =>
          t.type === "expense" &&
          t.categoryId === b.categoryId &&
          t.date >= range.start &&
          t.date <= range.end
      )
      .reduce(
        (sum, t) =>
          sum +
          toDisplayAmount(t.amount, { rateToUsd: t.rateToUsd }, display),
        0
      );
    const limit = toDisplayAmount(
      b.amount,
      { rateToUsd: b.rateToUsd },
      display
    );
    return {
      ...b,
      spent,
      limit,
      percent: limit > 0 ? Math.min(100, (spent / limit) * 100) : 0,
      over: spent > limit,
    };
  });

  const plans = db
    .select({
      id: savingsPlans.id,
      name: savingsPlans.name,
      targetAmount: savingsPlans.targetAmount,
      currentAmount: savingsPlans.currentAmount,
      periodicity: savingsPlans.periodicity,
      durationUnits: savingsPlans.durationUnits,
      currencyCode: currencies.code,
      rateToUsd: currencies.rateToUsd,
    })
    .from(savingsPlans)
    .innerJoin(currencies, eq(savingsPlans.currencyId, currencies.id))
    .where(eq(savingsPlans.userId, userId))
    .all();

  return {
    display,
    balance: income - expense,
    monthIncome,
    monthExpense,
    topCategories: Object.values(byCategory)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
    budgetProgress,
    plans: plans.map((p) => ({
      ...p,
      targetDisplay: toDisplayAmount(
        p.targetAmount,
        { rateToUsd: p.rateToUsd },
        display
      ),
      currentDisplay: toDisplayAmount(
        p.currentAmount,
        { rateToUsd: p.rateToUsd },
        display
      ),
      percent:
        p.targetAmount > 0
          ? Math.min(100, (p.currentAmount / p.targetAmount) * 100)
          : 0,
    })),
    recent: txs.slice(0, 8),
  };
}

export function getBudgetDetails(userId: string) {
  const display = getDisplayCurrency(userId);
  const txs = getUserTransactions(userId);
  const rows = db
    .select({
      id: budgets.id,
      amount: budgets.amount,
      period: budgets.period,
      startDate: budgets.startDate,
      categoryId: budgets.categoryId,
      currencyId: budgets.currencyId,
      categoryName: categories.name,
      categoryColor: categories.color,
      currencyCode: currencies.code,
      rateToUsd: currencies.rateToUsd,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .innerJoin(currencies, eq(budgets.currencyId, currencies.id))
    .where(eq(budgets.userId, userId))
    .all();

  return rows.map((b) => {
    const range = periodRange(b.period as Period);
    const spentNative = txs
      .filter(
        (t) =>
          t.type === "expense" &&
          t.categoryId === b.categoryId &&
          t.date >= range.start &&
          t.date <= range.end
      )
      .reduce(
        (sum, t) =>
          sum +
          toDisplayAmount(
            t.amount,
            { rateToUsd: t.rateToUsd },
            { rateToUsd: b.rateToUsd }
          ),
        0
      );
    return {
      ...b,
      spent: spentNative,
      percent: b.amount > 0 ? Math.min(100, (spentNative / b.amount) * 100) : 0,
      over: spentNative > b.amount,
      displayCode: display.code,
    };
  });
}

export function getSavingsDetails(userId: string) {
  return db
    .select({
      id: savingsPlans.id,
      name: savingsPlans.name,
      targetAmount: savingsPlans.targetAmount,
      currentAmount: savingsPlans.currentAmount,
      periodicity: savingsPlans.periodicity,
      durationUnits: savingsPlans.durationUnits,
      startDate: savingsPlans.startDate,
      currencyId: savingsPlans.currencyId,
      currencyCode: currencies.code,
    })
    .from(savingsPlans)
    .innerJoin(currencies, eq(savingsPlans.currencyId, currencies.id))
    .where(eq(savingsPlans.userId, userId))
    .all();
}

export function filterTransactionsInRange(
  userId: string,
  start: string,
  end: string
) {
  return db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, start),
        lte(transactions.date, end)
      )
    )
    .all();
}
