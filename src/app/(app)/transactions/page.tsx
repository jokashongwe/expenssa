import {
  getUserCategories,
  getUserCurrencies,
  getUserTransactions,
} from "@/lib/queries";
import { getSpaceContext } from "@/lib/space";
import { TransactionsClient } from "@/components/transactions/transactions-client";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; categoryId?: string }>;
}) {
  const space = await getSpaceContext();
  const params = await searchParams;
  const all = await getUserTransactions(space.ownerId);
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

  const categories = await getUserCategories(space.ownerId);
  const currencies = await getUserCurrencies(space.ownerId);

  return (
    <TransactionsClient
      transactions={filtered}
      categories={categories}
      currencies={currencies}
      filters={{ type, categoryId }}
    />
  );
}
