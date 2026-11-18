"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ActionState } from "@/lib/actions/auth";

export function DeleteButton({
  action,
  label = "Supprimer",
  confirmMessage = "Confirmer la suppression ?",
  icon,
  onDone,
  ariaLabel,
}: {
  action: () => Promise<ActionState>;
  label?: string;
  confirmMessage?: string;
  /** Affiche un bouton icône discret (label devient aria-label). */
  icon?: React.ReactNode;
  onDone?: () => void;
  /** Nom accessible précis (ex. « Supprimer le budget Transport »). */
  ariaLabel?: string;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={icon ? "ghost" : "destructive"}
        size={icon ? "icon-sm" : "sm"}
        disabled={pending}
        aria-label={ariaLabel ?? (icon ? label : undefined)}
        onClick={() => setOpen(true)}
      >
        {icon ?? label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Confirmation</DialogTitle>
            <DialogDescription>{confirmMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                start(async () => {
                  const res = await action();
                  if (res.error) toast.error(res.error);
                  else if (res.success) toast.success(res.success);
                  onDone?.();
                });
              }}
            >
              {label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
