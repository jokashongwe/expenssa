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
  Ellipsis,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/logo";
import {
  SpaceSwitcher,
  type SwitcherSpace,
} from "@/components/layout/space-switcher";
import { PwaInstallPrompt } from "@/components/pwa-install";
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

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", short: "Accueil", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/savings", label: "Épargne", icon: PiggyBank },
  { href: "/categories", label: "Catégories", icon: Tags },
];

const settingsNav: NavItem[] = [
  { href: "/settings/currencies", label: "Devises", icon: Coins },
  { href: "/settings/sharing", label: "Partage", icon: Users },
];

// Onglets du bas (mobile) : 4 sections principales + « Plus »
const tabs = mainNav.slice(0, 4);
const moreNav = [mainNav[4], ...settingsNav];

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
  const moreActive = moreNav.some((i) => isActive(pathname, i.href));

  const base =
    "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-medium outline-none transition-colors focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border/60 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {tabs.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              base,
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" aria-hidden />
            <span className="truncate">{item.short ?? item.label}</span>
          </Link>
        );
      })}
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
  const pathname = usePathname();
  const showFab = !pathname.startsWith("/transactions");

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
          <SidebarNav />
          <div className="mt-auto space-y-3 border-t border-border/60 pt-4">
            <UserBadge userName={userName} />
            <ThemeToggle />
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

      {showFab ? (
        <Link
          href="/transactions?new=1"
          aria-label="Ajouter une transaction"
          className="fixed bottom-20 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:hidden"
        >
          <Plus className="size-6" aria-hidden />
        </Link>
      ) : null}

      <BottomTabs userName={userName} />
    </div>
  );
}
