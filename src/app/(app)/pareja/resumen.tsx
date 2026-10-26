"use client";

import { Check, ChevronRight, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextoEnriquecido } from "@/components/texto-enriquecido";
import { formatDate } from "@/lib/utils";
import type { Afirmacion, Seccion } from "./tipos";

export type Pendiente = { seccion: Seccion; texto: string };

/** La pestaña de entrada: qué falta esta semana y lo último que recibiste. */
export function Resumen({
  pendientes,
  ultimaRecibida,
  nombrePareja,
  alIr,
}: {
  pendientes: Pendiente[];
  ultimaRecibida: Afirmacion | null;
  nombrePareja: string;
  alIr: (seccion: Seccion) => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="p-5 sm:p-6">
        <h2 className="text-xl">Esta semana</h2>

        {pendientes.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
            <Check className="size-4" aria-hidden />
            Todo al día. No tienen nada pendiente.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pendientes.map((p) => (
              <li key={p.seccion + p.texto}>
                <button
                  type="button"
                  onClick={() => alIr(p.seccion)}
                  className="bg-ink-700/6 hover:bg-ink-700/10 flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 text-left text-sm transition-colors duration-200 dark:bg-white/6 dark:hover:bg-white/10"
                >
                  {p.texto}
                  <ChevronRight className="text-muted size-4 shrink-0" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {ultimaRecibida && (
        <Card className="p-5 sm:p-6">
          <Quote className="text-accent size-5 opacity-70" aria-hidden />
          <p className="text-muted mt-2 text-xs tracking-wide uppercase">
            Lo último que escribió {nombrePareja}
          </p>
          <TextoEnriquecido className="mt-2" markdown={ultimaRecibida.mensaje} />
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-muted text-xs">
              {formatDate(ultimaRecibida.createdAt)}
            </p>
            <Button size="sm" variant="ghost" onClick={() => alIr("palabras")}>
              Ver todas
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
