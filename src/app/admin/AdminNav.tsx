"use client";

import { CalendarClock, LayoutDashboard, Layers, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Rendez-vous", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/evenements", label: "Types de RDV", icon: Layers },
  { href: "/admin/disponibilites", label: "Horaires", icon: CalendarClock },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:px-0">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 lg:gap-3 lg:py-2.5 text-sm font-medium transition ${
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
