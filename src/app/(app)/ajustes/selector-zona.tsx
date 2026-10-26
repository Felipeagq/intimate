"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { fijarZonaHoraria } from "@/actions/perfil";

type Opcion = { valor: string; etiqueta: string };

export function SelectorZona({
  zonaActual,
  opciones,
}: {
  zonaActual: string;
  opciones: Opcion[];
}) {
  const router = useRouter();
  const [zona, setZona] = useState(zonaActual);
  const [detectada, setDetectada] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  // El navegador solo se puede consultar en el cliente.
  useEffect(() => {
    setDetectada(Intl.DateTimeFormat().resolvedOptions().timeZone ?? null);
  }, []);

  const guardar = (nueva: string) =>
    iniciar(async () => {
      setError(null);
      setGuardado(false);
      const r = await fijarZonaHoraria(nueva, false);
      if (r.ok) {
        setZona(nueva);
        setGuardado(true);
        router.refresh();
      } else {
        setError(r.error);
      }
    });

  const distinta = detectada !== null && detectada !== zonaActual;

  return (
    <div className="space-y-4">
      <Field
        htmlFor="zona"
        label="Zona horaria"
        hint="Decide qué cuenta como “hoy”"
      >
        <select
          id="zona"
          value={zona}
          onChange={(e) => {
            setZona(e.target.value);
            setGuardado(false);
          }}
          className="border-ink-700/15 bg-background text-foreground focus:border-accent min-h-12 w-full cursor-pointer rounded-2xl border px-4 text-base focus:outline-none dark:border-white/15"
        >
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </Field>

      {distinta && zona === zonaActual && (
        <div className="rounded-2xl bg-amber-500/12 p-4 text-sm leading-relaxed">
          <p className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
            <Globe className="size-4 shrink-0" aria-hidden />
            Tu dispositivo indica otra zona
          </p>
          <p className="text-muted mt-1">
            Estás usando <strong>{zonaActual}</strong> y tu dispositivo marca{" "}
            <strong>{detectada}</strong>. Si viajaste o te mudaste, cámbiala.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-3"
            loading={pendiente}
            onClick={() => detectada && guardar(detectada)}
          >
            Usar {detectada}
          </Button>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          loading={pendiente}
          disabled={zona === zonaActual}
          onClick={() => guardar(zona)}
        >
          Guardar zona
        </Button>
        {guardado && (
          <span className="text-muted flex items-center gap-1.5 text-sm">
            <Check
              className="size-4 text-emerald-700 dark:text-emerald-400"
              aria-hidden
            />
            Guardada
          </span>
        )}
      </div>

      <p className="text-muted text-xs leading-relaxed">
        Cambiarla no reescribe tus días anteriores: cada oración ya registrada
        conserva la fecha que tenía. Desde el cambio, “hoy” se mide en la zona
        nueva. Orar a las 23:50 cuenta para ese día en tu hora.
      </p>
    </div>
  );
}
