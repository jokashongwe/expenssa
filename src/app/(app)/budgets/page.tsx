import { requireUser } from "@/lib/session";
import {
  getBudgetDetails,
  getUserCategories,
  getUserCurrencies,
} from "@/lib/queries";
import { BudgetsClient } from "@/components/budgets/budgets-client";

export default async function BudgetsPage() {
  const user = await requireUser();
  const budgets = await getBudgetDetails(user.id);
  const categories = (await getUserCategories(user.id)).filter(
    (c) => c.type === "expense"
  );
  const currencies = await getUserCurrencies(user.id);
  return (
    <BudgetsClient
      budgets={budgets}
      categories={categories}
      currencies={currencies}
    />
  );
}
