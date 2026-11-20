"use client";

import { EmptyState } from "@/components/empty-state";
import {
  Car,
  Flag,
  GraduationCap,
  House,
  PiggyBank,
  Plane,
  Plus,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Stepper } from "@/components/ui-kit/stepper";
import { StatusPill, savingsStatus } from "@/components/ui-kit/status-pill";
import {
  contributeSavingsAction,
  createSavingsPlanAction,
  deleteSavingsPlanAction,
  updateSavingsPlanAction,
} from "@/lib/actions/savings";
import { toMonthly, type Frequency } from "@/lib/income";
import {
  formatMoney,
  periodLabel,
  suggestedContribution,
} from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Currency } from "@/lib/db/schema";

type Plan = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  periodicity: string;
  durationUnits: number;
  startDate: string;
  currencyId: string;
  currencyCode: string;
};

type IncomeInfo = { amount: number; code: string } | null;
type Per = "month" | "week" | "day";

const GOALS = [
  { key: "home", label: "Un logement", name: "Achat d'un logement", icon: House },
  { key: "emergency", label: "Imprévus", name: "Fonds d'urgence", icon: ShieldCheck },
  { key: "trip", label: "Un voyage", name: "Voyage", icon: Plane },
  { key: "education", label: "Des études", name: "Études", icon: GraduationCap },
  { key: "car", label: "Un véhicule", name: "Achat d'un véhicule", icon: Car },
  { key: "business", label: "Une activité", name: "Lancer mon activité", icon: Rocket },
  { key: "other", label: "Autre", name: "", icon: Flag },
] as const;

const selectClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm";

/** Avancement « attendu » (en %) selon le temps écoulé depuis le début du plan. */
function expectedPercent(p: Plan): number {
  const start = new Date(p.startDate).getTime();
  if (!Number.isFinite(start) || p.durationUnits <= 0) return 0;
  const days = (Date.now() - start) / 86_400_000;
  const unitDays =
    p.periodicity === "day" ? 1 : p.periodicity === "week" ? 7 : 30.4375;
  return Math.max(0, Math.min(100, (days / unitDays / p.durationUnits) * 100));
}

function PlanForm({
  editing,
  currencies,
  income,
  onDone,
}: {
  editing: Plan | null;
  currencies: Currency[];
  income: IncomeInfo;
  onDone: () => void;
}) {
  const defaultCurrency =
    currencies.find((c) => c.isDefault) ?? currencies[0];
  const [name, setName] = useState(editing?.name ?? "");
  const [goalKey, setGoalKey] = useState<string>("");
  const [target, setTarget] = useState(
    editing ? String(editing.targetAmount) : ""
  );
  const [currencyId, setCurrencyId] = useState(
    editing?.currencyId ?? defaultCurrency?.id ?? ""
  );
  const [periodicity, setPeriodicity] = useState(editing?.periodicity ?? "month");
  const [duration, setDuration] = useState(
    String(editing?.durationUnits ?? 12)
  );
  const [startDate, setStartDate] = useState(
    editing?.startDate ?? new Date().toISOString().slice(0, 10)
  );

  const what = (
    <>
      {!editing ? (
        <div
          role="radiogroup"
          aria-label="Type d'objectif"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {GOALS.map(({ key, label, name: goalName, icon: Icon }) => {
            const selected = goalKey === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setGoalKey(key);
                  if (goalName) setName(goalName);
                  else if (GOALS.some((g) => g.name && g.name === name)) setName("");
                }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-3 text-center text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-tint text-tint-foreground"
                    : "border-border/70 bg-card hover:bg-accent"
                )}
              >
                <Icon className="size-6 text-primary" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="sv-name">Nom de l&apos;objectif</Label>
        <Input
          id="sv-name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Voyage, fonds d'urgence…"
        />
      </div>
    </>
  );

  const amountStep = (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor="sv-target">Montant à atteindre</Label>
        <Input
          id="sv-target"
          name="targetAmount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          required
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sv-currency">Devise</Label>
        <select
          id="sv-currency"
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
  );

  const durationStep = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="sv-periodicity">Je mets de côté…</Label>
          <select
            id="sv-periodicity"
            name="periodicity"
            required
            value={periodicity}
            onChange={(e) => setPeriodicity(e.target.value)}
            className={selectClass}
          >
            <option value="month">Chaque mois</option>
            <option value="week">Chaque semaine</option>
            <option value="day">Chaque jour</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sv-duration">
            Pendant combien de {periodLabel(periodicity as Per, true)} ?
          </Label>
          <Input
            id="sv-duration"
            name="durationUnits"
            type="number"
            inputMode="numeric"
            min="1"
            required
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sv-start">Date de début</Label>
        <Input
          id="sv-start"
          name="startDate"
          type="date"
          required
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
    </>
  );

  const cur = currencies.find((c) => c.id === currencyId);
  const t = Number(target);
  const d = Number(duration);
  const perPeriod = t > 0 && d > 0 ? suggestedContribution(t, d) : 0;
  const monthly = perPeriod > 0 ? toMonthly(perPeriod, periodicity as Frequency) : 0;
  let share: number | null = null;
  if (income && cur && monthly > 0) {
    const incCur = currencies.find((c) => c.code === income.code);
    const incomeUsd = incCur ? income.amount * incCur.rateToUsd : 0;
    if (incomeUsd > 0) share = ((monthly * cur.rateToUsd) / incomeUsd) * 100;
  }

  const suggestion = perPeriod > 0 && cur && (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
      <div>
        <p className="font-medium">{name.trim() || "Objectif d'épargne"}</p>
        <p className="text-xs text-muted-foreground">
          {formatMoney(t, cur.code)} en {d} {periodLabel(periodicity as Per, true)}
        </p>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">
            Épargne nécessaire par {periodLabel(periodicity as Per)}
          </dt>
          <dd className="text-lg font-medium tabular-nums">
            {formatMoney(perPeriod, cur.code)}
          </dd>
        </div>
        {periodicity !== "month" ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Soit environ</dt>
            <dd className="font-medium tabular-nums">
              {formatMoney(monthly, cur.code)} par mois
            </dd>
          </div>
        ) : null}
        {share !== null ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Part de votre revenu mensuel</dt>
            <dd className="font-medium tabular-nums">
              {share < 10 ? share.toFixed(1) : Math.round(share)} %
            </dd>
          </div>
        ) : null}
      </dl>
      {share !== null && share > 30 ? (
        <p className="text-xs text-warning-foreground">
          Cela représente une part importante de vos revenus. Allonger la durée
          allègerait l&apos;effort.
        </p>
      ) : null}
      {income === null ? (
        <p className="text-xs text-muted-foreground">
          Ajoutez vos sources de revenus pour voir la part que cet objectif
          représente.
        </p>
      ) : null}
    </div>
  );

  const recap = suggestion || (
    <p className="text-sm text-muted-foreground">
      Renseignez le montant et la durée pour voir le récapitulatif.
    </p>
  );

  return (
    <ActionForm
      action={editing ? updateSavingsPlanAction : createSavingsPlanAction}
      className="space-y-3"
      onSuccess={onDone}
    >
      {editing && <input type="hidden" name="id" value={editing.id} />}
      {editing ? (
        <>
          {what}
          {amountStep}
          {durationStep}
          {suggestion || null}
          <Button type="submit" className="w-full">
            Enregistrer
          </Button>
        </>
      ) : (
        <Stepper
          submitLabel="Créer l'objectif"
          steps={[
            { title: "Quel est votre objectif ?", content: what },
            { title: "Quel montant visez-vous ?", content: amountStep },
            { title: "Sur quelle durée ?", content: durationStep },
            { title: "Récapitulatif", content: recap },
          ]}
        />
      )}
    </ActionForm>
  );
}

