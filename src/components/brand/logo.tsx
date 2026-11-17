import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { height: 32, width: 140 },
  md: { height: 48, width: 210 },
  lg: { height: 72, width: 320 },
} as const;

export function BrandLogo({
  size = "md",
  className,
  priority = false,
}: {
  size?: keyof typeof sizes;
  className?: string;
  priority?: boolean;
}) {
  const dim = sizes[size];
  return (
    <Image
      src="/logo-expenssa-final.png"
      alt="Expenssa — Gérez votre budget, maîtrisez vos dépenses"
      height={dim.height}
      width={dim.width}
      priority={priority}
      className={cn("h-auto w-auto object-contain object-left", className)}
      style={{ height: dim.height, width: "auto" }}
    />
  );
}
