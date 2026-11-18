import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function shift(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Navigation mois précédent / suivant (liens, rendu serveur). */
export function MonthPicker({
  month,
  currentMonth,
  label,
}: {
  month: string;
  currentMonth: string;
  label: string;
}) {
  const href = (ym: string) =>
    ym === currentMonth ? "/dashboard" : `/dashboard?month=${ym}`;
  const isCurrent = month === currentMonth;
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Période">
      <Button
        render={<Link href={href(shift(month, -1))} />}
        variant="outline"
        size="icon-sm"
        aria-label="Mois précédent"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-28 text-center text-sm font-medium capitalize">
        {label}
      </span>
      <Button
        render={<Link href={href(shift(month, 1))} />}
        variant="outline"
        size="icon-sm"
        aria-label="Mois suivant"
        aria-disabled={isCurrent}
        className={isCurrent ? "pointer-events-none opacity-40" : ""}
        tabIndex={isCurrent ? -1 : undefined}
      >
        <ChevronRight className="size-4" />
      </Button>
      {!isCurrent ? (
        <Button render={<Link href="/dashboard" />} variant="ghost" size="sm">
          Ce mois-ci
        </Button>
      ) : null}
    </div>
  );
}
