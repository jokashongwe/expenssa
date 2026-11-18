import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  bordered = true,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 p-6 text-center ${
        bordered ? "rounded-xl border border-dashed" : ""
      }`}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      ) : null}
      {actionLabel && actionHref ? (
        <Button render={<Link href={actionHref} />} size="sm" variant="outline">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
