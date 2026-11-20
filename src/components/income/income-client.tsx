"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  OctagonAlert,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  createIncomeSourceAction,
  deleteIncomeSourceAction,
  updateIncomeSourceAction,
} from "@/lib/actions/income";
import { LEVEL_COPY, type HealthAnalysis, type HealthLevel } from "@/lib/income";
import { formatMoney } from "@/lib/money";
import type { Currency } from "@/lib/db/schema";

type Source = {
  id: string;
  name: string;
  amount: number;
  frequency: "month" | "year";
  currencyId: string;
  currencyCode: string;
  monthlyDisplay: number;
};

const LEVEL_STYLE: Record<
  HealthLevel,
  { box: string; icon: typeof Eye; bar?: string }
> = {
  none: { box: "border-border bg-muted/50", icon: Wallet },
  ok: {
    box: "border-tint-border bg-tint text-tint-foreground",
    icon: CheckCircle2,
  },
  watch: {
    box: "border-warning-border bg-warning text-warning-foreground",
    icon: Eye,
    bar: "bg-amber-500",
  },
  tight: {
    box: "border-warning-border bg-warning text-warning-foreground",
    icon: AlertTriangle,
    bar: "bg-amber-500",
  },
  deficit: {
    box: "border-destructive/40 bg-destructive/10 text-destructive",
    icon: OctagonAlert,
    bar: "bg-destructive",
  },
};

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm";

