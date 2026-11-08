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
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="border-b border-line bg-surface md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-4 md:px-5 md:py-6">
          <Logo href="/admin" />
          <form action={logoutAction} className="md:hidden">
            <button className="btn-ghost" aria-label="Déconnexion">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
        <div className="px-3 pb-3 md:flex-1">
          <AdminNav />
        </div>
        <div className="hidden space-y-1 border-t border-line p-3 md:block">
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
      <main className="w-full max-w-5xl flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
