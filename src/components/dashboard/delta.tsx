import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

/**
 * Variation vs mois précédent. `goodWhenUp` : une hausse est positive
 * (revenus) ou négative (dépenses). Icône + texte, pas seulement la couleur.
 */
export function Delta({
  current,
  previous,
  goodWhenUp,
}: {
  current: number;
  previous: number;
  goodWhenUp: boolean;
}) {
  if (previous <= 0) {
    return (
      <p className="mt-1 text-xs text-muted-foreground">
        Pas de données le mois précédent
      </p>
    );
  }
  const rounded = Math.round(((current - previous) / previous) * 100);
  if (rounded === 0) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="size-3" aria-hidden /> Stable vs mois précédent
      </p>
    );
  }
  const up = rounded > 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <p
      className={`mt-1 flex items-center gap-1 text-xs ${
        good ? "text-income" : "text-expense"
      }`}
    >
      <Icon className="size-3" aria-hidden />
      {up ? "+" : "-"}
      {Math.abs(rounded)} % vs mois précédent
    </p>
  );
}
