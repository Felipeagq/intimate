"use client";

import { useState } from "react";
import { Check, ChevronDown, Compass } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { completarTemaPlan } from "@/actions/app";
import type { Correr, Plan } from "./tipos";

const RADIO = 30;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

/** Anillo de avance: cuántos temas del plan llevan conversados. */
function Anillo({ hechos, total }: { hechos: number; total: number }) {
  const fraccion = total > 0 ? hechos / total : 0;

  return (
    <div
      className="relative size-20 shrink-0"
      role="progressbar"
      aria-valuenow={hechos}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label="Avance del plan"
    >
      <svg viewBox="0 0 72 72" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="36"
          cy="36"
          r={RADIO}
          fill="none"
          strokeWidth="7"
          className="stroke-ink-700/12 dark:stroke-white/15"
        />
        <circle
          cx="36"
          cy="36"
          r={RADIO}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={CIRCUNFERENCIA * (1 - fraccion)}
          className="stroke-gold-700 dark:stroke-honey-300 transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="font-display absolute inset-0 flex items-center justify-center text-lg">
        {hechos}
        <span className="text-muted text-xs">/{total}</span>
      </span>
    </div>
  );
}

export function BloquePlan({
  plan,
  pendiente,
  correr,
}: {
  plan: Plan;
  pendiente: boolean;
  correr: Correr;
}) {
  const [abierto, setAbierto] = useState(false);
  const [verPlan, setVerPlan] = useState(false);

  const hechos = plan.completados.length;
  const terminado = hechos >= plan.totalSemanas;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <Anillo hechos={hechos} total={plan.totalSemanas} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Compass className="text-accent size-4" aria-hidden />
            <p className="text-muted text-xs tracking-wide uppercase">
              Conociéndonos a fondo
            </p>
          </div>
          <p className="mt-1 text-xl leading-tight">
            {terminado
              ? "Completaron todo el plan"
              : `Semana ${plan.semana} de ${plan.totalSemanas}`}
          </p>
          <p className="text-muted mt-0.5 text-sm">
            {hechos} {hechos === 1 ? "tema conversado" : "temas conversados"}
          </p>
        </div>
      </div>

      {/* El tema de esta semana, destacado. */}
      <div className="bg-honey-300/25 mt-5 rounded-2xl p-4 dark:bg-white/8">
        <p className="text-accent text-xs font-medium tracking-wide uppercase">
          {terminado ? "Último tema" : "Tema de esta semana"}
        </p>
        <h2 className="mt-1 text-2xl">{plan.temaActual.titulo}</h2>
        <p className="text-muted mt-1 text-sm leading-relaxed">
          {plan.temaActual.descripcion}
        </p>
        <Button
          variant="secondary"
          className="mt-4"
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? "Cerrar" : "Abrir conversación"}
        </Button>
      </div>

      {abierto && (
        <div className="mt-5">
          <ol className="space-y-3">
            {plan.temaActual.preguntas.map((p, i) => (
              <li key={p} className="flex gap-3">
                <span className="bg-honey-300 text-ink-700 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {i + 1}
                </span>
                <p className="leading-relaxed">{p}</p>
              </li>
            ))}
          </ol>
          <Button
            className="mt-5"
            loading={pendiente}
            onClick={() => correr(() => completarTemaPlan(plan.temaActual.slug))}
          >
            <Check aria-hidden />
            Ya lo conversamos
          </Button>
        </div>
      )}

      {/* Todo el recorrido, plegable para no alargar la pantalla. */}
      <button
        type="button"
        onClick={() => setVerPlan((v) => !v)}
        aria-expanded={verPlan}
        className="text-muted hover:text-foreground mt-3 inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-medium transition-colors duration-200"
      >
        <ChevronDown
          className={cn(
            "size-4 transition-transform duration-200",
            verPlan && "rotate-180",
          )}
          aria-hidden
        />
        {verPlan ? "Ocultar el recorrido" : `Ver los ${plan.totalSemanas} temas`}
      </button>

      {verPlan && (
        <ol className="border-ink-700/10 mt-1 border-t pt-3 dark:border-white/10">
          {[
            ...plan.completados.map((t) => ({ t, estado: "hecho" as const })),
            { t: plan.temaActual.titulo, estado: "actual" as const },
            ...plan.siguientes.map((t) => ({ t, estado: "pendiente" as const })),
          ].map(({ t, estado }) => (
            <li
              key={t}
              className="flex min-h-9 items-center gap-3 text-sm"
              aria-current={estado === "actual" ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full",
                  estado === "hecho" &&
                    "bg-emerald-600/20 text-emerald-800 dark:text-emerald-300",
                  estado === "actual" && "bg-honey-300 text-ink-700",
                  estado === "pendiente" &&
                    "border-ink-700/25 border border-dashed dark:border-white/25",
                )}
                aria-hidden
              >
                {estado === "hecho" && <Check className="size-3" />}
                {estado === "actual" && (
                  <span className="size-1.5 rounded-full bg-current" />
                )}
              </span>
              <span
                className={cn(
                  estado === "pendiente" && "text-muted",
                  estado === "actual" && "font-medium",
                )}
              >
                {t}
                <span className="sr-only">
                  {estado === "hecho"
                    ? " (conversado)"
                    : estado === "actual"
                      ? " (tema actual)"
                      : " (pendiente)"}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
