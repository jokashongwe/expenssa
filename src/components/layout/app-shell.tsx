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
  Users,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/layout/logout-button";
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
  { href: "/settings/sharing", label: "Partage", icon: Users },
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
          <div className="mb-8 px-1">
            <Link href="/dashboard" className="block">
              <BrandLogo size="sm" priority />
            </Link>
          </div>
          <NavLinks />
          <div className="mt-auto space-y-3 border-t border-border/60 pt-4">
            <p className="truncate px-2 text-sm text-muted-foreground">
              {userName}
            </p>
            <LogoutButton />
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
                  <SheetTitle className="sr-only">Expenssa</SheetTitle>
                  <BrandLogo size="sm" />
                </SheetHeader>
                <NavLinks onNavigate={() => setOpen(false)} />
                <div className="mt-6">
                  <LogoutButton />
                </div>
              </SheetContent>
            </Sheet>
            <BrandLogo size="sm" />
          </header>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