export function SavingsClient({
  plans,
  currencies,
  income,
  openNew = false,
}: {
  plans: Plan[];
  currencies: Currency[];
  income: IncomeInfo;
  openNew?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(openNew);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [contributeId, setContributeId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-3xl font-medium">Objectifs d&apos;épargne</h1>
          <p className="text-sm text-muted-foreground">
            Un projet en tête ? On calcule combien mettre de côté.
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
            Nouvel objectif
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Modifier l'objectif" : "Nouvel objectif d'épargne"}
              </DialogTitle>
            </DialogHeader>
            <PlanForm
              key={editing?.id ?? "new"}
              editing={editing}
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

      <Dialog
        open={!!contributeId}
        onOpenChange={(v) => !v && setContributeId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Enregistrer un versement</DialogTitle>
          </DialogHeader>
          <ActionForm
            action={contributeSavingsAction}
            className="space-y-3"
            onSuccess={() => {
              setContributeId(null);
              router.refresh();
            }}
          >
            <input type="hidden" name="id" value={contributeId ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="contrib">Montant</Label>
              <Input
                id="contrib"
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Verser
            </Button>
          </ActionForm>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {plans.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="Aucun objectif d'épargne"
            description="Créez un objectif avec un montant et une durée."
          />
        ) : (
          plans.map((p) => {
            const percent =
              p.targetAmount > 0
                ? Math.min(100, (p.currentAmount / p.targetAmount) * 100)
                : 0;
            const perPeriod = suggestedContribution(
              p.targetAmount,
              p.durationUnits
            );
            const status = savingsStatus(percent, expectedPercent(p));
            return (
              <div
                key={p.id}
                className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(p.currentAmount, p.currencyCode)} sur{" "}
                      {formatMoney(p.targetAmount, p.currencyCode)} ·{" "}
                      {p.durationUnits}{" "}
                      {periodLabel(p.periodicity as Per, true)}
                    </p>
                  </div>
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                </div>
                <div className="space-y-2">
                  <Progress
                    value={percent}
                    aria-label={`Objectif ${p.name} atteint à ${Math.round(percent)} %`}
                  />
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <span className="tabular-nums text-muted-foreground">
                      À mettre de côté : {formatMoney(perPeriod, p.currencyCode)}{" "}
                      par {periodLabel(p.periodicity as Per)}
                    </span>
                    <span className="font-medium tabular-nums">
                      {Math.round(percent)}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setContributeId(p.id)}>
                    Verser
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(p)}
                    aria-label={`Modifier l'objectif ${p.name}`}
                  >
                    Modifier
                  </Button>
                  <DeleteButton
                    ariaLabel={`Supprimer l'objectif ${p.name}`}
                    confirmMessage={`Supprimer l'objectif « ${p.name} » ?`}
                    action={() => deleteSavingsPlanAction(p.id)}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
