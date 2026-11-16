"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createTransactionAction,
  deleteTransactionAction,
  updateTransactionAction,
} from "@/lib/actions/transactions";
import { formatDateFr } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Category, Currency } from "@/lib/db/schema";

type Tx = {
  id: string;
  type: "income" | "expense";
  amount: number;
  note: string | null;
  date: string;
  categoryId: string;
  currencyId: string;
  categoryName: string;
  categoryColor: string;
  currencyCode: string;
};

export function TransactionsClient({
  transactions,
  categories,
  currencies,
  filters,
}: {
  transactions: Tx[];
  categories: Category[];
  currencies: Currency[];
  filters: { type?: string; categoryId?: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tx | null>(null);
  const defaultCurrency =
    currencies.find((c) => c.isDefault) ?? currencies[0];

  function buildHref(next: { type?: string; categoryId?: string }) {
    const sp = new URLSearchParams();
    const type = next.type ?? filters.type;
    const categoryId = next.categoryId ?? filters.categoryId;
    if (type) sp.set("type", type);
    if (categoryId) sp.set("categoryId", categoryId);
    const q = sp.toString();
    return q ? `/transactions?${q}` : "/transactions";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Revenus et dépenses multi-devises
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
                {editing ? "Modifier la transaction" : "Nouvelle transaction"}
              </DialogTitle>
            </DialogHeader>
            <ActionForm
              action={editing ? updateTransactionAction : createTransactionAction}
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
                      {c.name} ({c.type === "income" ? "revenu" : "dépense"})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant</Label>
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
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={
                    editing?.date ?? new Date().toISOString().slice(0, 10)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  name="note"
                  rows={2}
                  defaultValue={editing?.note ?? ""}
                />
              </div>
              <Button type="submit" className="w-full">
                Enregistrer
              </Button>
            </ActionForm>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          render={<Link href={buildHref({ type: undefined })} />}
          variant={!filters.type ? "default" : "outline"}
          size="sm"
        >
          Toutes
        </Button>
        <Button
          render={<Link href={buildHref({ type: "income" })} />}
          variant={filters.type === "income" ? "default" : "outline"}
          size="sm"
        >
          Revenus
        </Button>
        <Button
          render={<Link href={buildHref({ type: "expense" })} />}
          variant={filters.type === "expense" ? "default" : "outline"}
          size="sm"
        >
          Dépenses
        </Button>
        <select
          className="h-7 rounded-lg border border-input bg-background px-2 text-sm"
          value={filters.categoryId ?? ""}
          onChange={(e) => {
            router.push(
              buildHref({ categoryId: e.target.value || undefined })
            );
          }}
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {transactions.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aucune transaction. Ajoutez votre premier revenu ou dépense.
          </p>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/80 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: tx.categoryColor }}
                  />
                  <p className="font-medium">{tx.categoryName}</p>
                  <Badge variant="outline">
                    {tx.type === "income" ? "Revenu" : "Dépense"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateFr(tx.date)}
                  {tx.note ? ` · ${tx.note}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`tabular-nums font-semibold ${
                    tx.type === "income" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatMoney(tx.amount, tx.currencyCode)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(tx)}
                >
                  Modifier
                </Button>
                <DeleteButton
                  action={() => deleteTransactionAction(tx.id)}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
