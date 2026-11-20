"use client";

import { ArrowLeft } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Step = { title: string; content: React.ReactNode };

/**
 * Parcours en étapes à placer DANS un <ActionForm>.
 * Toutes les étapes restent montées (masquées) : les champs de chaque étape
 * sont donc envoyés avec le formulaire. Chaque étape est validée (attributs
 * `required`, `min`…) avant de passer à la suivante.
 */
export function Stepper({
  steps,
  submitLabel,
  pending,
  className,
}: {
  steps: Step[];
  submitLabel: string;
  pending?: boolean;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const last = index === steps.length - 1;

  function stepIsValid(i: number) {
    const fields = refs.current[i]?.querySelectorAll<HTMLInputElement>(
      "input, select, textarea"
    );
    if (!fields) return true;
    for (const f of Array.from(fields)) {
      if (!f.reportValidity()) return false;
    }
    return true;
  }

  function next() {
    if (stepIsValid(index)) setIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  return (
    <div
      className={cn("space-y-4", className)}
      onKeyDown={(e) => {
        // Entrée dans un champ : étape suivante au lieu d'envoyer trop tôt
        if (
          e.key === "Enter" &&
          !last &&
          e.target instanceof HTMLInputElement
        ) {
          e.preventDefault();
          next();
        }
      }}
    >
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Étape {index + 1} sur {steps.length}
        </p>
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={index + 1}
          aria-label="Progression"
        >
          {steps.map((s, i) => (
            <span
              key={s.title}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= index ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {steps.map((s, i) => (
        <div
          key={s.title}
          ref={(el) => {
            refs.current[i] = el;
          }}
          hidden={i !== index}
          className="space-y-3"
        >
          <h3 className="text-lg font-medium">{s.title}</h3>
          {s.content}
        </div>
      ))}

      <div className="flex items-center gap-2 pt-1">
        {index > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIndex((i) => i - 1)}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Retour
          </Button>
        ) : null}
        {last ? (
          <Button type="submit" className="flex-1" disabled={pending}>
            {submitLabel}
          </Button>
        ) : (
          <Button type="button" className="flex-1" onClick={next}>
            Continuer
          </Button>
        )}
      </div>
    </div>
  );
}
