import { IncomeClient } from "@/components/income/income-client";
import { getIncomeOverview, getUserCurrencies } from "@/lib/queries";
import { getSpaceContext } from "@/lib/space";

function isMissingTable(error: unknown) {
  const msg = error instanceof Error ? `${error.message} ${String(error.cause ?? "")}` : "";
  return /income_sources/.test(msg) && /(does not exist|n'existe pas|42P01)/i.test(msg);
}

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const space = await getSpaceContext();
  const params = await searchParams;
  const currencies = await getUserCurrencies(space.ownerId);

  let overview;
  try {
    overview = await getIncomeOverview(space.ownerId);
  } catch (error) {
    if (isMissingTable(error)) {
      return (
        <div className="mx-auto max-w-lg space-y-3 py-12">
          <h1 className="text-2xl font-medium">Mes revenus</h1>
          <p className="text-sm text-muted-foreground">
            La table <code>income_sources</code> n&apos;existe pas encore dans
            la base de données. Exécutez la migration puis rechargez la page :
          </p>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
            node --env-file=.env scripts/migrate-income-sources.mjs
          </pre>
        </div>
      );
    }
    throw error;
  }

  return (
    <IncomeClient
      sources={overview.sources}
      analysis={overview.analysis}
      currencies={currencies}
      displayCode={overview.display.code}
      openNew={params.new === "1"}
    />
  );
}
