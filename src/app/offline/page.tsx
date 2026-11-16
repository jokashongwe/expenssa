import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="app-bg flex min-h-dvh items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="font-heading text-3xl font-semibold text-teal-800">
          Expenssa
        </p>
        <h1 className="mt-4 text-xl font-medium">Vous êtes hors ligne</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          L&apos;application a besoin d&apos;une connexion pour charger vos
          données. Réessayez dès que le réseau est de retour.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block text-sm font-medium text-teal-700 underline"
        >
          Réessayer
        </Link>
      </div>
    </div>
  );
}
