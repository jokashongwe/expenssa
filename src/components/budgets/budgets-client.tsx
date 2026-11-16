"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/forms/action-form";
import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  createBudgetAction,
  deleteBudgetAction,
  updateBudgetAction,
} from "@/lib/actions/budgets";
import { formatMoney, periodLabel } from "@/lib/money";
import type { Category, Currency } from "@/lib/db/schema";

type BudgetRow = {
  id: string;
  amount: number;
  period: string;
  startDate: string;
  categoryId: string;
  currencyId: string;
  categoryName: string;
  categoryColor: string;
  currencyCode: string;
  spent: number;
  percent: number;
  over: boolean;
};

export function BudgetsClient({
  budgets,
  categories,
  currencies,
}: {
  budgets: BudgetRow[];
  categories: Category[];
  currencies: Currency[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetRow | null>(null);
  const defaultCurrency =
    currencies.find((c) => c.isDefault) ?? currencies[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Plafonds par catégorie et périodicité
          </p>
        </div>
        <Dialog
          open={open || !!editing}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger
            render={<Button />}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nouveau budget
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Modifier le budget" : "Nouveau budget"}
              </DialogTitle>
            </DialogHeader>
            <ActionForm
              action={editing ? updateBudgetAction : createBudgetAction}
              className="space-y-3"
              onSuccess={() => {
                setOpen(false);
                setEditing(null);
                router.refresh();
              }}
            >
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <select
                  name="categoryId"
                  required
                  defaultValue={editing?.categoryId ?? ""}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Plafond</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    defaultValue={editing?.amount ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <select
                    name="currencyId"
                    required
                    defaultValue={
                      editing?.currencyId ?? defaultCurrency?.id ?? ""
                    }
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    {currencies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Période</Label>
                  <select
                    name="period"
                    required
                    defaultValue={editing?.period ?? "month"}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="month">Mensuel</option>
                    <option value="week">Hebdomadaire</option>
                    <option value="day">Journalier</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Début</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    required
                    defaultValue={
                      editing?.startDate ??
                      new Date().toISOString().slice(0, 10)
                    }
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Enregistrer
              </Button>
            </ActionForm>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {budgets.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Définissez un budget pour suivre vos dépenses.
          </p>
        ) : (
          budgets.map((b) => (
            <div
              key={b.id}
              className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: b.categoryColor }}
                    />
                    <p className="font-medium">{b.categoryName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {periodLabel(b.period as "month" | "week" | "day")} ·{" "}
                    {formatMoney(b.amount, b.currencyCode)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(b)}>
                    Modifier
                  </Button>
                  <DeleteButton action={() => deleteBudgetAction(b.id)} />
                </div>
              </div>
              <Progress value={b.percent} />
              <div className="flex justify-between text-sm">
                <span className="tabular-nums text-muted-foreground">
                  Dépensé : {formatMoney(b.spent, b.currencyCode)}
                </span>
                {b.over ? (
                  <span className="font-medium text-destructive">Dépassé</span>
                ) : (
                  <span className="tabular-nums text-muted-foreground">
                    {Math.round(b.percent)}%
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
