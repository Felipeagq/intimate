"use client";

import { useState } from "react";
import { Check, EyeOff, Lock, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Textarea, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { devocionalHoy, pareja, usuario } from "@/lib/mock-data";

const pasosSoap = [
  {
    id: "escritura",
    letra: "E",
    titulo: "Escritura",
    ayuda: "Escribe el pasaje o la parte que más te detuvo.",
  },
  {
    id: "observacion",
    letra: "O",
    titulo: "Observación",
    ayuda: "¿Qué dice el texto? ¿De quién habla, qué pasa?",
  },
  {
    id: "aplicacion",
    letra: "A",
    titulo: "Aplicación",
    ayuda: "¿Qué cambia esto en tu semana?",
  },
  {
    id: "oracion",
    letra: "O",
    titulo: "Oración",
    ayuda: "Escríbelo como se lo dirías a Dios.",
  },
];

export function DevocionalView() {
  const [modo, setModo] = useState<"pareja" | "personal">("pareja");

  return (
    <div>
      <PageHeader
        eyebrow="Devocional"
        title={modo === "pareja" ? "Juntos, hoy" : "Tu tiempo con Dios"}
        description={
          modo === "pareja"
            ? "Cada uno escribe por separado. Las respuestas se revelan cuando ambos terminan."
            : "Método SOAP, una sección a la vez. Se guarda solo mientras escribes."
        }
      />

      <div
        role="tablist"
        aria-label="Tipo de devocional"
        className="glass mb-5 inline-flex gap-1 p-1.5"
      >
        {(["pareja", "personal"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={modo === m}
            onClick={() => setModo(m)}
            className={cn(
              "min-h-11 cursor-pointer rounded-2xl px-5 text-sm font-medium transition-colors duration-200",
              modo === m
                ? "bg-honey-300 text-ink-700"
                : "text-muted hover:text-foreground",
            )}
          >
            {m === "pareja" ? "En pareja" : "Personal"}
          </button>
        ))}
      </div>

      {modo === "pareja" ? <DevocionalPareja /> : <DevocionalPersonal />}
    </div>
  );
}

function DevocionalPareja() {
  const [respuesta, setRespuesta] = useState(devocionalHoy.miRespuesta);
  const [guardado, setGuardado] = useState(devocionalHoy.yoRespondi);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl">{devocionalHoy.titulo}</h2>
            <p className="text-accent mt-1 text-sm font-medium">
              {devocionalHoy.pasaje}
            </p>
          </div>
          <Badge tone="honey">Elegido por {pareja.nombre}</Badge>
        </div>
        <blockquote className="border-honey-500 mt-5 border-l-2 pl-4">
          <p className="font-[family-name:var(--font-display)] text-lg leading-relaxed">
            {devocionalHoy.texto}
          </p>
        </blockquote>
      </Card>

      <Card className="p-6">
        <Field
          htmlFor="mi-respuesta"
          label="Lo que Dios me dijo"
          hint="Solo tú lo ves hasta que los dos escriban"
        >
          <Textarea
            id="mi-respuesta"
            value={respuesta}
            onChange={(e) => {
              setRespuesta(e.target.value);
              setGuardado(false);
            }}
            placeholder="No tiene que ser largo. Una frase honesta vale más que una página."
          />
        </Field>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => setGuardado(true)} disabled={!respuesta.trim()}>
            <Save className="size-4" aria-hidden />
            {guardado ? "Guardado" : "Guardar"}
          </Button>
          {guardado && (
            <span className="text-muted flex items-center gap-1.5 text-sm">
              <Check className="size-4 text-emerald-700 dark:text-emerald-400" aria-hidden />
              Borrador guardado
            </span>
          )}
        </div>
      </Card>

      {/* Mecánica de revelado: el corazón del módulo de pareja. */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <EyeOff className="text-muted size-4" aria-hidden />
          <p className="text-muted text-xs tracking-wide uppercase">
            Lo que escribió {pareja.nombre}
          </p>
        </div>

        {devocionalHoy.parejaRespondio ? (
          <p className="mt-3 leading-relaxed">{devocionalHoy.respuestaPareja}</p>
        ) : (
          <div className="mt-4 flex items-start gap-3">
            <Lock className="text-muted mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">Todavía no se revela</p>
              <p className="text-muted mt-1 text-sm leading-relaxed">
                {usuario.nombre}, {pareja.nombre} aún no ha escrito. Cuando
                termine, los dos verán la respuesta del otro al mismo tiempo.
                Así ninguno influye en lo que el otro escribe.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function DevocionalPersonal() {
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState<Record<string, string>>({});
  const actual = pasosSoap[paso];
  const esUltimo = paso === pasosSoap.length - 1;

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <Field htmlFor="pasaje" label="Pasaje de hoy">
          <Input id="pasaje" placeholder="Por ejemplo: Salmo 23" />
        </Field>
      </Card>

      <Card className="p-6">
        {/* Progreso por pasos, con estado accesible además del color. */}
        <ol className="mb-6 flex gap-2" aria-label="Progreso del devocional">
          {pasosSoap.map((p, i) => (
            <li key={p.id} className="flex-1">
              <button
                onClick={() => setPaso(i)}
                aria-current={i === paso ? "step" : undefined}
                className={cn(
                  "flex min-h-11 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium transition-colors duration-200",
                  i === paso
                    ? "bg-honey-300 text-ink-700"
                    : valores[p.id]
                      ? "bg-ink-700/10 text-foreground dark:bg-white/12"
                      : "text-muted hover:bg-white/50 dark:hover:bg-white/8",
                )}
              >
                <span className="font-[family-name:var(--font-display)] text-base">
                  {p.letra}
                </span>
                <span className="hidden sm:block">{p.titulo}</span>
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
            value={valores[actual.id] ?? ""}
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
            onClick={() => !esUltimo && setPaso((p) => p + 1)}
            disabled={esUltimo && !valores[actual.id]?.trim()}
          >
            {esUltimo ? "Terminar devocional" : "Siguiente"}
          </Button>
        </div>
      </Card>

      <p className="text-muted px-2 text-sm leading-relaxed">
        Si cierras la app a mitad, vuelves justo donde quedaste. Este devocional
        cuenta para tu racha de oración porque incluye la sección Oración.
      </p>
    </div>
  );
}
