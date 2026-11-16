import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDateFr } from "@/lib/dates";
import { formatMoney, periodLabel } from "@/lib/money";
import { getDashboardStats } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { ExpenseChart } from "@/components/dashboard/expense-chart";

export default async function DashboardPage() {
  const user = await requireUser();
  const stats = await getDashboardStats(user.id);
  const code = stats.display.code;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-3xl font-medium tracking-tight">
            Bonjour, {user.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Vue d&apos;ensemble en {code}
          </p>
        </div>
        <Button render={<Link href="/transactions" />}>Nouvelle transaction</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-teal-200/60 bg-gradient-to-br from-teal-50 to-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solde net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium tabular-nums">
              {formatMoney(stats.balance, code)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenus du mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium tabular-nums text-emerald-700">
              {formatMoney(stats.monthIncome, code)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dépenses du mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium tabular-nums text-rose-700">
              {formatMoney(stats.monthExpense, code)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dépenses par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune dépense ce mois-ci.
              </p>
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
              <p className="text-sm text-muted-foreground">
                Aucun budget défini.{" "}
                <Link href="/budgets" className="underline">
                  En créer un
                </Link>
              </p>
            ) : (
              stats.budgetProgress.slice(0, 4).map((b) => (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{b.categoryName}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatMoney(b.spent, code)} / {formatMoney(b.limit, code)}
                    </span>
                  </div>
                  <Progress value={b.percent} />
                  {b.over && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="size-3" />
                      Budget dépassé ({periodLabel(b.period as "month" | "week" | "day")})
                    </p>
                  )}
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
              <p className="text-sm text-muted-foreground">
                Aucun plan d&apos;épargne.
              </p>
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
              <p className="text-sm text-muted-foreground">
                Aucune transaction pour l&apos;instant.
              </p>
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
                    <Badge variant={tx.type === "income" ? "secondary" : "outline"}>
                      {tx.type === "income" ? "Revenu" : "Dépense"}
                    </Badge>
                    <span
                      className={`tabular-nums font-medium ${
                        tx.type === "income" ? "text-emerald-700" : "text-rose-700"
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
