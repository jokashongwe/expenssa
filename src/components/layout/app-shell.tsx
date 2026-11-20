"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  PiggyBank,
  Wallet,
  HandCoins,
  Coins,
  Users,
  Ellipsis,
  Plus,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { AddSheet } from "@/components/layout/add-sheet";
import { BrandLogo } from "@/components/brand/logo";
import {
  SpaceSwitcher,
  type SwitcherSpace,
} from "@/components/layout/space-switcher";
import { PwaInstallPrompt } from "@/components/pwa-install";
import { FontSizeControl } from "@/components/layout/font-size-control";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LogoutButton } from "@/components/layout/logout-button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavItem = {
  href: string;
  label: string;
  short?: string;
  icon: typeof Users;
};

const navHome: NavItem = { href: "/dashboard", label: "Accueil", icon: LayoutDashboard };
const navSavings: NavItem = { href: "/savings", label: "Objectifs d'épargne", short: "Objectifs", icon: PiggyBank };
const navBudgets: NavItem = { href: "/budgets", label: "Budgets", short: "Budget", icon: Wallet };
const navTransactions: NavItem = { href: "/transactions", label: "Transactions", icon: ArrowLeftRight };
const navIncome: NavItem = { href: "/income", label: "Mes revenus", icon: HandCoins };
const navAnalysis: NavItem = { href: "/analysis", label: "Analyse", icon: BarChart3 };
const navCategories: NavItem = { href: "/categories", label: "Catégories", icon: Tags };

const mainNav: NavItem[] = [
  navHome,
  navTransactions,
  navBudgets,
  navSavings,
  navIncome,
  navAnalysis,
  navCategories,
];

const settingsNav: NavItem[] = [
  { href: "/settings/currencies", label: "Devises", icon: Coins },
  { href: "/settings/sharing", label: "Partage", icon: Users },
];

// Barre du bas (mobile) : Accueil · Objectifs · [+] · Budget · Plus
const tabsLeft = [navHome, navSavings];
const tabsRight = [navBudgets];
const moreNav = [
  navTransactions,
  navIncome,
  navAnalysis,
  navCategories,
  ...settingsNav,
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function NavGroup({
  title,
  items,
  onNavigate,
}: {
  title?: string;
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-1">
      {title ? (
        <p className="px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      ) : null}
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function SidebarNav() {
  return (
    <nav aria-label="Navigation principale" className="flex flex-col">
      <NavGroup items={mainNav} />
      <NavGroup title="Paramètres" items={settingsNav} />
    </nav>
  );
}

function initials(name: string) {
  return (
    name
      .split(/[\s·]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

function UserBadge({ userName }: { userName: string }) {
  return (
    <div className="flex items-center gap-2 px-2">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
      >
        {initials(userName)}
      </span>
      <p className="truncate text-sm text-muted-foreground">{userName}</p>
    </div>
  );
}

function BottomTabs({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const moreActive = moreNav.some((i) => isActive(pathname, i.href));

  const base =
    "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[0.6875rem] font-medium outline-none transition-colors focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

  const renderTab = (item: NavItem) => {
    const active = isActive(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(base, active ? "text-primary" : "text-muted-foreground")}
      >
        <Icon className="size-5" aria-hidden />
        <span className="truncate">{item.short ?? item.label}</span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border/60 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {tabsLeft.map(renderTab)}
      <div className="flex flex-1 items-start justify-center">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          aria-label="Ajouter"
          className="-mt-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg outline-none ring-4 ring-background transition-transform focus-visible:ring-ring active:scale-95"
        >
          <Plus className="size-6" aria-hidden />
        </button>
      </div>
      {tabsRight.map(renderTab)}
      <AddSheet open={addOpen} onOpenChange={setAddOpen} />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className={cn(
            base,
            moreActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Ellipsis className="size-5" aria-hidden />
          <span>Plus</span>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl p-4">
          <SheetHeader className="mb-2 px-0 text-left">
            <SheetTitle className="sr-only">Plus d&apos;options</SheetTitle>
            <UserBadge userName={userName} />
          </SheetHeader>
          <nav aria-label="Autres sections" className="flex flex-col">
            <NavGroup items={moreNav} onNavigate={() => setOpen(false)} />
          </nav>
          <div className="mt-4 space-y-3 border-t border-border/60 pt-3">
            <ThemeToggle />
            <FontSizeControl />
            <LogoutButton />
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

export type ShellSpaces = {
  activeOwnerId: string;
  ownUserId: string;
  ownName: string;
  spaces: SwitcherSpace[];
};

export function AppShell({
  children,
  userName,
  spaces,
}: {
  children: React.ReactNode;
  userName: string;
  spaces: ShellSpaces;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="min-h-dvh app-bg">
      <div className="mx-auto flex min-h-dvh max-w-6xl">
        <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-card/70 p-4 backdrop-blur md:flex md:flex-col">
          <div className="mb-8 px-1">
            <Link href="/dashboard" className="block">
              <BrandLogo size="sm" priority />
            </Link>
          </div>
          <SpaceSwitcher {...spaces} className="mb-4" />
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-4" aria-hidden />
            Ajouter
          </button>
          <SidebarNav />
          <div className="mt-auto space-y-3 border-t border-border/60 pt-4">
            <UserBadge userName={userName} />
            <ThemeToggle />
            <FontSizeControl />
            <LogoutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-card/80 px-4 py-3 backdrop-blur md:hidden">
            <Link href="/dashboard" aria-label="Accueil">
              <BrandLogo size="sm" />
            </Link>
            <div className="ml-auto min-w-0 max-w-[60%] flex-1">
              <SpaceSwitcher {...spaces} />
            </div>
          </header>
          <main className="flex-1 p-4 pb-28 md:p-8 md:pb-8">
            <PwaInstallPrompt />
            {children}
          </main>
        </div>
      </div>

      <AddSheet open={addOpen} onOpenChange={setAddOpen} side="right" />
      <BottomTabs userName={userName} />
    </div>
  );
}
