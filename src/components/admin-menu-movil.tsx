"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { LogoMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { CerrarSesionAdmin } from "@/components/cerrar-sesion-admin";
import type { Rol } from "@/server/auth-admin";

const TONO_ROL = { admin: "honey", soporte: "info", lectura: "neutral" } as const;

const FOCALIZABLES =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Barra superior con menú de hamburguesa, solo para teléfono (en escritorio
 * está la barra lateral).
 *
 * Sustituye a una fila de enlaces que obligaba a desplazarse hacia los
 * lados. Al abrirse es un diálogo modal: atrapa el foco, se cierra con
 * Escape, con el fondo o al elegir una sección, bloquea el desplazamiento
 * de la página de atrás y devuelve el foco al botón al cerrarse.
 */
export function AdminMenuMovil({
  rol,
  email,
  nuevos,
}: {
  rol: Rol;
  email: string;
  nuevos: number;
}) {
  const [abierto, setAbierto] = useState(false);
  const botonAbrir = useRef<HTMLButtonElement>(null);
  const cajon = useRef<HTMLDivElement>(null);

  const cerrar = useCallback(() => {
    setAbierto(false);
    botonAbrir.current?.focus();
  }, []);

  useEffect(() => {
    if (!abierto) return;

    // Bloquea el desplazamiento de la página de atrás.
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // El foco entra al cajón.
    cajon.current?.querySelector<HTMLElement>(FOCALIZABLES)?.focus();

    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cerrar();
        return;
      }
      if (e.key !== "Tab" || !cajon.current) return;

      // Atrapa el foco: Tab no puede salirse hacia la página tapada.
      const todos = [...cajon.current.querySelectorAll<HTMLElement>(FOCALIZABLES)];
      if (todos.length === 0) return;
      const primero = todos[0];
      const ultimo = todos[todos.length - 1];

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", alPulsar);
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", alPulsar);
    };
  }, [abierto, cerrar]);

  return (
    <div className="md:hidden">
      <header className="bg-background/85 sticky top-0 z-40 -mx-3 mb-4 flex items-center justify-between px-3 py-3 backdrop-blur-md sm:-mx-4 sm:px-4">
        <Link href="/admin" className="flex cursor-pointer items-center gap-2.5">
          <LogoMark className="size-7" />
          <span className="font-display text-lg">Intimate</span>
          <Badge tone="neutral" className="text-[0.6rem]">
            Panel
          </Badge>
        </Link>

        <button
          ref={botonAbrir}
          type="button"
          onClick={() => setAbierto(true)}
          aria-label={
            nuevos > 0
              ? `Abrir el menú. Hay ${nuevos} ${nuevos === 1 ? "mensaje nuevo" : "mensajes nuevos"}`
              : "Abrir el menú"
          }
          aria-expanded={abierto}
          aria-controls="menu-panel"
          className="glass glass-hover relative flex size-11 cursor-pointer items-center justify-center"
        >
          <Menu className="size-5" aria-hidden />
          {nuevos > 0 && (
            <span
              className="bg-honey-500 ring-background absolute -top-1 -right-1 size-3 rounded-full ring-2"
              aria-hidden
            />
          )}
        </button>
      </header>

      {abierto && (
        <div className="fixed inset-0 z-50">
          {/* Fondo: tocarlo cierra el menú. Fuera del orden de tabulación
              porque ya hay un botón de cerrar dentro del cajón. */}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Cerrar el menú"
            onClick={cerrar}
            className="bg-ink-950/55 absolute inset-0 cursor-pointer backdrop-blur-[2px]"
          />

          <div
            ref={cajon}
            id="menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menú del panel"
            className="bg-background absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col gap-5 overflow-y-auto rounded-l-3xl p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-lg">Menú</p>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar el menú"
                className="glass glass-hover flex size-11 cursor-pointer items-center justify-center"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <AdminNav rol={rol} nuevos={nuevos} alNavegar={() => setAbierto(false)} />

            <div className="panel mt-auto p-4">
              <p className="text-muted text-xs">Sesión</p>
              <p className="mt-1 truncate text-sm font-medium">{email}</p>
              <Badge tone={TONO_ROL[rol]} className="mt-2">
                {rol}
              </Badge>
              <CerrarSesionAdmin />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
