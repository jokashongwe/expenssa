import { cn } from "@/lib/utils";

export type RingTone = "good" | "watch" | "over" | "neutral";

const TONE: Record<RingTone, string> = {
  good: "stroke-primary",
  watch: "stroke-amber-500",
  over: "stroke-destructive",
  neutral: "stroke-muted-foreground",
};

/** Anneau de progression (SVG), valeur en % (0–100, bornée). */
export function ProgressRing({
  value,
  tone = "good",
  size = 120,
  stroke = 12,
  label,
  className,
  children,
}: {
  value: number;
  tone?: RingTone;
  size?: number;
  stroke?: number;
  /** Texte alternatif lu par les lecteurs d'écran */
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={cn("transition-[stroke-dashoffset]", TONE[tone])}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
