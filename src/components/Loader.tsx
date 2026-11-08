import Image from "next/image";

/** Branded loader: the logo icon inside a spinning blue swoosh ring. */
export function Loader({ label = "Chargement…", fullScreen = true }: { label?: string; fullScreen?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`grid place-items-center ${fullScreen ? "min-h-[70vh] w-full flex-1" : "py-16"}`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative grid size-24 place-items-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 animate-spin [animation-duration:1.1s]" aria-hidden>
            <defs>
              <linearGradient id="loader-ring" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="var(--slate)" stopOpacity="0.15" />
                <stop offset="1" stopColor="var(--blue-bright)" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--line)" strokeWidth="5" />
            <path d="M50 6a44 44 0 0 1 44 44" fill="none" stroke="url(#loader-ring)" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <Image src="/logo-icon.png" alt="" width={821} height={481} className="h-auto w-14 animate-pulse" priority />
        </div>
        <p className="text-sm font-medium text-muted">{label}</p>
      </div>
    </div>
  );
}

/** Thin animated bar at the top of the page while a route loads. */
export function TopBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-blue-soft" aria-hidden>
      <div className="h-full w-1/3 animate-[topbar_1s_ease-in-out_infinite] bg-gradient-to-r from-blue to-blue-bright" />
    </div>
  );
}
