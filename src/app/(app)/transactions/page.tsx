import { requireUser } from "@/lib/session";
import {
  getUserCategories,
  getUserCurrencies,
  getUserTransactions,
} from "@/lib/queries";
import { TransactionsClient } from "@/components/transactions/transactions-client";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; categoryId?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const all = getUserTransactions(user.id);
  const type =
    params.type === "income" || params.type === "expense"
      ? params.type
      : undefined;
  const categoryId = params.categoryId || undefined;
  const filtered = all.filter((t) => {
    if (type && t.type !== type) return false;
    if (categoryId && t.categoryId !== categoryId) return false;
    return true;
  });

  const categories = getUserCategories(user.id);
  const currencies = getUserCurrencies(user.id);

  return (
    <TransactionsClient
      transactions={filtered}
      categories={categories}
      currencies={currencies}
      filters={{ type, categoryId }}
    />
  );
}
