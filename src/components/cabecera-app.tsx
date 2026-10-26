"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Avatar, AvatarPareja } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Cabecera de la app en el móvil: una barra fija arriba, como las apps
 * nativas. La página (`PageHeader`) le dice qué título lleva y si tiene
 * pantalla a la que volver; la barra muestra ese título cuando el grande de
 * la página se pierde de vista al desplazarse.
 */

export type Volver = { href: string; etiqueta: string };

type Estado = {
  titulo: string | null;
  volver: Volver | null;
  /** El título grande de la página ya salió de la pantalla. */
  tituloEnBarra: boolean;
};

const VACIO: Estado = { titulo: null, volver: null, tituloEnBarra: false };

type Contexto = {
  estado: Estado;
  fijar: (parcial: Partial<Estado>) => void;
  limpiar: () => void;
};

const CabeceraContexto = createContext<Contexto | null>(null);

/** null fuera de la app (el panel de admin no tiene esta barra). */
export function useCabecera() {
  return useContext(CabeceraContexto);
}

export function CabeceraProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>(VACIO);
  const fijar = useCallback(
    (parcial: Partial<Estado>) => setEstado((e) => ({ ...e, ...parcial })),
    [],
  );
  const limpiar = useCallback(() => setEstado(VACIO), []);
  const valor = useMemo(() => ({ estado, fijar, limpiar }), [estado, fijar, limpiar]);

  return (
    <CabeceraContexto.Provider value={valor}>
      {children}
    </CabeceraContexto.Provider>
  );
}

export function BarraSuperior({
  email,
  nombre,
  fotoUrl,
  parejaNombre,
  parejaFotoUrl,
}: {
  email: string;
  nombre: string;
  fotoUrl: string | null;
  parejaNombre: string | null;
  parejaFotoUrl: string | null;
}) {
  const ctx = useCabecera();
  const estado = ctx?.estado ?? VACIO;
  const { titulo, volver, tituloEnBarra } = estado;
  const mostrarTitulo = tituloEnBarra && Boolean(titulo);

  // La barra es transparente arriba, para que se funda con el fondo, y toma
  // cuerpo (desenfoque y filo) solo cuando hay contenido pasando por debajo.
  const [desplazado, setDesplazado] = useState(false);
  useEffect(() => {
    const alDesplazar = () => setDesplazado(window.scrollY > 4);
    alDesplazar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 -mx-3 flex h-14 items-center gap-1 px-3 sm:-mx-4 sm:px-4 lg:hidden",
        "border-b transition-[background-color,border-color,backdrop-filter] duration-200",
        desplazado
          ? "bg-background/75 border-[var(--glass-border)] backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
    >
      {volver ? (
        <Link
          href={volver.href}
          aria-label={`Volver: ${volver.etiqueta}`}
          className="glass glass-hover mr-1 flex size-11 shrink-0 cursor-pointer items-center justify-center"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
      ) : (
        <Link
          href="/inicio"
          aria-label="Intimate, ir al inicio"
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center"
        >
          <LogoMark className="size-8" />
        </Link>
      )}

      {/* La marca y el título comparten sitio y se cruzan al desplazarse. */}
      <div className="relative h-full min-w-0 flex-1" aria-live="polite">
        {!volver && (
          <p
            className={cn(
              "font-display absolute inset-0 flex items-center text-lg transition-all duration-200",
              mostrarTitulo
                ? "-translate-y-1 opacity-0"
                : "translate-y-0 opacity-100",
            )}
            aria-hidden={mostrarTitulo}
          >
            Intimate
          </p>
        )}
        <p
          className={cn(
            "font-display absolute inset-0 flex items-center text-lg transition-all duration-200",
            mostrarTitulo
              ? "translate-y-0 opacity-100"
              : "translate-y-1 opacity-0",
          )}
          aria-hidden={!mostrarTitulo}
        >
          <span className="truncate">{titulo}</span>
        </p>
      </div>

      <Link
        href="/ajustes"
        aria-label={`Ajustes de ${email}`}
        className="flex min-h-11 shrink-0 cursor-pointer items-center"
      >
        {parejaNombre ? (
          <AvatarPareja
            unoUrl={fotoUrl}
            unoNombre={nombre}
            dosUrl={parejaFotoUrl}
            dosNombre={parejaNombre}
            tamano="md"
            anillo="fino"
          />
        ) : fotoUrl ? (
          <Avatar url={fotoUrl} nombre={nombre} tamano="md" />
        ) : (
          <span className="glass glass-hover flex size-11 items-center justify-center">
            <Settings className="size-5" aria-hidden />
          </span>
        )}
      </Link>
    </header>
  );
}
