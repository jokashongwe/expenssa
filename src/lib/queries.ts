import { and, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  budgetPlannedItems,
  budgets,
  categories,
  currencies,
  incomeSources,
  savingsPlans,
  transactions,
  users,
} from "@/lib/db/schema";
import { periodRange, type Period } from "@/lib/dates";
import { analyzeBudgetHealth, toMonthly, type Frequency } from "@/lib/income";
import { suggestedContribution, toDisplayAmount } from "@/lib/money";

/**
 * Tolérance avant migration : si la colonne budgets.title n'existe pas encore,
 * on relance la requête avec NULL à la place (re-teste après 30 s).
 */
let titleMissingSince = 0;
async function withBudgetTitle<T>(
  build: (title: typeof budgets.title) => Promise<T>
): Promise<T> {
  if (Date.now() - titleMissingSince > 30_000) {
    try {
      return await build(budgets.title);
    } catch (error) {
      const msg =
        error instanceof Error ? `${error.message} ${String(error.cause ?? "")}` : "";
      if (!(/title/.test(msg) && /(does not exist|42703)/i.test(msg))) throw error;
      titleMissingSince = Date.now();
    }
  }
  return build(sql`NULL::text`.as("title") as unknown as typeof budgets.title);
}

export async function getUserRecord(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user!;
}

export async function getUserCurrencies(userId: string) {
  return db.select().from(currencies).where(eq(currencies.userId, userId));
}

export async function getDisplayCurrency(userId: string) {
  const user = await getUserRecord(userId);
  let list = await getUserCurrencies(userId);
 
  // Répare les comptes créés sans seed devise/catégories
  if (list.length === 0 && user) {
    try {
      const { seedUserDefaults } = await import("@/lib/seed");
      await seedUserDefaults(userId);
      list = await getUserCurrencies(userId);
    } catch {
      // ignore — getUserRecord / requireUser gèrent les sessions orphelines
    }
  }

  return (
    list.find((c) => c.code === user.defaultCurrencyCode) ??
    list.find((c) => c.isDefault) ??
    list[0]!
  );
}

export async function getUserCategories(userId: string) {
  return db.select().from(categories).where(eq(categories.userId, userId));
}

