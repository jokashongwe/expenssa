"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "expenssa-install-dismissed";

/** Invite d'installation de la PWA (Chrome/Edge/Android), masquable. */
export function PwaInstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {}
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!event) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setEvent(null);
  }

  async function install() {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    setEvent(null);
  }

  return (
    <div
      role="region"
      aria-label="Installer l'application"
      className="mb-4 flex items-center gap-3 rounded-lg border border-tint-border bg-tint px-3 py-2 text-sm text-tint-foreground"
    >
      <Download className="size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1">
        Installez Expenssa sur votre appareil pour y accéder plus vite.
      </p>
      <Button size="sm" onClick={install}>
        Installer
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Ne plus afficher cette invitation"
        onClick={dismiss}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
