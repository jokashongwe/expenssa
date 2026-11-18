"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-2xl font-medium">Une erreur est survenue</h1>
      <p className="text-sm text-muted-foreground">
        Impossible de charger cette page. Vérifiez votre connexion puis
        réessayez.
      </p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
