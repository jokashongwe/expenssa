import Link from "next/link";
import { AlertTriangle, CheckCircle2, Eye, HandCoins, OctagonAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEVEL_COPY, type HealthAnalysis, type HealthLevel } from "@/lib/income";
import { formatMoney } from "@/lib/money";

const STYLE: Record<HealthLevel, { box: string; icon: typeof Eye }> = {
  none: { box: "border-border bg-muted/50", icon: HandCoins },
  ok: { box: "border-tint-border bg-tint text-tint-foreground", icon: CheckCircle2 },
  watch: { box: "border-warning-border bg-warning text-warning-foreground", icon: Eye },
  tight: { box: "border-warning-border bg-warning text-warning-foreground", icon: AlertTriangle },
  deficit: { box: "border-destructive/40 bg-destructive/10 text-destructive", icon: OctagonAlert },
};

/** Résumé « revenus vs budgets » affiché sur le dashboard. */
export function HealthCard({
  analysis,
  displayCode,
}: {
  analysis: HealthAnalysis;
  displayCode: string;
}) {
  const copy = LEVEL_COPY[analysis.level];
  const { box, icon: Icon } = STYLE[analysis.level];
  const money = (v: number) => formatMoney(v, displayCode);

  let detail = copy.message;
  if (analysis.level === "none") {
    detail = "Ajoutez vos revenus pour savoir si vos budgets sont tenables.";
  } else if (analysis.cutNeeded > 0) {
    detail = `Réduisez vos dépenses d'environ ${money(analysis.cutNeeded)} par mois.`;
  } else if (analysis.remaining > 0) {
    detail = `${money(analysis.remaining)} de marge par mois après vos budgets.`;
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${box}`}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Santé budgétaire : {copy.label}</p>
        <p className="text-sm">{detail}</p>
      </div>
      <Button
        render={<Link href="/income" />}
        variant="outline"
        size="sm"
        className="bg-background/60 text-foreground"
      >
        {analysis.level === "none" ? "Renseigner mes revenus" : "Voir le détail"}
      </Button>
    </div>
  );
}