function SourceForm({
  editing,
  currencies,
  onDone,
}: {
  editing: Source | null;
  currencies: Currency[];
  onDone: () => void;
}) {
  const defaultCurrency = currencies.find((c) => c.isDefault) ?? currencies[0];
  const [amount, setAmount] = useState(
    editing ? String(editing.amount).replace(".", ",") : ""
  );
  const [frequency, setFrequency] = useState<"month" | "year">(
    editing?.frequency ?? "month"
  );

  return (
    <ActionForm
      action={editing ? updateIncomeSourceAction : createIncomeSourceAction}
      className="space-y-3"
      onSuccess={onDone}
    >
      {editing && <input type="hidden" name="id" value={editing.id} />}
      <div className="space-y-2">
        <Label htmlFor="inc-name">Source de revenu</Label>
        <Input
          id="inc-name"
          name="name"
          required
          maxLength={80}
          placeholder="Salaire, loyer perçu, activité…"
          defaultValue={editing?.name ?? ""}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="inc-amount">Montant</Label>
          <Input
            id="inc-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            pattern="[0-9\s]*[.,]?[0-9]*"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            type="hidden"
            name="amount"
            value={amount.replace(/\s/g, "").replace(",", ".")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inc-currency">Devise</Label>
          <select
            id="inc-currency"
            name="currencyId"
            required
            defaultValue={editing?.currencyId ?? defaultCurrency?.id ?? ""}
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
      <div className="space-y-2">
        <Label id="inc-freq-label">Fréquence</Label>
        <div
          role="radiogroup"
          aria-labelledby="inc-freq-label"
          className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
        >
          {(
            [
              ["month", "Mensuel"],
              ["year", "Annuel"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={frequency === value}
              onClick={() => setFrequency(value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                frequency === value
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input type="hidden" name="frequency" value={frequency} />
      </div>
      <Button type="submit" className="w-full">
        Enregistrer
      </Button>
    </ActionForm>
  );
}

export function IncomeClient({
  sources,
  analysis,
  currencies,
  displayCode,
}: {
  sources: Source[];
  analysis: HealthAnalysis;
  currencies: Currency[];
  displayCode: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Source | null>(null);

  const money = (v: number) => formatMoney(v, displayCode);
  const copy = LEVEL_COPY[analysis.level];
  const style = LEVEL_STYLE[analysis.level];
  const LevelIcon = style.icon;
  const hasIncome = analysis.monthlyIncome > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-3xl font-medium">Mes revenus</h1>
          <p className="text-sm text-muted-foreground">
            Renseignez vos revenus pour vérifier que vos budgets sont tenables
            (montants en {displayCode} par mois).
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
            Ajouter un revenu
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Modifier la source" : "Nouvelle source de revenu"}
              </DialogTitle>
            </DialogHeader>
            <SourceForm
              key={editing?.id ?? "new"}
              editing={editing}
              currencies={currencies}
              onDone={() => {
                setOpen(false);
                setEditing(null);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <section
        aria-labelledby="health-title"
        className={`space-y-4 rounded-xl border p-4 ${style.box}`}
      >
        <div className="flex items-start gap-3">
          <LevelIcon className="mt-0.5 size-6 shrink-0" aria-hidden />
          <div>
            <h2 id="health-title" className="text-lg font-medium">
              {copy.label}
            </h2>
            <p className="text-sm">{copy.message}</p>
          </div>
        </div>

        {hasIncome ? (
          <>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Budgets + épargne / revenus</span>
                <span className="tabular-nums font-medium">
                  {Math.round(analysis.ratio)} %
                </span>
              </div>
              <Progress
                value={Math.min(100, analysis.ratio)}
                aria-label={`Engagements : ${Math.round(analysis.ratio)} % des revenus`}
                indicatorClassName={style.bar}
              />
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-4">
              <Stat label="Revenus / mois" value={money(analysis.monthlyIncome)} />
              <Stat label="Budgets / mois" value={money(analysis.budgetsMonthly)} />
              <Stat label="Épargne planifiée" value={money(analysis.savingsMonthly)} />
              <Stat
                label={analysis.remaining >= 0 ? "Reste disponible" : "Manque"}
                value={money(Math.abs(analysis.remaining))}
                strong
              />
            </dl>
          </>
        ) : null}
      </section>

      {hasIncome ? (
        <Card>
          <CardHeader>
            <CardTitle>Recommandations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {analysis.cutNeeded > 0 ? (
              <>
                <p>
                  Pour retrouver une marge de 10 % sur vos revenus, réduisez
                  vos dépenses d&apos;environ{" "}
                  <strong className="tabular-nums">
                    {money(analysis.cutNeeded)}
                  </strong>{" "}
                  par mois.
                </p>
                {analysis.suggestions.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.suggestions.map((s) => (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2"
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {money(s.monthly)} → {money(s.newMonthly)}{" "}
                          <span className="text-expense">
                            (−{money(s.cut)})
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {analysis.cutNeeded > analysis.budgetsMonthly ? (
                  <p className="text-muted-foreground">
                    Même sans aucun budget, votre épargne planifiée dépasse vos
                    revenus : revoyez la durée ou le montant de vos plans
                    d&apos;épargne.
                  </p>
                ) : null}
              </>
            ) : (
              <p>
                Vos budgets tiennent dans vos revenus
                {analysis.remaining > 0
                  ? ` avec ${money(analysis.remaining)} de marge par mois, que vous pouvez épargner.`
                  : "."}
              </p>
            )}

            {analysis.monthExpense > 0 ? (
              <p className="text-muted-foreground">
                Dépenses réelles ce mois-ci :{" "}
                <strong className="tabular-nums">
                  {money(analysis.monthExpense)}
                </strong>{" "}
                ({Math.round(analysis.spentRatio)} % de vos revenus mensuels).
              </p>
            ) : null}

            {analysis.overBudgets.length > 0 ? (
              <div className="space-y-1">
                <p className="font-medium">Budgets déjà dépassés</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {analysis.overBudgets.map((b) => (
                    <li key={b.id}>
                      {b.name} : +{money(b.over)} au-dessus du budget
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Mes sources de revenus</h2>
        {sources.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Aucune source de revenu"
            description="Ajoutez votre salaire ou vos autres revenus, mensuels ou annuels."
          />
        ) : (
          sources.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/80 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.frequency === "month" ? "Mensuel" : "Annuel"}
                  {s.frequency === "year"
                    ? ` · ≈ ${money(s.monthlyDisplay)} / mois`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="mr-1 font-medium tabular-nums text-income">
                  {formatMoney(s.amount, s.currencyCode)}
                  <span className="text-xs font-normal text-muted-foreground">
                    {s.frequency === "month" ? " /mois" : " /an"}
                  </span>
                </span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Modifier ${s.name}`}
                  onClick={() => setEditing(s)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <DeleteButton
                  label={`Supprimer ${s.name}`}
                  icon={<Trash2 className="size-3.5" />}
                  confirmMessage={`Supprimer la source « ${s.name} » ?`}
                  action={() => deleteIncomeSourceAction(s.id)}
                  onDone={() => router.refresh()}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs opacity-80">{label}</dt>
      <dd className={`tabular-nums ${strong ? "text-base font-medium" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
