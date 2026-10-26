"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Info } from "lucide-react";
import { useCabecera, type Volver } from "@/components/cabecera-app";
import { cn } from "@/lib/utils";

/**
 * Cabecera de página.
 *
 * Dentro de la app (hay barra superior) se comporta como una app nativa:
 *  - registra su título y su pantalla de retorno en la barra, que muestra el
 *    título cuando el grande sale de la vista al desplazarse;
 *  - la explicación (`description`) queda tras un icono ⓘ en el móvil, para
 *    que no ocupe media pantalla; en escritorio se ve siempre.
 * Fuera de la app (panel de admin) es un encabezado normal.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  volver,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Pantalla a la que se vuelve: flecha en la barra (móvil) y enlace (escritorio). */
  volver?: Volver;
}) {
  const cabecera = useCabecera();
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const h1 = useRef<HTMLHeadingElement>(null);

  const enApp = cabecera !== null;
  const fijar = cabecera?.fijar;
  const limpiar = cabecera?.limpiar;
  const volverHref = volver?.href;
  const volverEtiqueta = volver?.etiqueta;

  // Registra el título y el retorno en la barra mientras esta página está.
  useEffect(() => {
    if (!fijar || !limpiar) return;
    fijar({
      titulo: title,
      volver:
        volverHref && volverEtiqueta
          ? { href: volverHref, etiqueta: volverEtiqueta }
          : null,
    });
    return limpiar;
  }, [fijar, limpiar, title, volverHref, volverEtiqueta]);

  // El título pasa a la barra cuando el grande queda por encima de la pantalla.
  useEffect(() => {
    const el = h1.current;
    if (!el || !fijar) return;
    // La barra mide 56px: el título "sale" al pasar bajo ella.
    const observador = new IntersectionObserver(
      ([entrada]) =>
        fijar({
          tituloEnBarra:
            !entrada.isIntersecting && entrada.boundingClientRect.top < 0,
        }),
      { rootMargin: "-56px 0px 0px 0px" },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, [fijar, title]);

  return (
    <div className="mt-1 mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 lg:mt-0 lg:mb-6">
      <div className="min-w-0">
        {volver && (
          <Link
            href={volver.href}
            className="text-muted hover:text-foreground mb-2 hidden min-h-11 cursor-pointer items-center gap-1.5 text-sm font-medium lg:inline-flex"
          >
            <ChevronLeft className="size-4" aria-hidden />
            {volver.etiqueta}
          </Link>
        )}
        {eyebrow && (
          <p className="text-accent text-xs font-medium tracking-wide uppercase">
            {eyebrow}
          </p>
        )}
        <div className="mt-1 flex items-center gap-1">
          <h1 ref={h1} className="text-3xl sm:text-4xl">
            {title}
          </h1>
          {description && enApp && (
            <button
              type="button"
              onClick={() => setAyudaAbierta((v) => !v)}
              aria-expanded={ayudaAbierta}
              aria-label={ayudaAbierta ? "Ocultar la explicación" : "Qué es esto"}
              className="text-muted hover:text-foreground flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 lg:hidden"
            >
              <Info className="size-5" aria-hidden />
            </button>
          )}
        </div>
        {description && (
          <p
            className={cn(
              "text-muted mt-1 max-w-prose leading-relaxed",
              enApp && !ayudaAbierta && "hidden lg:block",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