export async function getUserTransactions(userId: string) {
  const rows = await db
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
    .where(eq(transactions.userId, userId));

  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

export type TransactionSort = "date_desc" | "date_asc" | "amount_desc";

export type TransactionFilters = {
  type?: "income" | "expense";
  categoryId?: string;
  /** Mois au format AAAA-MM */
  month?: string;
  q?: string;
  sort?: TransactionSort;
  limit?: number;
};

/** Transactions filtrées en SQL, triées et tronquées (« voir plus » via limit). */
export async function getTransactionsPage(
  userId: string,
  f: TransactionFilters
) {
  const conditions = [eq(transactions.userId, userId)];
  if (f.type) conditions.push(eq(transactions.type, f.type));
  if (f.categoryId) conditions.push(eq(transactions.categoryId, f.categoryId));
  if (f.month && /^\d{4}-\d{2}$/.test(f.month)) {
    conditions.push(gte(transactions.date, `${f.month}-01`));
    conditions.push(lte(transactions.date, `${f.month}-31`));
  }
  const q = f.q?.trim().slice(0, 100);
  if (q) {
    const pattern = `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
    conditions.push(
      or(ilike(transactions.note, pattern), ilike(categories.name, pattern))!
    );
  }

  const rows = await db
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
    .where(and(...conditions));

  const sort = f.sort ?? "date_desc";
  const usd = (r: (typeof rows)[number]) =>
    r.rateToUsd > 0 ? r.amount / r.rateToUsd : r.amount;
  rows.sort((a, b) =>
    sort === "date_asc"
      ? a.date.localeCompare(b.date)
      : sort === "amount_desc"
        ? usd(b) - usd(a)
        : b.date.localeCompare(a.date)
  );

  const limit = Math.min(Math.max(f.limit ?? 30, 1), 500);
  return {
    rows: rows.slice(0, limit),
    total: rows.length,
    hasMore: rows.length > limit,
  };
}

/** Mois de référence (AAAA-MM) → date au 1er du mois ; mois courant par défaut. */
export function parseMonthParam(value?: string): Date {
  if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return new Date(`${value}-01T00:00:00`);
  }
  return new Date();
}

export async function getDashboardStats(userId: string, reference = new Date()) {
  const display = await getDisplayCurrency(userId);
  const month = periodRange("month", reference);
  const prevRef = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  const prevMonth = periodRange("month", prevRef);
  const txs = await getUserTransactions(userId);

  let income = 0;
  let expense = 0;
  const byCategory: Record<
    string,
    { name: string; color: string; total: number }
  > = {};

  for (const tx of txs) {
    const converted = toDisplayAmount(
      tx.amount,
      { rateToUsd: tx.rateToUsd },
      display
    );
    if (tx.date <= month.end) {
      if (tx.type === "income") income += converted;
      else expense += converted;
    }

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
  let prevIncome = 0;
  let prevExpense = 0;
  for (const tx of txs) {
    if (tx.date < prevMonth.start || tx.date > prevMonth.end) continue;
    const converted = toDisplayAmount(
      tx.amount,
      { rateToUsd: tx.rateToUsd },
      display
    );
    if (tx.type === "income") prevIncome += converted;
    else prevExpense += converted;
  }

  // Tendance : 6 derniers mois jusqu'au mois sélectionné
  const trend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(reference.getFullYear(), reference.getMonth() - (5 - i), 1);
    const r = periodRange("month", d);
    let inc = 0;
    let exp = 0;
    for (const tx of txs) {
      if (tx.date < r.start || tx.date > r.end) continue;
      const c = toDisplayAmount(tx.amount, { rateToUsd: tx.rateToUsd }, display);
      if (tx.type === "income") inc += c;
      else exp += c;
    }
    return { month: r.start.slice(0, 7), income: inc, expense: exp };
  });

  for (const tx of monthTxs) {
    const converted = toDisplayAmount(
      tx.amount,
      { rateToUsd: tx.rateToUsd },
      display
    );
    if (tx.type === "income") monthIncome += converted;
    else monthExpense += converted;
  }

  const budgetRows = await withBudgetTitle((title) =>
    db
    .select({
      id: budgets.id,
      title,
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
  );

  const budgetProgress = budgetRows.map((b) => {
    const range = periodRange(b.period as Period, reference);
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
      label: b.title?.trim() || b.categoryName,
      spent,
      limit,
      percent: limit > 0 ? Math.min(100, (spent / limit) * 100) : 0,
      rawPercent: limit > 0 ? (spent / limit) * 100 : 0,
      over: spent > limit,
    };
  });

  const plans = await db
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
    .where(eq(savingsPlans.userId, userId));

  return {
    display,
    balance: income - expense,
    monthIncome,
    monthExpense,
    prevIncome,
    prevExpense,
    trend,
    topCategories: Object.values(byCategory)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6),
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

export async function getBudgetDetails(userId: string) {
  const display = await getDisplayCurrency(userId);
  const txs = await getUserTransactions(userId);
  const rows = await withBudgetTitle((title) =>
    db
    .select({
      id: budgets.id,
      title,
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
  );

  const planned = await db
    .select()
    .from(budgetPlannedItems)
    .where(eq(budgetPlannedItems.userId, userId));

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

    const items = planned
      .filter((p) => p.budgetId === b.id)
      .map((p) => ({
        id: p.id,
        label: p.label,
        amount: p.amount,
        checked: p.checked,
      }));

    const plannedChecked = items
      .filter((i) => i.checked)
      .reduce((sum, i) => sum + i.amount, 0);
    const remaining = b.amount - spentNative;
    const projected = spentNative + plannedChecked;
    const gap = b.amount - projected;

    return {
      ...b,
      label: b.title?.trim() || b.categoryName,
      spent: spentNative,
      percent: b.amount > 0 ? Math.min(100, (spentNative / b.amount) * 100) : 0,
      over: spentNative > b.amount,
      displayCode: display.code,
      plannedItems: items,
      plannedChecked,
      remaining,
      projected,
      gap,
      fitsWithPlanned: gap >= 0,
    };
  });
}

export async function getSavingsDetails(userId: string) {
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
      rateToUsd: currencies.rateToUsd,
    })
    .from(savingsPlans)
    .innerJoin(currencies, eq(savingsPlans.currencyId, currencies.id))
    .where(eq(savingsPlans.userId, userId));
}

export async function filterTransactionsInRange(
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
    );
}

export async function getIncomeSources(userId: string) {
  return db
    .select({
      id: incomeSources.id,
      name: incomeSources.name,
      amount: incomeSources.amount,
      frequency: incomeSources.frequency,
      currencyId: incomeSources.currencyId,
      currencyCode: currencies.code,
      rateToUsd: currencies.rateToUsd,
    })
    .from(incomeSources)
    .innerJoin(currencies, eq(incomeSources.currencyId, currencies.id))
    .where(eq(incomeSources.userId, userId));
}

/** Revenus déclarés vs budgets : tout ramené au mois, en devise d'affichage. */
export async function getIncomeOverview(userId: string) {
  const display = await getDisplayCurrency(userId);
  const [sources, budgetList, plans, txs] = await Promise.all([
    getIncomeSources(userId),
    getBudgetDetails(userId),
    getSavingsDetails(userId),
    getUserTransactions(userId),
  ]);
  const conv = (amount: number, rateToUsd: number) =>
    toDisplayAmount(amount, { rateToUsd }, display);

  const sourcesView = sources.map((s) => {
    const native = toMonthly(s.amount, s.frequency as Frequency);
    return {
      ...s,
      monthlyNative: native,
      monthlyDisplay: conv(native, s.rateToUsd),
    };
  });
  const monthlyIncome = sourcesView.reduce((sum, s) => sum + s.monthlyDisplay, 0);

  const budgetLines = budgetList.map((b) => ({
    id: b.id,
    name: b.label,
    monthly: conv(toMonthly(b.amount, b.period as Frequency), b.rateToUsd),
    spent: conv(b.spent, b.rateToUsd),
    limit: conv(b.amount, b.rateToUsd),
  }));

  // Épargne : contribution périodique des plans non terminés, ramenée au mois
  const savingsMonthly = plans
    .filter((p) => p.currentAmount < p.targetAmount)
    .reduce((sum, p) => {
      const perPeriod = suggestedContribution(p.targetAmount, p.durationUnits);
      return sum + conv(toMonthly(perPeriod, p.periodicity as Frequency), p.rateToUsd);
    }, 0);

  const month = periodRange("month");
  const monthExpense = txs
    .filter((t) => t.type === "expense" && t.date >= month.start && t.date <= month.end)
    .reduce((sum, t) => sum + conv(t.amount, t.rateToUsd), 0);

  const analysis = analyzeBudgetHealth({
    monthlyIncome,
    budgets: budgetLines,
    savingsMonthly,
    monthExpense,
  });

  return { display, sources: sourcesView, analysis };

}
