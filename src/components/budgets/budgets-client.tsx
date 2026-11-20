"use client";

import { EmptyState } from "@/components/empty-state";
import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ActionForm } from "@/components/forms/action-form";
import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  createPlannedItemAction,
  deletePlannedItemAction,
  togglePlannedItemAction,
} from "@/lib/actions/planned";
import { formatMoney, periodLabel } from "@/lib/money";
import type { Category, Currency } from "@/lib/db/schema";

type PlannedItem = {
  id: string;
  label: string;
  amount: number;
  checked: boolean;
};

type BudgetRow = {
  id: string;
  title: string | null;
  label: string;
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
  plannedItems: PlannedItem[];
  plannedChecked: number;
  remaining: number;
  projected: number;
  gap: number;
  fitsWithPlanned: boolean;
};

function PlannedChecklist({
  budget,
}: {
  budget: BudgetRow;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3 border-t border-border/60 pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Dépenses prévisionnelles</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setAdding((v) => !v)}
        >
          <Plus className="size-3.5" />
          Ajouter
        </Button>
      </div>

      {adding && (
        <ActionForm
          action={createPlannedItemAction}
          className="grid gap-2 sm:grid-cols-[1fr_7rem_auto]"
          onSuccess={() => {
            setAdding(false);
            router.refresh();
          }}
        >
          <input type="hidden" name="budgetId" value={budget.id} />
          <Input
            name="label"
            required
            minLength={2}
            placeholder="Ex. Loyer, courses, essence…"
          />
          <Input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="Montant"
          />
          <Button type="submit" size="sm">
            OK
          </Button>
        </ActionForm>
      )}

      {budget.plannedItems.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Cochez des préférences de dépenses pour simuler si le budget suffit.
        </p>
      ) : (
        <ul className="space-y-2">
          {budget.plannedItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2"
            >
              <Checkbox
                checked={item.checked}
                disabled={pending}
                onCheckedChange={(value) => {
                  start(async () => {
                    const res = await togglePlannedItemAction(
                      item.id,
                      value === true
                    );
                    if (res.error) toast.error(res.error);
                    router.refresh();
                  });
                }}
                aria-label={`Inclure ${item.label}`}
              />
              <span
                className={`min-w-0 flex-1 text-sm ${
                  item.checked ? "text-foreground" : "text-muted-foreground line-through"
                }`}
              >
                {item.label}
              </span>
              <span className="tabular-nums text-sm font-medium">
                {formatMoney(item.amount, budget.currencyCode)}
              </span>
              <DeleteButton
                label={`Supprimer ${item.label}`}
                confirmMessage={`Supprimer « ${item.label} » du prévisionnel ?`}
                icon={<Trash2 className="size-3.5" />}
                action={() => deletePlannedItemAction(item.id)}
                onDone={() => router.refresh()}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-1 rounded-lg bg-tint px-3 py-2 text-xs text-tint-foreground sm:grid-cols-3">
        <p>
          Prévisionnel coché :{" "}
          <strong className="tabular-nums">
            {formatMoney(budget.plannedChecked, budget.currencyCode)}
          </strong>
        </p>
        <p>
          Projection (réel + prévu) :{" "}
          <strong className="tabular-nums">
            {formatMoney(budget.projected, budget.currencyCode)}
          </strong>
        </p>
        <p>
          Écart vs plafond :{" "}
          <strong
            className={`tabular-nums ${
              budget.fitsWithPlanned ? "text-income" : "text-destructive"
            }`}
          >
            {budget.gap >= 0 ? "+" : ""}
            {formatMoney(budget.gap, budget.currencyCode)}
          </strong>
          {!budget.fitsWithPlanned && " (insuffisant)"}
          {budget.fitsWithPlanned && budget.plannedChecked > 0 && " (tient)"}
        </p>
      </div>
    </div>
  );
}

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
          <h1 className="font-sans text-3xl font-medium">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Plafonds, dépenses réelles et prévisions à cocher
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
                <Label htmlFor="bg-title">Titre (facultatif)</Label>
                <Input
                  id="bg-title"
                  name="title"
                  maxLength={80}
                  placeholder="Ex. Courses du mois, Restaurants…"
                  defaultValue={editing?.title ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bg-category">Catégorie</Label>
                <select
                  id="bg-category"
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
                  <Label htmlFor="bg-currency">Devise</Label>
                  <select
                    id="bg-currency"
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
                  <Label htmlFor="bg-period">Période</Label>
                  <select
                    id="bg-period"
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
          <EmptyState icon={Wallet} title="Aucun budget" description="Définissez un budget pour suivre vos dépenses." />
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
                      aria-hidden
                    />
                    <p className="font-medium">{b.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {b.title?.trim() ? `${b.categoryName} · ` : ""}
                    {periodLabel(b.period as "month" | "week" | "day")} ·{" "}
                    {formatMoney(b.amount, b.currencyCode)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Modifier le budget ${b.label}`}
                    onClick={() => setEditing(b)}
                  >
                    Modifier
                  </Button>
                  <DeleteButton
                    ariaLabel={`Supprimer le budget ${b.label}`}
                    confirmMessage={`Supprimer le budget « ${b.label} » ?`}
                    action={() => deleteBudgetAction(b.id)}
                  />
                </div>
              </div>
              <Progress value={b.percent} />
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="tabular-nums text-muted-foreground">
                  Dépensé : {formatMoney(b.spent, b.currencyCode)}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  Reste : {formatMoney(b.remaining, b.currencyCode)}
                </span>
                {b.over ? (
                  <span className="font-medium text-destructive">Dépassé</span>
                ) : (
                  <span className="tabular-nums text-muted-foreground">
                    {Math.round(b.percent)}%
                  </span>
                )}
              </div>
              <PlannedChecklist budget={b} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
