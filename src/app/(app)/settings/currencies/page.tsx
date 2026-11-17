import {
  getDisplayCurrency,
  getUserCurrencies,
  getUserRecord,
} from "@/lib/queries";
import { getSpaceContext } from "@/lib/space";
import { CurrenciesClient } from "@/components/currencies/currencies-client";

export default async function CurrenciesPage() {
  const space = await getSpaceContext();
  const currencies = await getUserCurrencies(space.ownerId);
  const record = await getUserRecord(space.ownerId);
  const display = await getDisplayCurrency(space.ownerId);
  return (
    <CurrenciesClient
      currencies={currencies}
      displayCode={display?.code ?? "USD"}
      defaultCode={record.defaultCurrencyCode}
    />
  );
}
