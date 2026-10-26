"use client";

import { useState, useTransition } from "react";
import { AlertCircle, BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buscarPasaje } from "@/actions/biblia";

export type PasajeEncontrado = {
  referencia: string;
  texto: string;
  traduccion: string;
};

/**
 * Botón "Traer texto": toma la cita que escribió la persona y devuelve el
 * pasaje al formulario que lo contiene. No guarda nada por su cuenta: el
 * formulario decide qué hacer con el texto, y la persona puede editarlo.
 */
export function BuscarPasaje({
  referencia,
  uso,
  onEncontrado,
}: {
  referencia: string;
  uso: "devocional" | "promesa";
  onEncontrado: (pasaje: PasajeEncontrado) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [traduccion, setTraduccion] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const traer = () =>
    iniciar(async () => {
      setError(null);
      setTraduccion(null);

      const r = await buscarPasaje(referencia, uso);
      if (r.ok) {
        setTraduccion(r.traduccion);
        onEncontrado({
          referencia: r.referencia,
          texto: r.texto,
          traduccion: r.traduccion,
        });
      } else {
        setError(r.error);
      }
    });

  return (
    <div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        loading={pendiente}
        disabled={!referencia.trim()}
        onClick={traer}
      >
        <BookOpen className="size-4" aria-hidden />
        Traer el texto
      </Button>

      {traduccion && (
        <p className="text-muted mt-2 flex items-center gap-1.5 text-xs">
          <Check
            className="size-3.5 text-emerald-700 dark:text-emerald-400"
            aria-hidden
          />
          {traduccion} · dominio público. Puedes editarlo.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-2 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
