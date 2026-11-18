export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Chargement">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
