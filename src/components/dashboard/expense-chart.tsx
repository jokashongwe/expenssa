"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/money";

type Datum = { name: string; color: string; total: number };

export function ExpenseChart({
  data,
  currencyCode,
}: {
  data: Datum[];
  currencyCode: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            width={48}
          />
          <Tooltip
            formatter={(value) =>
              formatMoney(Number(value ?? 0), currencyCode)
            }
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#0d9488" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
