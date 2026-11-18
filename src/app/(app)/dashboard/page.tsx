import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { BarChart3, PiggyBank, Receipt, Wallet } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ExpenseChart, TrendChart } from "@/components/dashboard/expense-chart";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { Delta } from "@/components/dashboard/delta";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatDateFr } from "@/lib/dates";
import { formatMoney, periodLabel } from "@/lib/money";
import { getDashboardStats, parseMonthParam } from "@/lib/queries";
import { getSpaceContext } from "@/lib/space";

export default async function DashboardPage({
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
  const greetName = space.isOwnSpace
    ? space.user.name.split(" ")[0]
    : space.ownerName.split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-3xl font-medium tracking-tight">
            Bonjour, {greetName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Vue d&apos;ensemble en {code}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthPicker
            month={month}
            currentMonth={currentMonth}
            label={monthLabel}
          />
          <Button render={<Link href="/transactions?new=1" />}>
            Nouvelle transaction
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-tint-border bg-gradient-to-br from-tint to-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solde cumulé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium tabular-nums">
              {formatMoney(stats.balance, code)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Revenus − dépenses, du début jusqu&apos;à fin {monthShort}
            </p>
          </CardContent>
        </Card>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dépenses par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topCategories.length === 0 ? (
              <EmptyState bordered={false} icon={BarChart3} title={`Aucune dépense en ${monthShort}`} description="Vos dépenses par catégorie apparaîtront ici." actionLabel="Ajouter une dépense" actionHref="/transactions" />
            ) : (
              <ExpenseChart data={stats.topCategories} currencyCode={code} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Budgets</CardTitle>
            <Button render={<Link href="/budgets" />} variant="ghost" size="sm">
              Voir tout
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.budgetProgress.length === 0 ? (
              <EmptyState bordered={false} icon={Wallet} title="Aucun budget défini" actionLabel="Créer un budget" actionHref="/budgets" />
            ) : (
              stats.budgetProgress.slice(0, 4).map((b) => (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{b.categoryName}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatMoney(b.spent, code)} / {formatMoney(b.limit, code)}
                    </span>
                  </div>
                  <Progress
                    value={b.percent}
                    aria-label={`Budget ${b.categoryName} utilisé à ${Math.round(b.rawPercent)} %`}
                    indicatorClassName={
                      b.over
                        ? "bg-destructive"
                        : b.rawPercent >= 80
                          ? "bg-amber-500"
                          : undefined
                    }
                  />
                  {b.over ? (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="size-3" aria-hidden />
                      Budget dépassé : {Math.round(b.rawPercent)} % (
                      {periodLabel(b.period as "month" | "week" | "day")})
                    </p>
                  ) : b.rawPercent >= 80 ? (
                    <p className="flex items-center gap-1 text-xs text-warning-foreground">
                      <AlertTriangle className="size-3" aria-hidden />
                      Proche de la limite : {Math.round(b.rawPercent)} %
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Épargne</CardTitle>
            <Button render={<Link href="/savings" />} variant="ghost" size="sm">
              Voir tout
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.plans.length === 0 ? (
              <EmptyState bordered={false} icon={PiggyBank} title="Aucun plan d'épargne" actionLabel="Créer un plan" actionHref="/savings" />
            ) : (
              stats.plans.slice(0, 3).map((p) => (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {Math.round(p.percent)}%
                    </span>
                  </div>
                  <Progress value={p.percent} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Récentes</CardTitle>
            <Button
              render={<Link href="/transactions" />}
              variant="ghost"
              size="sm"
            >
              Tout voir
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recent.length === 0 ? (
              <EmptyState bordered={false} icon={Receipt} title="Aucune transaction pour l'instant" actionLabel="Ajouter une transaction" actionHref="/transactions" />
            ) : (
              stats.recent.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{tx.categoryName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateFr(tx.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={tx.type === "income" ? "secondary" : "outline"}
                    >
                      {tx.type === "income" ? "Revenu" : "Dépense"}
                    </Badge>
                    <span
                      className={`tabular-nums font-medium ${
                        tx.type === "income"
                          ? "text-income"
                          : "text-expense"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatMoney(tx.amount, tx.currencyCode)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
