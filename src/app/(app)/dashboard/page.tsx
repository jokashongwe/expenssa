import Link from "next/link";
import { ArrowRight, PiggyBank, Receipt, Wallet } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MonthCard } from "@/components/dashboard/month-card";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { StatusPill, budgetStatus } from "@/components/ui-kit/status-pill";
import { formatDateFr } from "@/lib/dates";
import { formatMoney, periodLabel } from "@/lib/money";
import {
  getDashboardStats,
  getIncomeOverview,
  parseMonthParam,
} from "@/lib/queries";
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
  // Optionnel : ne casse pas l'accueil si la table income_sources n'est pas migrée
  const overview = await getIncomeOverview(space.ownerId).catch(() => null);
  const code = stats.display.code;
  const greetName = space.isOwnSpace
    ? space.user.name.split(" ")[0]
    : space.ownerName.split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="font-sans text-3xl font-medium tracking-tight">
            Bonjour, {greetName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {space.isOwnSpace
              ? "Chaque effort compte : un budget tenu, c'est un projet qui se rapproche."
              : "Gérez vos finances à deux, chacun avec les mêmes informations."}
          </p>
        </div>
        <MonthPicker
          month={month}
          currentMonth={currentMonth}
          label={monthLabel}
        />
      </div>

      <MonthCard
        monthLabel={monthShort}
        income={stats.monthIncome}
        expense={stats.monthExpense}
        code={code}
        analysis={overview?.analysis ?? null}
        analysisCode={overview?.display.code ?? code}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mes budgets</CardTitle>
          <Button render={<Link href="/budgets" />} variant="ghost" size="sm">
            Tout voir
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {stats.budgetProgress.length === 0 ? (
            <EmptyState
              bordered={false}
              icon={Wallet}
              title="Aucun budget défini"
              description="Fixez une limite par catégorie pour garder la main sur vos dépenses."
              actionLabel="Créer un budget"
              actionHref="/budgets?new=1"
            />
          ) : (
            stats.budgetProgress.slice(0, 4).map((b) => {
              const status = budgetStatus(b.rawPercent);
              return (
                <div key={b.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{b.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {periodLabel(b.period as "month" | "week" | "day")} ·{" "}
                        {formatMoney(b.spent, code)} sur{" "}
                        {formatMoney(b.limit, code)}
                      </p>
                    </div>
                    <StatusPill tone={status.tone}>{status.label}</StatusPill>
                  </div>
                  <Progress
                    value={b.percent}
                    aria-label={`Budget ${b.label} utilisé à ${Math.round(b.rawPercent)} %`}
                    indicatorClassName={
                      status.tone === "over"
                        ? "bg-destructive"
                        : status.tone === "watch"
                          ? "bg-amber-500"
                          : undefined
                    }
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mes objectifs d&apos;épargne</CardTitle>
          <Button render={<Link href="/savings" />} variant="ghost" size="sm">
            Tout voir
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {stats.plans.length === 0 ? (
            <EmptyState
              bordered={false}
              icon={PiggyBank}
              title="Aucun objectif d'épargne"
              description="Un projet en tête ? Nous calculons combien mettre de côté."
              actionLabel="Créer un objectif"
              actionHref="/savings?new=1"
            />
          ) : (
            stats.plans.slice(0, 3).map((p) => (
              <div key={p.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(p.currentDisplay, code)} sur{" "}
                      {formatMoney(p.targetDisplay, code)}
                    </p>
                  </div>
                  {p.percent >= 100 ? (
                    <StatusPill tone="good">Atteint</StatusPill>
                  ) : (
                    <span className="text-sm font-medium tabular-nums">
                      {Math.round(p.percent)}%
                    </span>
                  )}
                </div>
                <Progress
                  value={p.percent}
                  aria-label={`Objectif ${p.name} atteint à ${Math.round(p.percent)} %`}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activité récente</CardTitle>
          <Button
            render={<Link href="/transactions" />}
            variant="ghost"
            size="sm"
          >
            Tout voir
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.recent.length === 0 ? (
            <EmptyState
              bordered={false}
              icon={Receipt}
              title="Aucune transaction pour l'instant"
              description="Notez une dépense ou un revenu pour démarrer."
              actionLabel="Ajouter une dépense"
              actionHref="/transactions?new=expense"
            />
          ) : (
            stats.recent.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{tx.categoryName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateFr(tx.date)}
                    {tx.note ? ` · ${tx.note}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-medium tabular-nums ${
                    tx.type === "income" ? "text-income" : "text-expense"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatMoney(tx.amount, tx.currencyCode)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Link
        href={`/analysis${month === currentMonth ? "" : `?month=${month}`}`}
        className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        Voir l&apos;analyse détaillée
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
