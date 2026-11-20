"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
export type FontScale = "normal" | "large" | "xlarge";

const STORAGE_KEY = "expenssa-theme";
const FONT_KEY = "expenssa-font-scale";

/** Taille de police racine (Tailwind est en rem : tout le texte suit). */
export const FONT_SCALES: Record<FontScale, string> = {
  normal: "100%",
  large: "112.5%",
  xlarge: "125%",
};

type Ctx = {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (p: ThemePreference) => void;
  fontScale: FontScale;
  setFontScale: (s: FontScale) => void;
};

const ThemeContext = createContext<Ctx>({
  preference: "system",
  resolved: "light",
  setPreference: () => {},
  fontScale: "normal",
  setFontScale: () => {},
});

/** Script exécuté avant l'hydratation pour éviter un flash (thème et taille de texte). */
export const themeInitScript = `(function(){try{var p=localStorage.getItem('${STORAGE_KEY}');var d=p==='dark'||((!p||p==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);var c=document.documentElement.classList;d?c.add('dark'):c.remove('dark');var f=localStorage.getItem('${FONT_KEY}');var m=${JSON.stringify(FONT_SCALES)};if(f&&m[f])document.documentElement.style.fontSize=m[f];}catch(e){}})();`;

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPref] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  const apply = useCallback((p: ThemePreference) => {
    const dark = p === "dark" || (p === "system" && systemPrefersDark());
    document.documentElement.classList.toggle("dark", dark);
    setResolved(dark ? "dark" : "light");
    document
      .querySelectorAll('meta[name="theme-color"]:not([media])')
      .forEach((m) => m.remove());
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = dark ? "#0b1f1c" : "#0f766e";
    document.head.appendChild(meta);
  }, []);

  useEffect(() => {
    let stored: ThemePreference = "system";
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "light" || v === "dark" || v === "system") stored = v;
    } catch {}
    setPref(stored);
    apply(stored);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let current: ThemePreference = "system";
      try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === "light" || v === "dark") current = v;
      } catch {}
      if (current === "system") apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [apply]);

  const setPreference = useCallback(
    (p: ThemePreference) => {
      setPref(p);
      try {
        localStorage.setItem(STORAGE_KEY, p);
      } catch {}
      apply(p);
    },
    [apply]
  );

  const [fontScale, setScale] = useState<FontScale>("normal");

  useEffect(() => {
    try {
      const v = localStorage.getItem(FONT_KEY);
      if (v === "normal" || v === "large" || v === "xlarge") setScale(v);
    } catch {}
  }, []);

  const setFontScale = useCallback((s: FontScale) => {
    setScale(s);
    document.documentElement.style.fontSize = FONT_SCALES[s];
    try {
      localStorage.setItem(FONT_KEY, s);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference, fontScale, setFontScale }),
    [preference, resolved, setPreference, fontScale, setFontScale]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
