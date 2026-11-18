"use client";

import { EmptyState } from "@/components/empty-state";
import { PiggyBank } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
  contributeSavingsAction,
  createSavingsPlanAction,
  deleteSavingsPlanAction,
  updateSavingsPlanAction,
} from "@/lib/actions/savings";
import {
  formatMoney,
  periodLabel,
  suggestedContribution,
} from "@/lib/money";
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

export function SavingsClient({
  plans,
  currencies,
}: {
  plans: Plan[];
  currencies: Currency[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [duration, setDuration] = useState("12");
  const defaultCurrency =
    currencies.find((c) => c.isDefault) ?? currencies[0];

  const suggestion = useMemo(() => {
    const t = Number(target);
    const d = Number(duration);
    if (!t || !d) return null;
    return suggestedContribution(t, d);
  }, [target, duration]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-3xl font-medium">Épargne</h1>
          <p className="text-sm text-muted-foreground">
            Objectifs avec contribution calculée selon la durée
          </p>
        </div>
        <Dialog
          open={open || !!editing}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setEditing(null);
              setTarget("");
              setDuration("12");
            }
          }}
        >
          <DialogTrigger
            render={<Button />}
            onClick={() => {
              setEditing(null);
              setTarget("");
              setDuration("12");
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nouveau plan
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Modifier le plan" : "Nouveau plan d'épargne"}
              </DialogTitle>
            </DialogHeader>
            <ActionForm
              action={
                editing ? updateSavingsPlanAction : createSavingsPlanAction
              }
              className="space-y-3"
              onSuccess={() => {
                setOpen(false);
                setEditing(null);
                router.refresh();
              }}
            >
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={editing?.name ?? ""}
                  placeholder="Voyage, fonds d'urgence…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Objectif</Label>
                  <Input
                    id="targetAmount"
                    name="targetAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    defaultValue={editing?.targetAmount ?? ""}
                    onChange={(e) => setTarget(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sv-currency">Devise</Label>
                  <select
                    id="sv-currency"
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
                  <Label htmlFor="sv-periodicity">Périodicité</Label>
                  <select
                    id="sv-periodicity"
                    name="periodicity"
                    required
                    defaultValue={editing?.periodicity ?? "month"}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="month">Mensuelle</option>
                    <option value="week">Hebdomadaire</option>
                    <option value="day">Journalière</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationUnits">Durée (nb périodes)</Label>
                  <Input
                    id="durationUnits"
                    name="durationUnits"
                    type="number"
                    min="1"
                    required
                    defaultValue={editing?.durationUnits ?? 12}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  defaultValue={
                    editing?.startDate ?? new Date().toISOString().slice(0, 10)
                  }
                />
              </div>
              {suggestion != null && (
                <p className="rounded-lg bg-tint px-3 py-2 text-sm text-tint-foreground">
                  Contribution suggérée :{" "}
                  <strong>
                    {suggestion.toLocaleString("fr-FR", {
                      maximumFractionDigits: 2,
                    })}
                  </strong>{" "}
                  par période
                </p>
              )}
              <Button type="submit" className="w-full">
                Enregistrer
              </Button>
            </ActionForm>
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

      <div className="space-y-3">
        {plans.length === 0 ? (
          <EmptyState icon={PiggyBank} title="Aucun plan d'épargne" description="Créez un plan avec un montant et une durée." />
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
            return (
              <div
                key={p.id}
                className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(p.currentAmount, p.currencyCode)} /{" "}
                      {formatMoney(p.targetAmount, p.currencyCode)} ·{" "}
                      {p.durationUnits}{" "}
                      {periodLabel(
                        p.periodicity as "month" | "week" | "day",
                        true
                      )}
                    </p>
                    <p className="mt-1 text-xs text-tint-foreground">
                      ≈ {formatMoney(perPeriod, p.currencyCode)} /{" "}
                      {periodLabel(p.periodicity as "month" | "week" | "day")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => setContributeId(p.id)}
                    >
                      Verser
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(p);
                        setTarget(String(p.targetAmount));
                        setDuration(String(p.durationUnits));
                      }}
                      aria-label={`Modifier le plan ${p.name}`}
                    >
                      Modifier
                    </Button>
                    <DeleteButton
                      ariaLabel={`Supprimer le plan ${p.name}`}
                      confirmMessage={`Supprimer le plan « ${p.name} » ?`}
                      action={() => deleteSavingsPlanAction(p.id)}
                    />
                  </div>
                </div>
                <Progress value={percent} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
