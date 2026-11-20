/**
 * Analyse « revenus vs budgets » : fonctions pures (aucun accès DB).
 * Tous les montants sont exprimés dans la devise d'affichage, ramenés au mois.
 */

export type Frequency = "month" | "year" | "week" | "day";

/** Nombre de mois par période → facteur de conversion vers un montant mensuel. */
export function toMonthly(amount: number, frequency: Frequency): number {
  switch (frequency) {
    case "year":
      return amount / 12;
    case "week":
      return (amount * 52) / 12;
    case "day":
      return (amount * 365) / 12;
    default:
      return amount;
  }
}

export type HealthLevel = "none" | "ok" | "watch" | "tight" | "deficit";

export type BudgetLine = {
  id: string;
  name: string;
  /** Budget ramené au mois */
  monthly: number;
  /** Dépensé sur la période du budget (même devise que `limit`) */
  spent: number;
  limit: number;
};

export type Suggestion = {
  id: string;
  name: string;
  monthly: number;
  /** Réduction mensuelle conseillée */
  cut: number;
  newMonthly: number;
};

export type HealthAnalysis = {
  level: HealthLevel;
  monthlyIncome: number;
  budgetsMonthly: number;
  savingsMonthly: number;
  /** Budgets + épargne planifiée */
  commitments: number;
  /** Revenu − engagements (peut être négatif) */
  remaining: number;
  /** Engagements / revenu, en % (0 si pas de revenu) */
  ratio: number;
  /** Dépenses réelles du mois / revenu, en % */
  spentRatio: number;
  monthExpense: number;
  /** Réduction mensuelle à viser pour retrouver une marge de 10 % */
  cutNeeded: number;
  suggestions: Suggestion[];
  overBudgets: { id: string; name: string; over: number }[];
};

/** Marge de sécurité visée : engagements ≤ 90 % du revenu. */
export const TARGET_RATIO = 0.9;

export function levelFor(ratio: number): Exclude<HealthLevel, "none"> {
  if (ratio > 1) return "deficit";
  if (ratio > TARGET_RATIO) return "tight";
  if (ratio > 0.8) return "watch";
  return "ok";
}

export function analyzeBudgetHealth(input: {
  monthlyIncome: number;
  budgets: BudgetLine[];
  savingsMonthly: number;
  monthExpense: number;
}): HealthAnalysis {
  const { monthlyIncome, budgets, savingsMonthly, monthExpense } = input;
  const budgetsMonthly = budgets.reduce((s, b) => s + b.monthly, 0);
  const commitments = budgetsMonthly + savingsMonthly;
  const remaining = monthlyIncome - commitments;
  const ratioRaw = monthlyIncome > 0 ? commitments / monthlyIncome : 0;
  const spentRatio = monthlyIncome > 0 ? (monthExpense / monthlyIncome) * 100 : 0;

  let level: HealthLevel =
    monthlyIncome > 0 ? levelFor(ratioRaw) : "none";
  // Dépenses réelles déjà au-dessus du revenu : situation critique
  if (monthlyIncome > 0 && monthExpense > monthlyIncome) level = "deficit";

  const cutNeeded =
    monthlyIncome > 0
      ? Math.max(0, commitments - monthlyIncome * TARGET_RATIO)
      : 0;

  // Réduction répartie proportionnellement sur les plus gros budgets
  // (l'épargne n'est pas touchée : on ne conseille pas de moins épargner).
  const sorted = [...budgets]
    .filter((b) => b.monthly > 0)
    .sort((a, b) => b.monthly - a.monthly);
  const cuttable = Math.min(cutNeeded, budgetsMonthly);
  const suggestions: Suggestion[] =
    cuttable > 0 && budgetsMonthly > 0
      ? sorted.slice(0, 4).map((b) => {
          const cut = Math.min(b.monthly, (cuttable * b.monthly) / budgetsMonthly);
          return {
            id: b.id,
            name: b.name,
            monthly: b.monthly,
            cut,
            newMonthly: b.monthly - cut,
          };
        })
      : [];

  const overBudgets = budgets
    .filter((b) => b.spent > b.limit)
    .map((b) => ({ id: b.id, name: b.name, over: b.spent - b.limit }))
    .sort((a, b) => b.over - a.over);

  return {
    level,
    monthlyIncome,
    budgetsMonthly,
    savingsMonthly,
    commitments,
    remaining,
    ratio: ratioRaw * 100,
    spentRatio,
    monthExpense,
    cutNeeded,
    suggestions,
    overBudgets,
  };
}

export const LEVEL_COPY: Record<
  HealthLevel,
  { label: string; message: string }
> = {
  none: {
    label: "À renseigner",
    message:
      "Ajoutez vos sources de revenus pour savoir si vos budgets sont tenables.",
  },
  ok: {
    label: "Confortable",
    message:
      "Vos budgets sont couverts par vos revenus avec une bonne marge. Vous pouvez continuer ainsi.",
  },
  watch: {
    label: "À surveiller",
    message:
      "Vos budgets absorbent une grande part de vos revenus. Restez attentif aux dépassements.",
  },
  tight: {
    label: "Situation tendue",
    message:
      "Vos budgets laissent très peu de marge. Il est conseillé de réduire certaines dépenses.",
  },
  deficit: {
    label: "Déficit",
    message:
      "Vos dépenses dépassent vos revenus. Vous devez réduire vos dépenses ou augmenter vos revenus.",
  },
};
