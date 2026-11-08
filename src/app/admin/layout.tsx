import { ExternalLink, LogOut } from "lucide-react";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "./actions";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0 lg:bg-surface">
        <div className="flex items-center justify-between px-4 py-3 lg:px-5 lg:py-6">
          <Logo href="/admin" />
          <form action={logoutAction} className="lg:hidden">
            <button className="btn-ghost" aria-label="Déconnexion">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
        <div className="px-3 pb-2 lg:flex-1 lg:pb-3">
          <AdminNav />
        </div>
        <div className="hidden space-y-1 border-t border-line p-3 lg:block">
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
      <main className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
