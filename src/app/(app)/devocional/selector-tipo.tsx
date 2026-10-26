"use client";

import { User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tipo = "personal" | "pareja";

const OPCIONES = {
  personal: {
    titulo: "Personal",
    ayuda: "Tu tiempo a solas con Dios",
    icono: User,
  },
  pareja: {
    titulo: "En pareja",
    ayuda: "Un pasaje, dos respuestas",
    icono: Users,
  },
} as const;

/**
 * Elegir entre devocional personal y de pareja. Cada opción dice qué es, para
 * que la diferencia no dependa de adivinar por el nombre.
 */
export function SelectorTipo({
  valor,
  onCambiar,
  orden = ["personal", "pareja"],
}: {
  valor: Tipo;
  onCambiar: (tipo: Tipo) => void;
  orden?: Tipo[];
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Tipo de devocional"
      className="mb-5 grid max-w-xl grid-cols-2 gap-2"
    >
      {orden.map((tipo) => {
        const { titulo, ayuda, icono: Icono } = OPCIONES[tipo];
        const activo = valor === tipo;
        return (
          <button
            key={tipo}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onCambiar(tipo)}
            className={cn(
              "flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition-colors duration-200",
              activo
                ? "bg-honey-300 text-ink-700 border-transparent"
                : "glass glass-hover text-foreground",
            )}
          >
            <Icono className="size-5 shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{titulo}</span>
              <span
                className={cn(
                  "block text-xs leading-snug",
                  activo ? "text-ink-700/80" : "text-muted",
                )}
              >
                {ayuda}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
