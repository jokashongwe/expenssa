"use client";

import { LogOut } from "lucide-react";

/**
 * Déconnexion via form HTML natif → POST /api/logout
 * (évite les échecs silencieux des Server Actions + Base UI Button).
 */
export function LogoutButton({ className }: { className?: string }) {
  return (
    <form method="POST" action="/api/logout" className="w-full">
      <button
        type="submit"
        className={
          className ??
          "inline-flex h-8 w-full items-center justify-start gap-2 rounded-lg px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        }
      >
        <LogOut className="size-4 shrink-0" />
        Déconnexion
      </button>
    </form>
  );
}
