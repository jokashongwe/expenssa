import { requireUser } from "@/lib/session";
import { getDisplayCurrency, getUserCurrencies, getUserRecord } from "@/lib/queries";
import { CurrenciesClient } from "@/components/currencies/currencies-client";

export default async function CurrenciesPage() {
  const user = await requireUser();
  const currencies = getUserCurrencies(user.id);
  const record = getUserRecord(user.id);
  const display = getDisplayCurrency(user.id);
  return (
    <CurrenciesClient
      currencies={currencies}
      displayCode={display?.code ?? "USD"}
      defaultCode={record.defaultCurrencyCode}
    />
  );
}
