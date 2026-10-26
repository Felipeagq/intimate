"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Inbox,
  LifeBuoy,
  ScrollText,
  Settings2,
} from "lucide-react";
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
    href: "/admin/bandeja",
    label: "Bandeja",
    icon: Inbox,
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

/**
 * Lista de secciones del panel. Es siempre vertical: la usan la barra
 * lateral en escritorio y el cajón de hamburguesa en teléfono, así que no
 * hay ninguna versión horizontal que obligue a desplazarse hacia los lados.
 */
export function AdminNav({
  rol,
  nuevos = 0,
  alNavegar,
}: {
  rol: Rol;
  /** Mensajes nuevos en la bandeja, para el contador. */
  nuevos?: number;
  /** El cajón móvil lo usa para cerrarse al elegir una sección. */
  alNavegar?: () => void;
}) {
  const pathname = usePathname();

  // Ocultar lo que el rol no puede abrir. Esconderlo es solo cortesía:
  // la puerta real la cierra `requerirAdmin()` en cada página.
  const visibles = items.filter(
    (i) => !i.roles || (i.roles as readonly string[]).includes(rol),
  );

  return (
    <nav aria-label="Secciones del panel" className="space-y-1">
      {visibles.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin" ? pathname === href : pathname.startsWith(href);
        const contador = href === "/admin/bandeja" ? nuevos : 0;

        return (
          <Link
            key={href}
            href={href}
            onClick={alNavegar}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-12 cursor-pointer items-center gap-2.5 rounded-2xl px-4 text-sm font-medium transition-colors duration-200",
              active
                ? "bg-honey-300 text-ink-700"
                : "text-muted hover:text-foreground hover:bg-white/50 dark:hover:bg-white/8",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
            {contador > 0 && (
              <span
                className={cn(
                  "ml-auto min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums",
                  active
                    ? "bg-ink-700 text-cream-100"
                    : "bg-honey-300 text-ink-700",
                )}
              >
                {contador}
                <span className="sr-only">
                  {contador === 1 ? " mensaje nuevo" : " mensajes nuevos"}
                </span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
