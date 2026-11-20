import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressRing, type RingTone } from "@/components/ui-kit/progress-ring";
import { StatusPill } from "@/components/ui-kit/status-pill";
import { LEVEL_COPY, type HealthAnalysis, type HealthLevel } from "@/lib/income";
import { formatMoney } from "@/lib/money";

const LEVEL_TONE: Record<HealthLevel, RingTone> = {
  none: "neutral",
  ok: "good",
  watch: "watch",
  tight: "watch",
  deficit: "over",
};

/** Carte « Mon mois » : une seule vue de progression, en langage simple. */
export function MonthCard({
  monthLabel,
  income,
  expense,
  code,
  analysis,
  analysisCode,
}: {
  monthLabel: string;
  income: number;
  expense: number;
  code: string;
  analysis: HealthAnalysis | null;
  analysisCode: string;
}) {
  const money = (v: number) => formatMoney(v, code);
  const remaining = income - expense;
  const spentPct = income > 0 ? (expense / income) * 100 : expense > 0 ? 100 : 0;
  const tone: RingTone =
    spentPct > 100 ? "over" : spentPct >= 80 ? "watch" : "good";

  let headline: string;
  if (income === 0 && expense === 0) {
    headline = `Aucune opération en ${monthLabel} pour l'instant.`;
  } else if (remaining >= 0) {
    headline = `Il vous reste ${money(remaining)} ce mois-ci.`;
  } else {
    headline = `Vous avez dépensé ${money(-remaining)} de plus que vos revenus.`;
  }

  let healthDetail = "";
  if (analysis) {
    const m = (v: number) => formatMoney(v, analysisCode);
    if (analysis.level === "none") {
      healthDetail = "Ajoutez vos revenus pour savoir si vos budgets sont tenables.";
    } else if (analysis.cutNeeded > 0) {
      healthDetail = `Réduisez vos dépenses d'environ ${m(analysis.cutNeeded)} par mois.`;
    } else if (analysis.remaining > 0) {
      healthDetail = `${m(analysis.remaining)} de marge par mois après vos budgets.`;
    } else {
      healthDetail = LEVEL_COPY[analysis.level].message;
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <ProgressRing
            value={spentPct}
            tone={tone}
            size={112}
            stroke={11}
            label={`${Math.round(spentPct)} % de vos revenus de ${monthLabel} déjà dépensés`}
          >
            <div>
              <p className="text-2xl font-medium tabular-nums leading-none">
                {Math.round(spentPct)}%
              </p>
              <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                dépensé
              </p>
            </div>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium leading-snug">{headline}</p>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Revenus</dt>
                <dd className="tabular-nums font-medium text-income">
                  {money(income)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Dépensé</dt>
                <dd className="tabular-nums font-medium text-expense">
                  {money(expense)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {analysis ? (
          <Link
            href="/income"
            className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <StatusPill tone={LEVEL_TONE[analysis.level]}>
                Santé budgétaire : {LEVEL_COPY[analysis.level].label}
              </StatusPill>
              <p className="text-sm text-muted-foreground">{healthDetail}</p>
            </div>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
