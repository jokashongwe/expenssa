"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Pencil, Plus, Receipt, Search, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
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

type Filters = {
  type?: string;
  categoryId?: string;
  month?: string;
  q?: string;
  sort: string;
};

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm";

/** Normalise « 1 234,50 » → « 1234.50 » pour le serveur. */
function normalizeAmount(raw: string) {
  return raw.replace(/\s/g, "").replace(",", ".");
}

function TransactionForm({
  editing,
  categories,
  currencies,
  onDone,
}: {
  editing: Tx | null;
  categories: Category[];
  currencies: Currency[];
  onDone: () => void;
}) {
  const defaultCurrency =
    currencies.find((c) => c.isDefault) ?? currencies[0];
  const [type, setType] = useState<"income" | "expense">(
    editing?.type ?? "expense"
  );
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "");
  const [amount, setAmount] = useState(
    editing ? String(editing.amount).replace(".", ",") : ""
  );

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  function changeType(next: "income" | "expense") {
    setType(next);
    const current = categories.find((c) => c.id === categoryId);
    if (current && current.type !== next) setCategoryId("");
  }

  return (
    <ActionForm
      action={editing ? updateTransactionAction : createTransactionAction}
      className="space-y-3"
      onSuccess={onDone}
    >
      {editing && <input type="hidden" name="id" value={editing.id} />}

      <div
        role="radiogroup"
        aria-label="Type de transaction"
        className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
      >
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => changeType(t)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              type === t
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "expense" ? "Dépense" : "Revenu"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tx-category">Catégorie</Label>
        <select
          id="tx-category"
          name="categoryId"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={selectClass}
        >
          <option value="" disabled>
            Choisir…
          </option>
          {visibleCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {visibleCategories.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucune catégorie de ce type.{" "}
            <Link href="/categories" className="underline">
              En créer une
            </Link>
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="tx-amount">Montant</Label>
          <Input
            id="tx-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            pattern="[0-9\s]*[.,]?[0-9]*"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input type="hidden" name="amount" value={normalizeAmount(amount)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tx-currency">Devise</Label>
          <select
            id="tx-currency"
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
        <Label htmlFor="tx-date">Date</Label>
        <Input
          id="tx-date"
          name="date"
          type="date"
          required
          defaultValue={editing?.date ?? new Date().toISOString().slice(0, 10)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tx-note">Note</Label>
        <Textarea
          id="tx-note"
          name="note"
          rows={2}
          defaultValue={editing?.note ?? ""}
        />
      </div>
      <Button type="submit" className="w-full">
        Enregistrer
      </Button>
    </ActionForm>
  );
}

/** Total net par devise pour une journée, ex. « +1 200 USD · -50 000 CDF ». */
function dayNet(items: Tx[]) {
  const byCurrency = new Map<string, number>();
  for (const t of items) {
    const v = t.type === "income" ? t.amount : -t.amount;
    byCurrency.set(t.currencyCode, (byCurrency.get(t.currencyCode) ?? 0) + v);
  }
  return [...byCurrency.entries()].map(([code, v]) => ({ code, v }));
}

export function TransactionsClient({
  transactions,
  total,
  hasMore,
  pageSize,
  limit,
  categories,
  currencies,
  filters,
  openNew = false,
}: {
  transactions: Tx[];
  total: number;
  hasMore: boolean;
  pageSize: number;
  limit: number;
  categories: Category[];
  currencies: Currency[];
  filters: Filters;
  openNew?: boolean;
}) {
  const router = useRouter();
  const [navigating, startNav] = useTransition();
  const [open, setOpen] = useState(openNew);
  const [editing, setEditing] = useState<Tx | null>(null);
  const [search, setSearch] = useState(filters.q ?? "");
  const firstRender = useRef(true);

  function hrefFor(next: Partial<Record<keyof Filters | "limit", string>>) {
    const merged: Record<string, string | undefined> = {
      type: filters.type,
      categoryId: filters.categoryId,
      month: filters.month,
      q: filters.q,
      sort: filters.sort === "date_desc" ? undefined : filters.sort,
      ...next,
    };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const qs = sp.toString();
    return qs ? `/transactions?${qs}` : "/transactions";
  }

  function go(next: Parameters<typeof hrefFor>[0]) {
    startNav(() => router.replace(hrefFor(next)));
  }

  // Recherche avec délai pour éviter une requête à chaque frappe
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      if ((filters.q ?? "") !== search.trim()) go({ q: search.trim() });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const grouped = filters.sort !== "amount_desc";
  const groups = useMemo(() => {
    if (!grouped) return [{ date: "", items: transactions }];
    const map = new Map<string, Tx[]>();
    for (const t of transactions) {
      const list = map.get(t.date) ?? [];
      list.push(t);
      map.set(t.date, list);
    }
    return [...map.entries()].map(([date, items]) => ({ date, items }));
  }, [transactions, grouped]);

  const hasFilters = !!(
    filters.type ||
    filters.categoryId ||
    filters.month ||
    filters.q
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-3xl font-medium">Transactions</h1>
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
            <TransactionForm
              key={editing?.id ?? "new"}
              editing={editing}
              categories={categories}
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

      <div className="space-y-3" aria-busy={navigating}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Rechercher une transaction"
            placeholder="Rechercher (note, catégorie)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              [undefined, "Toutes"],
              ["income", "Revenus"],
              ["expense", "Dépenses"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={label}
              type="button"
              size="sm"
              variant={filters.type === value ? "default" : "outline"}
              aria-pressed={filters.type === value}
              onClick={() => go({ type: value ?? "" })}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <Label htmlFor="f-category" className="sr-only">
              Catégorie
            </Label>
            <select
              id="f-category"
              className={selectClass}
              value={filters.categoryId ?? ""}
              onChange={(e) => go({ categoryId: e.target.value })}
            >
              <option value="">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Label htmlFor="f-month" className="sr-only">
              Mois
            </Label>
            <Input
              id="f-month"
              type="month"
              value={filters.month ?? ""}
              onChange={(e) => go({ month: e.target.value })}
            />
            {filters.month ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={() => go({ month: "" })}
              >
                Tous
              </Button>
            ) : null}
          </div>
          <div>
            <Label htmlFor="f-sort" className="sr-only">
              Tri
            </Label>
            <select
              id="f-sort"
              className={selectClass}
              value={filters.sort}
              onChange={(e) => go({ sort: e.target.value })}
            >
              <option value="date_desc">Plus récentes d&apos;abord</option>
              <option value="date_asc">Plus anciennes d&apos;abord</option>
              <option value="amount_desc">Montant décroissant</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span aria-live="polite">
            {total} transaction{total > 1 ? "s" : ""}
            {navigating ? " · mise à jour…" : ""}
          </span>
          {hasFilters ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => {
                setSearch("");
                startNav(() => router.replace("/transactions"));
              }}
            >
              Réinitialiser les filtres
            </Button>
          ) : null}
        </div>
      </div>

      <div
        className={`space-y-4 transition-opacity ${navigating ? "opacity-60" : ""}`}
      >
        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={hasFilters ? "Aucun résultat" : "Aucune transaction"}
            description={
              hasFilters
                ? "Aucune transaction ne correspond à ces filtres."
                : "Ajoutez votre premier revenu ou dépense avec le bouton ci-dessus."
            }
          />
        ) : (
          groups.map((g) => (
            <section key={g.date || "all"} className="space-y-2">
              {grouped ? (
                <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
                  <h2 className="text-sm font-medium capitalize">
                    {formatDateFr(g.date)}
                  </h2>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {dayNet(g.items).map(({ code, v }, i) => (
                      <span key={code}>
                        {i > 0 ? " · " : ""}
                        {v >= 0 ? "+" : "-"}
                        {formatMoney(Math.abs(v), code)}
                      </span>
                    ))}
                  </p>
                </div>
              ) : null}
              {g.items.map((tx) => {
                const ctx = `${tx.categoryName} du ${formatDateFr(tx.date)}`;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/80 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: tx.categoryColor }}
                          aria-hidden
                        />
                        <p className="font-medium">{tx.categoryName}</p>
                        <Badge variant="outline">
                          {tx.type === "income" ? "Revenu" : "Dépense"}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {grouped ? "" : `${formatDateFr(tx.date)}`}
                        {!grouped && tx.note ? " · " : ""}
                        {tx.note}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span
                        className={`mr-1 tabular-nums font-medium ${
                          tx.type === "income"
                            ? "text-income"
                            : "text-expense"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatMoney(tx.amount, tx.currencyCode)}
                      </span>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Modifier ${ctx}`}
                        onClick={() => setEditing(tx)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <DeleteButton
                        label={`Supprimer ${ctx}`}
                        icon={<Trash2 className="size-3.5" />}
                        confirmMessage={`Supprimer la transaction « ${ctx} » ?`}
                        action={() => deleteTransactionAction(tx.id)}
                        onDone={() => router.refresh()}
                      />
                    </div>
                  </div>
                );
              })}
            </section>
          ))
        )}

        {hasMore ? (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              disabled={navigating}
              onClick={() => go({ limit: String(limit + pageSize) })}
            >
              Voir plus ({total - transactions.length} restantes)
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
