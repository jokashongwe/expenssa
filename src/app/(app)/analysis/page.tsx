import { BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Delta } from "@/components/dashboard/delta";
import {
  ExpenseChart,
  TrendChart,
} from "@/components/dashboard/expense-chart";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { formatMoney } from "@/lib/money";
import { getDashboardStats, parseMonthParam } from "@/lib/queries";
import { getSpaceContext } from "@/lib/space";

export const metadata = { title: "Analyse" };

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const space = await getSpaceContext();
  const { month: monthParam } = await searchParams;
  const reference = parseMonthParam(monthParam);
  const month = format(reference, "yyyy-MM");
  const currentMonth = format(new Date(), "yyyy-MM");
  const monthLabel = format(reference, "MMMM yyyy", { locale: fr });
  const monthShort = format(reference, "MMMM", { locale: fr });
  const stats = await getDashboardStats(space.ownerId, reference);
  const code = stats.display.code;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-3xl font-medium tracking-tight">
            Analyse
          </h1>
          <p className="text-sm text-muted-foreground">
            Le détail de vos revenus et dépenses, en {code}
          </p>
        </div>
        <MonthPicker
          month={month}
          currentMonth={currentMonth}
          label={monthLabel}
          basePath="/analysis"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenus de {monthShort}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium tabular-nums text-income">
              {formatMoney(stats.monthIncome, code)}
            </p>
            <Delta
              current={stats.monthIncome}
              previous={stats.prevIncome}
              goodWhenUp
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dépenses de {monthShort}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium tabular-nums text-expense">
              {formatMoney(stats.monthExpense, code)}
            </p>
            <Delta
              current={stats.monthExpense}
              previous={stats.prevExpense}
              goodWhenUp={false}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenus et dépenses sur 6 mois</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={stats.trend} currencyCode={code} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dépenses par catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topCategories.length === 0 ? (
            <EmptyState
              bordered={false}
              icon={BarChart3}
              title={`Aucune dépense en ${monthShort}`}
              description="Vos dépenses par catégorie apparaîtront ici."
              actionLabel="Ajouter une dépense"
              actionHref="/transactions?new=expense"
            />
          ) : (
            <ExpenseChart data={stats.topCategories} currencyCode={code} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
