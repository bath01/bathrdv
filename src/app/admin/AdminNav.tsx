"use client";

import { CalendarClock, LayoutDashboard, Layers, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Rendez-vous", short: "RDV", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", short: "Clients", icon: Users },
  { href: "/admin/evenements", label: "Types de RDV", short: "Types", icon: Layers },
  { href: "/admin/disponibilites", label: "Horaires", short: "Horaires", icon: CalendarClock },
  { href: "/admin/parametres", label: "Paramètres", short: "Réglages", icon: Settings },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
}

/** Sidebar links, computers only (from 1024px). */
export function AdminNav() {
  const isActive = useActive();
  return (
    <nav className="flex flex-col gap-1" aria-label="Menu admin">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-blue-soft text-blue" : "text-slate hover:bg-mist"
            }`}
          >
            <Icon className="size-4.5" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bottom tab bar, phones and tablets (below 1024px): all 5 sections always visible. */
export function AdminTabBar() {
  const isActive = useActive();
  return (
    <nav
      aria-label="Menu admin"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-xl grid-cols-5">
        {NAV.map(({ href, short, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
                active ? "text-blue" : "text-muted active:text-ink"
              }`}
            >
              <span className={`grid h-7 w-12 place-items-center rounded-full ${active ? "bg-blue-soft" : ""}`}>
                <Icon className="size-5" />
              </span>
              {short}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
