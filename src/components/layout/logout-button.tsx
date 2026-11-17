"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      className={className ?? "w-full justify-start gap-2"}
      disabled={pending}
      onClick={() => {
        start(async () => {
          await logoutAction();
          // Force la navigation hors zone authentifiée + purge cache client
          window.location.assign("/login");
          router.refresh();
        });
      }}
    >
      <LogOut className="size-4" />
      {pending ? "Déconnexion…" : "Déconnexion"}
    </Button>
  );
}
