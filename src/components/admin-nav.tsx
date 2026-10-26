"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, LifeBuoy, ScrollText, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Rol } from "@/server/auth-admin";

const items = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, roles: null },
  {
    href: "/admin/soporte",
    label: "Soporte",
    icon: LifeBuoy,
    roles: ["admin", "soporte"] as const,
  },
  {
    href: "/admin/sistema",
    label: "Sistema",
    icon: Activity,
    roles: ["admin", "soporte"] as const,
  },
  {
    href: "/admin/auditoria",
    label: "Auditoría",
    icon: ScrollText,
    roles: ["admin"] as const,
  },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    icon: Settings2,
    roles: ["admin"] as const,
  },
];

export function AdminNav({
  rol,
  horizontal = false,
}: {
  rol: Rol;
  horizontal?: boolean;
}) {
  const pathname = usePathname();

  // Ocultar lo que el rol no puede abrir. Esconderlo es solo cortesía:
  // la puerta real la cierra `requerirAdmin()` en cada página.
  const visibles = items.filter(
    (i) => !i.roles || (i.roles as readonly string[]).includes(rol),
  );

  return (
    <nav
      aria-label="Secciones del panel"
      className={cn(
        horizontal ? "panel flex gap-1 overflow-x-auto p-1.5" : "space-y-1",
      )}
    >
      {visibles.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-2xl px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200",
              horizontal ? "shrink-0" : "min-h-12",
              active
                ? "bg-honey-300 text-ink-700"
                : "text-muted hover:text-foreground hover:bg-white/50 dark:hover:bg-white/8",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
