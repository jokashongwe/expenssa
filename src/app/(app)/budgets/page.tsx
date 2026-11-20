import {
  getBudgetDetails,
  getIncomeOverview,
  getUserCategories,
  getUserCurrencies,
} from "@/lib/queries";
import { getSpaceContext } from "@/lib/space";
import { BudgetsClient } from "@/components/budgets/budgets-client";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const space = await getSpaceContext();
  const params = await searchParams;
  const budgets = await getBudgetDetails(space.ownerId);
  const categories = (await getUserCategories(space.ownerId)).filter(
    (c) => c.type === "expense"
  );
  const currencies = await getUserCurrencies(space.ownerId);
  // Optionnel : sert au récapitulatif (part des revenus) ; ne bloque pas la page
  const overview = await getIncomeOverview(space.ownerId).catch(() => null);
  const income =
    overview && overview.analysis.monthlyIncome > 0
      ? { amount: overview.analysis.monthlyIncome, code: overview.display.code }
      : null;
  return (
    <BudgetsClient
      budgets={budgets}
      categories={categories}
      currencies={currencies}
      income={income}
      openNew={params.new === "1"}
    />
  );
}
