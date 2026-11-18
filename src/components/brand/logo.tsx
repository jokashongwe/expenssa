import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { height: 64, width: 210 },
  md: { height: 72, width: 320 },
  lg: { height: 96, width: 480 },
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
      className={cn(
        // Le logo a du texte vert foncé : pastille claire en mode sombre
        "h-auto w-auto object-contain object-left dark:rounded-xl dark:bg-white/95 dark:px-2",
        className
      )}
      style={{ height: dim.height, width: "auto" }}
    />
  );
}
