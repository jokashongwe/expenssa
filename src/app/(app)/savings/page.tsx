import {
  getIncomeOverview,
  getSavingsDetails,
  getUserCurrencies,
} from "@/lib/queries";
import { getSpaceContext } from "@/lib/space";
import { SavingsClient } from "@/components/savings/savings-client";

export default async function SavingsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const space = await getSpaceContext();
  const params = await searchParams;
  const plans = await getSavingsDetails(space.ownerId);
  const currencies = await getUserCurrencies(space.ownerId);
  // Optionnel : sert au récapitulatif (part des revenus) ; ne bloque pas la page
  const overview = await getIncomeOverview(space.ownerId).catch(() => null);
  const income =
    overview && overview.analysis.monthlyIncome > 0
      ? { amount: overview.analysis.monthlyIncome, code: overview.display.code }
      : null;
  return (
    <SavingsClient
      plans={plans}
      currencies={currencies}
      income={income}
      openNew={params.new === "1"}
    />
  );
}
