import { ExternalLink, LogOut } from "lucide-react";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "./actions";
import { AdminNav, AdminTabBar } from "./AdminNav";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Phones and tablets: compact top bar + bottom tab bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
        <div className="py-3">
          <Logo href="/admin" />
        </div>
        <div className="flex items-center gap-1">
          <a href="/" target="_blank" className="btn-ghost px-2.5" aria-label="Voir la page publique">
            <ExternalLink className="size-4" />
          </a>
          <form action={logoutAction}>
            <button className="btn-ghost px-2.5" aria-label="Déconnexion">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </header>
      <AdminTabBar />

      {/* Computers: sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 py-6">
          <Logo href="/admin" />
        </div>
        <div className="flex-1 px-3 pb-3">
          <AdminNav />
        </div>
        <div className="space-y-1 border-t border-line p-3">
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-mist"
          >
            <ExternalLink className="size-4" /> Voir la page publique
          </a>
          <form action={logoutAction}>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-mist">
              <LogOut className="size-4" /> Déconnexion
            </button>
          </form>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
