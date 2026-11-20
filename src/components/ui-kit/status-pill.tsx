import { cn } from "@/lib/utils";
import type { RingTone } from "./progress-ring";

const STYLE: Record<RingTone, string> = {
  good: "border-tint-border bg-tint text-tint-foreground",
  watch: "border-warning-border bg-warning text-warning-foreground",
  over: "border-destructive/30 bg-destructive/10 text-destructive",
  neutral: "border-border bg-muted text-muted-foreground",
};

/** Pastille d'état courte (« Sur la bonne voie », « À surveiller »…). */
export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: RingTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STYLE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** État d'un budget selon le % consommé. */
export function budgetStatus(rawPercent: number): { tone: RingTone; label: string } {
  if (rawPercent > 100) return { tone: "over", label: "Dépassé" };
  if (rawPercent >= 80) return { tone: "watch", label: "À surveiller" };
  return { tone: "good", label: "Sur la bonne voie" };
}

/** État d'un objectif d'épargne selon son avancement par rapport au temps écoulé. */
export function savingsStatus(
  percent: number,
  expectedPercent: number
): { tone: RingTone; label: string } {
  if (percent >= 100) return { tone: "good", label: "Atteint" };
  if (percent + 10 < expectedPercent) {
    return { tone: "watch", label: "À rattraper" };
  }
  return { tone: "good", label: "Sur la bonne voie" };
}
