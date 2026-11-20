"use client";

import { useTheme, type FontScale } from "@/components/theme-provider";

const options: { value: FontScale; label: string; text: string; size: string }[] =
  [
    { value: "normal", label: "Texte normal", text: "A", size: "text-xs" },
    { value: "large", label: "Texte grand", text: "A", size: "text-sm" },
    { value: "xlarge", label: "Texte très grand", text: "A", size: "text-base" },
  ];

/** Choix de la taille du texte (100 % / 112,5 % / 125 %). */
export function FontSizeControl() {
  const { fontScale, setFontScale } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Taille du texte"
      className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
    >
      {options.map(({ value, label, text, size }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={fontScale === value}
          aria-label={label}
          title={label}
          onClick={() => setFontScale(value)}
          className={`flex items-center justify-center rounded-md py-1 font-medium transition-colors ${size} ${
            fontScale === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
