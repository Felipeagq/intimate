"use client";

import { useState, useTransition } from "react";
import { Check, Eye, HandHeart, Sprout } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Textarea, Input } from "@/components/ui/field";
import { BuscarPasaje } from "@/components/buscar-pasaje";
import { cn } from "@/lib/utils";
import { Mensaje } from "./mensaje";
import { guardarDevocionalPersonal } from "@/actions/app";

export type Personal = {
  id?: string;
  pasaje: string;
  textoPasaje: string | null;
  observacion: string | null;
  aplicacion: string | null;
  oracion: string | null;
  completado: boolean;
};

const PASOS = [
  {
    id: "observacion" as const,
    icono: Eye,
    titulo: "Observación",
    ayuda: "¿Qué dice el texto? ¿De quién habla, qué pasa?",
  },
  {
    id: "aplicacion" as const,
    icono: Sprout,
    titulo: "Aplicación",
    ayuda: "¿Qué cambia esto en tu semana?",
  },
  {
    id: "oracion" as const,
    icono: HandHeart,
    titulo: "Oración",
    ayuda: "Escríbelo como se lo dirías a Dios.",
  },
];

export function EditorPersonal({
  inicial,
  esDeHoy = true,
}: {
  inicial: Personal | null;
  esDeHoy?: boolean;
}) {
  // El id se conserva entre guardados: en el primero el servidor lo devuelve y
  // a partir de ahí cada paso edita este devocional en vez de crear otro.
  const [id, setId] = useState(inicial?.id);
  const [pasaje, setPasaje] = useState(inicial?.pasaje ?? "");
  const [textoPasaje, setTextoPasaje] = useState(inicial?.textoPasaje ?? "");
  const [valores, setValores] = useState({
    observacion: inicial?.observacion ?? "",
    aplicacion: inicial?.aplicacion ?? "",
    oracion: inicial?.oracion ?? "",
  });
  const [paso, setPaso] = useState(0);
  const [completado, setCompletado] = useState(inicial?.completado ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;

  const guardar = (terminar = false) =>
    iniciar(async () => {
      setError(null);
      const r = await guardarDevocionalPersonal({
        id,
        pasaje,
        textoPasaje: textoPasaje || undefined,
        ...valores,
        completado: terminar,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      if (r.datos) setId(r.datos.id);
      if (terminar) setCompletado(true);
      else if (!esUltimo) setPaso((p) => p + 1);
    });

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <Field
          htmlFor="pasaje-personal"
          label={esDeHoy ? "Pasaje de hoy" : "Pasaje"}
        >
          <Input
            id="pasaje-personal"
            value={pasaje}
            onChange={(e) => setPasaje(e.target.value)}
            maxLength={120}
            placeholder="Salmo 23"
          />
        </Field>

        <div className="mt-3">
          <BuscarPasaje
            referencia={pasaje}
            uso="devocional"
            onEncontrado={(p) => {
              setPasaje(p.referencia);
              setTextoPasaje(p.texto);
            }}
          />
        </div>

        {textoPasaje && (
          <blockquote className="border-honey-500 mt-5 border-l-2 pl-4">
            <p className="font-display text-lg leading-relaxed">{textoPasaje}</p>
          </blockquote>
        )}
      </Card>

      <Card className="p-6">
        <ol className="mb-6 flex gap-2" aria-label="Progreso del devocional">
          {PASOS.map((p, i) => (
            <li key={p.id} className="flex-1">
              <button
                onClick={() => setPaso(i)}
                aria-current={i === paso ? "step" : undefined}
                className={cn(
                  "flex min-h-16 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-xs font-medium transition-colors duration-200",
                  i === paso
                    ? "bg-honey-300 text-ink-700"
                    : valores[p.id]
                      ? "bg-ink-700/10 text-foreground dark:bg-white/12"
                      : "text-muted hover:bg-white/50 dark:hover:bg-white/8",
                )}
              >
                <p.icono className="size-5" aria-hidden />
                <span>{p.titulo}</span>
              </button>
            </li>
          ))}
        </ol>

        <Field
          htmlFor={`soap-${actual.id}`}
          label={actual.titulo}
          hint={actual.ayuda}
        >
          <Textarea
            id={`soap-${actual.id}`}
            value={valores[actual.id]}
            onChange={(e) =>
              setValores((v) => ({ ...v, [actual.id]: e.target.value }))
            }
          />
        </Field>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setPaso((p) => Math.max(0, p - 1))}
            disabled={paso === 0}
          >
            Atrás
          </Button>
          <Button
            onClick={() => guardar(esUltimo)}
            loading={pendiente}
            disabled={!pasaje.trim() || (esUltimo && !valores.oracion.trim())}
          >
            {esUltimo ? "Terminar devocional" : "Guardar y seguir"}
          </Button>
        </div>

        <Mensaje error={error} />

        {completado && (
          <p className="mt-4 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <Check className="size-4" aria-hidden />
            {esDeHoy
              ? "Devocional completo. Cuenta para tu racha de hoy."
              : "Devocional completo."}
          </p>
        )}
      </Card>

      <p className="text-muted px-2 text-sm leading-relaxed">
        {esDeHoy
          ? "Si cierras la app a mitad, vuelves donde quedaste. Cuenta para la racha porque incluye la sección Oración."
          : "Es un devocional de otro día: puedes terminarlo o cambiarlo, pero no cuenta para la racha de hoy."}
      </p>
    </div>
  );
}
