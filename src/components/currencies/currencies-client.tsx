"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ActionForm } from "@/components/forms/action-form";
import { DeleteButton } from "@/components/delete-button";
import { Badge } from "@/components/ui/badge";
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
import {
  createCurrencyAction,
  deleteCurrencyAction,
  setDisplayCurrencyAction,
  updateCurrencyAction,
} from "@/lib/actions/currencies";
import { rateToUnitsPerUsd } from "@/lib/money";
import type { Currency } from "@/lib/db/schema";

export function CurrenciesClient({
  currencies,
  displayCode,
}: {
  currencies: Currency[];
  displayCode: string;
  defaultCode: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-3xl font-medium">Devises</h1>
          <p className="text-sm text-muted-foreground">
            USD par défaut. Ajoutez CDF ou d&apos;autres devises manuellement.
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
            Ajouter
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Modifier la devise" : "Nouvelle devise"}
              </DialogTitle>
            </DialogHeader>
            <ActionForm
              action={editing ? updateCurrencyAction : createCurrencyAction}
              className="space-y-3"
              onSuccess={() => {
                setOpen(false);
                setEditing(null);
                router.refresh();
              }}
            >
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    name="code"
                    required
                    placeholder="CDF"
                    defaultValue={editing?.code ?? ""}
                    disabled={editing?.code === "USD"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Franc congolais"
                    defaultValue={editing?.name ?? ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitsPerUsd">
                  Unités pour 1 USD
                </Label>
                <Input
                  id="unitsPerUsd"
                  name="unitsPerUsd"
                  type="number"
                  step="any"
                  min="0.000001"
                  required
                  defaultValue={
                    editing
                      ? rateToUnitsPerUsd(editing.rateToUsd)
                      : 2800
                  }
                  disabled={editing?.code === "USD"}
                />
                <p className="text-xs text-muted-foreground">
                  Ex. CDF : si 1 USD = 2 800 CDF, saisissez 2800.
                </p>
              </div>
              <Button type="submit" className="w-full">
                Enregistrer
              </Button>
            </ActionForm>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {currencies.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/80 px-4 py-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{c.code}</p>
                <p className="text-sm text-muted-foreground">{c.name}</p>
                {c.code === displayCode && (
                  <Badge className="bg-primary text-primary-foreground">Affichage</Badge>
                )}
                {c.isDefault && <Badge variant="outline">Défaut</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                1 USD ={" "}
                {rateToUnitsPerUsd(c.rateToUsd).toLocaleString("fr-FR", {
                  maximumFractionDigits: 6,
                })}{" "}
                {c.code}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.code !== displayCode && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await setDisplayCurrencyAction(c.code);
                      if (res.error) toast.error(res.error);
                      else toast.success(res.success);
                      router.refresh();
                    })
                  }
                >
                  Afficher en {c.code}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                aria-label={`Modifier la devise ${c.code}`}
                onClick={() => setEditing(c)}
              >
                Modifier
              </Button>
              {c.code !== "USD" && (
                <DeleteButton
                  ariaLabel={`Supprimer la devise ${c.code}`}
                  confirmMessage={`Supprimer la devise ${c.code} ?`}
                  action={() => deleteCurrencyAction(c.id)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
