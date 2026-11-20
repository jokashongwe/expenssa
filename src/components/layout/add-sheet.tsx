"use client";

import Link from "next/link";
import {
  ChevronRight,
  HandCoins,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const ACTIONS = [
  {
    href: "/transactions?new=expense",
    label: "Une dépense",
    hint: "Courses, transport, loyer…",
    icon: TrendingDown,
  },
  {
    href: "/transactions?new=income",
    label: "Un revenu reçu",
    hint: "Salaire, vente, aide reçue…",
    icon: TrendingUp,
  },
  {
    href: "/income?new=1",
    label: "Une source de revenu",
    hint: "Ce que vous gagnez chaque mois ou chaque année",
    icon: HandCoins,
  },
  {
    href: "/budgets?new=1",
    label: "Un budget",
    hint: "Fixer une limite pour une catégorie",
    icon: Wallet,
  },
  {
    href: "/savings?new=1",
    label: "Un objectif d'épargne",
    hint: "Maison, imprévus, voyage, études…",
    icon: PiggyBank,
  },
] as const;

/** Feuille « Que voulez-vous ajouter ? » ouverte par le bouton + central. */
export function AddSheet({
  open,
  onOpenChange,
  side = "bottom",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "bottom" | "right";
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={side === "bottom" ? "rounded-t-3xl p-4" : "p-4"}
      >
        <SheetHeader className="mb-2 px-0 text-left">
          <SheetTitle className="text-xl">Que voulez-vous ajouter ?</SheetTitle>
          <SheetDescription>
            Choisissez, on vous guide pas à pas.
          </SheetDescription>
        </SheetHeader>
        <ul className="flex flex-col gap-2">
          {ACTIONS.map(({ href, label, hint, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tint text-primary"
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {hint}
                  </span>
                </span>
                <ChevronRight
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
