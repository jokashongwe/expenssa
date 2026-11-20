import {
  getTransactionsPage,
  getUserCategories,
  getUserCurrencies,
  type TransactionSort,
} from "@/lib/queries";
import { getSpaceContext } from "@/lib/space";
import { TransactionsClient } from "@/components/transactions/transactions-client";

const PAGE_SIZE = 30;
const SORTS: TransactionSort[] = ["date_desc", "date_asc", "amount_desc"];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    categoryId?: string;
    month?: string;
    q?: string;
    sort?: string;
    limit?: string;
    new?: string;
  }>;
}) {
  const space = await getSpaceContext();
  const params = await searchParams;

  const type =
    params.type === "income" || params.type === "expense"
      ? params.type
      : undefined;
  const categoryId = params.categoryId || undefined;
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "")
    ? params.month
    : undefined;
  const q = params.q?.trim() || undefined;
  const sort = SORTS.includes(params.sort as TransactionSort)
    ? (params.sort as TransactionSort)
    : "date_desc";
  const limit = Math.max(Number(params.limit) || PAGE_SIZE, PAGE_SIZE);

  const [page, categories, currencies] = await Promise.all([
    getTransactionsPage(space.ownerId, {
      type,
      categoryId,
      month,
      q,
      sort,
      limit,
    }),
    getUserCategories(space.ownerId),
    getUserCurrencies(space.ownerId),
  ]);

  return (
    <TransactionsClient
      transactions={page.rows}
      total={page.total}
      hasMore={page.hasMore}
      pageSize={PAGE_SIZE}
      limit={limit}
      categories={categories}
      currencies={currencies}
      filters={{ type, categoryId, month, q, sort }}
      openNew={
        params.new === "1" || params.new === "income" || params.new === "expense"
      }
      newType={params.new === "income" ? "income" : "expense"}
    />
  );
}
