"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/actions/auth";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  onSuccess?: () => void;
};

export function ActionForm({ action, children, className, onSuccess }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className={className} data-pending={pending}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
