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

const STORAGE_KEY = "expenssa-theme";

type Ctx = {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<Ctx>({
  preference: "system",
  resolved: "light",
  setPreference: () => {},
});

/** Script exécuté avant l'hydratation pour éviter un flash de thème clair. */
export const themeInitScript = `(function(){try{var p=localStorage.getItem('${STORAGE_KEY}');var d=p==='dark'||((!p||p==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);var c=document.documentElement.classList;d?c.add('dark'):c.remove('dark');}catch(e){}})();`;

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

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
