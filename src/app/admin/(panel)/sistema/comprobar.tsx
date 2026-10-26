"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Check, CircleSlash, Mail, RefreshCw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { comprobarSistema, enviarCorreoDePrueba } from "@/actions/sistema";
import type { Comprobacion } from "@/server/modules/sistema";

const ICONO = { ok: Check, fallo: X, sin_configurar: CircleSlash } as const;
const TONO = { ok: "success", fallo: "danger", sin_configurar: "neutral" } as const;
const ETIQUETA = {
  ok: "Funciona",
  fallo: "Falla",
  sin_configurar: "Sin configurar",
} as const;

export function Comprobar({ puedeEnviarPrueba }: { puedeEnviarPrueba: boolean }) {
  const [resultados, setResultados] = useState<Comprobacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [revisando, revisar] = useTransition();
  const [enviando, enviar] = useTransition();

  const comprobar = () =>
    revisar(async () => {
      setError(null);
      const r = await comprobarSistema();
      if (r.ok) setResultados(r.datos);
      else setError(r.error);
    });

  const probarCorreo = () =>
    enviar(async () => {
      setError(null);
      setAviso(null);
      const r = await enviarCorreoDePrueba();
      if (r.ok) setAviso(`Enviado a ${r.para}. Revisa la bandeja y el spam.`);
      else setError(r.error);
    });

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={comprobar} loading={revisando}>
          <RefreshCw className="size-4" aria-hidden />
          Comprobar ahora
        </Button>
        {puedeEnviarPrueba && (
          <Button variant="secondary" onClick={probarCorreo} loading={enviando}>
            <Mail className="size-4" aria-hidden />
            Enviarme un correo de prueba
          </Button>
        )}
      </div>

      {aviso && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-600/12 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200">
          <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
          {aviso}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {resultados && (
        <ul className="mt-5 space-y-1">
          {resultados.map((r) => {
            const Icono = ICONO[r.estado];
            return (
              <li
                key={r.id}
                className="border-ink-700/8 flex flex-wrap items-start justify-between gap-3 border-b py-3 last:border-0 dark:border-white/8"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Icono className="size-4" aria-hidden />
                    {r.nombre}
                  </p>
                  <p className="text-muted mt-0.5 text-xs leading-relaxed">
                    {r.detalle}
                    {r.ms !== null && ` · ${r.ms} ms`}
                  </p>
                </div>
                <Badge tone={TONO[r.estado]}>{ETIQUETA[r.estado]}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
