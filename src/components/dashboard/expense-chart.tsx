"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/money";

type Datum = { name: string; color: string; total: number };
type TrendDatum = { month: string; income: number; expense: number };

/** Montant compact pour l'axe Y : 12 k, 1,2 M… */
function compact(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
};

export function ExpenseChart({
  data,
  currencyCode,
}: {
  data: Datum[];
  currencyCode: string;
}) {
  return (
    <div
      className="h-64 w-full"
      role="img"
      aria-label={`Dépenses par catégorie : ${data
        .map((d) => `${d.name} ${formatMoney(d.total, currencyCode)}`)
        .join(", ")}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickFormatter={compact}
            width={44}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            formatter={(value) =>
              formatMoney(Number(value ?? 0), currencyCode)
            }
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="total" name="Dépenses" radius={[6, 6, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color || "var(--chart-1)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const MONTHS = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export function TrendChart({
  data,
  currencyCode,
}: {
  data: TrendDatum[];
  currencyCode: string;
}) {
  const rows = data.map((d) => ({
    ...d,
    label: MONTHS[Number(d.month.slice(5, 7)) - 1],
  }));
  return (
    <div
      className="h-64 w-full"
      role="img"
      aria-label={`Revenus et dépenses sur ${data.length} mois : ${rows
        .map(
          (d) =>
            `${d.label} revenus ${formatMoney(d.income, currencyCode)}, dépenses ${formatMoney(d.expense, currencyCode)}`
        )
        .join(" ; ")}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickFormatter={compact}
            width={44}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            formatter={(value) =>
              formatMoney(Number(value ?? 0), currencyCode)
            }
            contentStyle={tooltipStyle}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="income"
            name="Revenus"
            fill="var(--income)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expense"
            name="Dépenses"
            fill="var(--expense)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
