import { requireUser } from "@/lib/session";
import { getSavingsDetails, getUserCurrencies } from "@/lib/queries";
import { SavingsClient } from "@/components/savings/savings-client";

export default async function SavingsPage() {
  const user = await requireUser();
  const plans = getSavingsDetails(user.id);
  const currencies = getUserCurrencies(user.id);
  return <SavingsClient plans={plans} currencies={currencies} />;
}
