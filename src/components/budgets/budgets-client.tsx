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
import { toMonthly, type Frequency } from "@/lib/income";
import { Stepper } from "@/components/ui-kit/stepper";
import { StatusPill, budgetStatus } from "@/components/ui-kit/status-pill";
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

const selectClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm";

type IncomeInfo = { amount: number; code: string } | null;

function BudgetForm({
  editing,
  categories,
  currencies,
  income,
  onDone,
}: {
  editing: BudgetRow | null;
  categories: Category[];
  currencies: Currency[];
  income: IncomeInfo;
  onDone: () => void;
}) {
  const defaultCurrency =
    currencies.find((c) => c.isDefault) ?? currencies[0];
  const [title, setTitle] = useState(editing?.title ?? "");
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [currencyId, setCurrencyId] = useState(
    editing?.currencyId ?? defaultCurrency?.id ?? ""
  );
  const [period, setPeriod] = useState(editing?.period ?? "month");
  const [startDate, setStartDate] = useState(
    editing?.startDate ?? new Date().toISOString().slice(0, 10)
  );

  const what = (
    <>
      <div className="space-y-2">
        <Label htmlFor="bg-category">Catégorie</Label>
        <select
          id="bg-category"
          name="categoryId"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={selectClass}
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
      <div className="space-y-2">
        <Label htmlFor="bg-title">Titre (facultatif)</Label>
        <Input
          id="bg-title"
          name="title"
          maxLength={80}
          placeholder="Ex. Courses du mois, Restaurants…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
    </>
  );

  const how = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="bg-amount">Plafond</Label>
          <Input
            id="bg-amount"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bg-currency">Devise</Label>
          <select
            id="bg-currency"
            name="currencyId"
            required
            value={currencyId}
            onChange={(e) => setCurrencyId(e.target.value)}
            className={selectClass}
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
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={selectClass}
          >
            <option value="month">Mensuel</option>
            <option value="week">Hebdomadaire</option>
            <option value="day">Journalier</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bg-start">Début</Label>
          <Input
            id="bg-start"
            name="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      </div>
    </>
  );

  const cat = categories.find((c) => c.id === categoryId);
  const cur = currencies.find((c) => c.id === currencyId);
  const amt = Number(amount);
  const monthly = amt > 0 ? toMonthly(amt, period as Frequency) : 0;
  let share: number | null = null;
  if (income && cur && monthly > 0) {
    const incCur = currencies.find((c) => c.code === income.code);
    const incomeUsd = incCur ? income.amount * incCur.rateToUsd : 0;
    if (incomeUsd > 0) share = ((monthly * cur.rateToUsd) / incomeUsd) * 100;
  }

  const recap = (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
      <div>
        <p className="font-medium">{title.trim() || cat?.name || "Budget"}</p>
        {title.trim() && cat ? (
          <p className="text-xs text-muted-foreground">{cat.name}</p>
        ) : null}
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Plafond</dt>
          <dd className="font-medium tabular-nums">
            {cur && amt > 0 ? formatMoney(amt, cur.code) : "—"}{" "}
            <span className="font-normal text-muted-foreground">
              par {periodLabel(period as "month" | "week" | "day")}
            </span>
          </dd>
        </div>
        {cur && monthly > 0 ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Soit environ</dt>
            <dd className="font-medium tabular-nums">
              {formatMoney(monthly, cur.code)} par mois
            </dd>
          </div>
        ) : null}
        {share !== null ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Part de vos revenus</dt>
            <dd className="font-medium tabular-nums">
              {share < 10 ? share.toFixed(1) : Math.round(share)} %
            </dd>
          </div>
        ) : null}
      </dl>
      {share === null && income === null ? (
        <p className="text-xs text-muted-foreground">
          Ajoutez vos sources de revenus pour voir la part que ce budget
          représente.
        </p>
      ) : null}
    </div>
  );

  return (
    <ActionForm
      action={editing ? updateBudgetAction : createBudgetAction}
      className="space-y-3"
      onSuccess={onDone}
    >
      {editing && <input type="hidden" name="id" value={editing.id} />}
      {editing ? (
        <>
          {what}
          {how}
          <Button type="submit" className="w-full">
            Enregistrer
          </Button>
        </>
      ) : (
        <Stepper
          submitLabel="Créer le budget"
          steps={[
            { title: "Pour quelle dépense ?", content: what },
            { title: "Combien et pour quelle durée ?", content: how },
            { title: "Récapitulatif", content: recap },
          ]}
        />
      )}
    </ActionForm>
  );
}

export function BudgetsClient({
  budgets,
  categories,
  currencies,
  income,
  openNew = false,
}: {
  budgets: BudgetRow[];
  categories: Category[];
  currencies: Currency[];
  income: IncomeInfo;
  openNew?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(openNew);
  const [editing, setEditing] = useState<BudgetRow | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-3xl font-medium">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Fixez une limite, suivez ce qui reste.
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
            <BudgetForm
              key={editing?.id ?? "new"}
              editing={editing}
              categories={categories}
              currencies={currencies}
              income={income}
              onDone={() => {
                setOpen(false);
                setEditing(null);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {budgets.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Aucun budget"
            description="Définissez un budget pour suivre vos dépenses."
          />
        ) : (
          budgets.map((b) => {
            const status = budgetStatus(b.over ? 101 : b.percent);
            return (
              <div
                key={b.id}
                className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${b.categoryColor}26` }}
                  >
                    <span
                      className="size-3 rounded-full"
                      style={{ background: b.categoryColor }}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium">{b.label}</p>
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {b.title?.trim() ? `${b.categoryName} · ` : ""}
                      {periodLabel(b.period as "month" | "week" | "day")} ·{" "}
                      {formatMoney(b.amount, b.currencyCode)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress
                    value={b.percent}
                    aria-label={`Budget ${b.label} utilisé à ${Math.round(b.percent)} %`}
                    indicatorClassName={
                      status.tone === "over"
                        ? "bg-destructive"
                        : status.tone === "watch"
                          ? "bg-amber-500"
                          : undefined
                    }
                  />
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <span className="tabular-nums text-muted-foreground">
                      Dépensé : {formatMoney(b.spent, b.currencyCode)}
                    </span>
                    <span className="font-medium tabular-nums">
                      {b.remaining >= 0
                        ? `Reste ${formatMoney(b.remaining, b.currencyCode)}`
                        : `Dépassé de ${formatMoney(-b.remaining, b.currencyCode)}`}
                    </span>
                  </div>
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
                <PlannedChecklist budget={b} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
