import { getSavingsDetails, getUserCurrencies } from "@/lib/queries";
import { getSpaceContext } from "@/lib/space";
import { SavingsClient } from "@/components/savings/savings-client";

export default async function SavingsPage() {
  const space = await getSpaceContext();
  const plans = await getSavingsDetails(space.ownerId);
  const currencies = await getUserCurrencies(space.ownerId);
  return <SavingsClient plans={plans} currencies={currencies} />;
}
