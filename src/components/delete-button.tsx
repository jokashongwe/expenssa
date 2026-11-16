"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/actions/auth";

export function DeleteButton({
  action,
  label = "Supprimer",
  confirmMessage = "Confirmer la suppression ?",
}: {
  action: () => Promise<ActionState>;
  label?: string;
  confirmMessage?: string;
}) {
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmMessage)) return;
        start(async () => {
          const res = await action();
          if (res.error) toast.error(res.error);
          else if (res.success) toast.success(res.success);
        });
      }}
    >
      {label}
    </Button>
  );
}
