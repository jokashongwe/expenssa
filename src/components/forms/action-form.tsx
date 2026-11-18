"use client";

import { useActionState, useEffect, useId, useRef } from "react";
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
  const errorId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    form
      ?.querySelectorAll("[aria-invalid]")
      .forEach((el) => el.removeAttribute("aria-invalid"));
    if (state?.error) {
      toast.error(state.error);
      if (state.field && form) {
        const el = form.elements.namedItem(state.field);
        if (el instanceof HTMLElement) {
          el.setAttribute("aria-invalid", "true");
          el.setAttribute("aria-describedby", errorId);
          el.focus();
        }
      }
    }
    if (state?.success) {
      toast.success(state.success);
      onSuccess?.();
    }
  }, [state, onSuccess, errorId]);

  return (
    <form ref={formRef} action={formAction} className={className} data-pending={pending}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state?.error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
