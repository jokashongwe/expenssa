import {
  getBudgetDetails,
  getUserCategories,
  getUserCurrencies,
} from "@/lib/queries";
import { getSpaceContext } from "@/lib/space";
import { BudgetsClient } from "@/components/budgets/budgets-client";

export default async function BudgetsPage() {
  const space = await getSpaceContext();
  const budgets = await getBudgetDetails(space.ownerId);
  const categories = (await getUserCategories(space.ownerId)).filter(
    (c) => c.type === "expense"
  );
  const currencies = await getUserCurrencies(space.ownerId);
  return (
    <BudgetsClient
      budgets={budgets}
      categories={categories}
      currencies={currencies}
    />
  );
}
