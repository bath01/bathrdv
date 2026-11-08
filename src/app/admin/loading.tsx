

// Inside the admin, keep the sidebar and show a skeleton of the page.
export default function AdminLoading() {
  return (
    <div role="status" aria-label="Chargement" className="space-y-6">
      <div className="h-9 w-56 animate-pulse rounded-xl bg-line/70" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-line/50" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-line/40" />
    </div>
  );
}
