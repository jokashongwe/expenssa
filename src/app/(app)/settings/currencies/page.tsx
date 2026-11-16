import { requireUser } from "@/lib/session";
import { getDisplayCurrency, getUserCurrencies, getUserRecord } from "@/lib/queries";
import { CurrenciesClient } from "@/components/currencies/currencies-client";

export default async function CurrenciesPage() {
  const user = await requireUser();
  const currencies = await getUserCurrencies(user.id);
  const record = await getUserRecord(user.id);
  const display = await getDisplayCurrency(user.id);
  return (
    <CurrenciesClient
      currencies={currencies}
      displayCode={display?.code ?? "USD"}
      defaultCode={record.defaultCurrencyCode}
    />
  );
}
