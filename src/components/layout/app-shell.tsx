"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  PiggyBank,
  Wallet,
  Coins,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const nav = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/categories", label: "Catégories", icon: Tags },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/savings", label: "Épargne", icon: PiggyBank },
  { href: "/settings/currencies", label: "Devises", icon: Coins },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh app-bg">
      <div className="mx-auto flex min-h-dvh max-w-6xl">
        <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-card/70 p-4 backdrop-blur md:flex md:flex-col">
          <div className="mb-8 px-2">
            <Link href="/dashboard" className="block">
              <p className="font-sans text-2xl font-medium tracking-tight text-teal-800">
                Expenssa
              </p>
              <p className="text-xs text-muted-foreground">Gestion de budget</p>
            </Link>
          </div>
          <NavLinks />
          <div className="mt-auto space-y-3 border-t border-border/60 pt-4">
            <p className="truncate px-2 text-sm text-muted-foreground">
              {userName}
            </p>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <LogOut className="size-4" />
                Déconnexion
              </Button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-card/80 px-4 py-3 backdrop-blur md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button variant="outline" size="icon" aria-label="Menu" />
                }
              >
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                <SheetHeader className="mb-4 px-0 text-left">
                  <SheetTitle className="font-sans text-teal-800">
                    Expenssa
                  </SheetTitle>
                </SheetHeader>
                <NavLinks onNavigate={() => setOpen(false)} />
                <form action={logoutAction} className="mt-6">
                  <Button
                    type="submit"
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <LogOut className="size-4" />
                    Déconnexion
                  </Button>
                </form>
              </SheetContent>
            </Sheet>
            <p className="font-sans text-lg font-medium text-teal-800">
              Expenssa
            </p>
          </header>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
