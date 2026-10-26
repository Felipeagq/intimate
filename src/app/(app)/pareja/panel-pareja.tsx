"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  CalendarHeart,
  ClipboardCheck,
  Compass,
  Flame,
  Heart,
  LayoutGrid,
  MessageCircleHeart,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BloqueAcuerdos } from "./bloque-acuerdos";
import { BloqueAfirmaciones } from "./bloque-afirmaciones";
import { BloqueCheckin } from "./bloque-checkin";
import { BloquePlan } from "./bloque-plan";
import { Resumen, type Pendiente } from "./resumen";
import type {
  Acuerdo,
  Afirmacion,
  Checkin,
  Correr,
  Plan,
  Plantilla,
  Seccion,
} from "./tipos";

const SECCIONES: { id: Seccion; etiqueta: string; icono: LucideIcon }[] = [
  { id: "resumen", etiqueta: "Resumen", icono: LayoutGrid },
  { id: "checkin", etiqueta: "Check-in", icono: ClipboardCheck },
  { id: "plan", etiqueta: "Plan", icono: Compass },
  { id: "acuerdos", etiqueta: "Acuerdos", icono: ScrollText },
  { id: "palabras", etiqueta: "Palabras", icono: MessageCircleHeart },
];

export type Hito = { dias: number; etiqueta: string };

export function PanelPareja({
  nombrePareja,
  checkin,
  plan,
  acuerdos,
  plantillas,
  afirmaciones,
  racha,
  diasJuntos,
  hito,
  seccionInicial,
}: {
  miId: string;
  nombrePareja: string;
  checkin: Checkin;
  plan: Plan;
  acuerdos: Acuerdo[];
  plantillas: Plantilla[];
  afirmaciones: Afirmacion[];
  racha: number;
  diasJuntos: number;
  hito: Hito;
  seccionInicial: Seccion;
}) {
  const [seccion, setSeccion] = useState<Seccion>(seccionInicial);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const correr: Correr = (fn) =>
    iniciar(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Algo salió mal.");
    });

  const ir = (id: Seccion) => {
    setSeccion(id);
    // La sección queda en la dirección: se puede compartir o recargar.
    window.history.replaceState(
      null,
      "",
      id === "resumen" ? window.location.pathname : `?seccion=${id}`,
    );
  };

  // Lo que le toca a esta persona. Alimenta el resumen y los globos de la barra.
  const porConfirmar = acuerdos.filter(
    (a) => !a.confirmadoPorMi && !a.confirmadoPorAmbos,
  ).length;
  const pendientes: Pendiente[] = [];
  if (!checkin.yoRespondi) {
    pendientes.push({ seccion: "checkin", texto: "Responder el check-in de la semana" });
  }
  if (porConfirmar > 0) {
    pendientes.push({
      seccion: "acuerdos",
      texto:
        porConfirmar === 1
          ? "Confirmar 1 acuerdo"
          : `Confirmar ${porConfirmar} acuerdos`,
    });
  }
  if (plan.completados.length < plan.totalSemanas) {
    pendientes.push({
      seccion: "plan",
      texto: `Conversar el tema de la semana: ${plan.temaActual.titulo}`,
    });
  }
  const avisos: Partial<Record<Seccion, number>> = {
    checkin: checkin.yoRespondi ? 0 : 1,
    acuerdos: porConfirmar,
  };

  const ultimaRecibida = afirmaciones.find((a) => !a.mia) ?? null;

  return (
    <div className="space-y-4">
      {/* Racha, tiempo juntos y el próximo hito: siempre a la vista. */}
      <Card className="divide-ink-700/10 grid grid-cols-3 divide-x p-4 dark:divide-white/10">
        <Dato icono={Flame} valor={racha} etiqueta="Racha de pareja" unidad={racha === 1 ? "día" : "días"} />
        <Dato icono={Heart} valor={diasJuntos} etiqueta="Juntos" unidad={diasJuntos === 1 ? "día" : "días"} />
        <Dato
          icono={CalendarHeart}
          valor={hito.dias === 0 ? "¡Hoy!" : hito.dias}
          unidad={hito.dias === 0 ? undefined : hito.dias === 1 ? "día" : "días"}
          etiqueta={hito.etiqueta}
        />
      </Card>

      {/* Pestañas fijas bajo la barra superior. */}
      <div className="sticky top-14 z-20 lg:top-0">
        <div
          role="tablist"
          aria-label="Secciones del espacio de pareja"
          className="glass grid grid-cols-5 gap-1 p-1.5"
        >
          {SECCIONES.map((s) => {
            const activa = seccion === s.id;
            const aviso = avisos[s.id] ?? 0;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                id={`tab-${s.id}`}
                aria-selected={activa}
                aria-controls="panel-seccion"
                onClick={() => ir(s.id)}
                className={cn(
                  "relative flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 text-[0.7rem] font-medium transition-colors duration-200",
                  activa
                    ? "bg-honey-300 text-ink-700"
                    : "text-muted hover:text-foreground",
                )}
              >
                <s.icono className="size-5" aria-hidden />
                {s.etiqueta}
                {aviso > 0 && (
                  <>
                    <span
                      className="absolute top-1 right-1.5 flex size-4 items-center justify-center rounded-full bg-amber-600 text-[0.6rem] font-semibold text-white"
                      aria-hidden
                    >
                      {aviso}
                    </span>
                    <span className="sr-only">
                      , {aviso} {aviso === 1 ? "pendiente" : "pendientes"}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div
        role="tabpanel"
        id="panel-seccion"
        aria-labelledby={`tab-${seccion}`}
        className="space-y-4"
      >
        {seccion === "resumen" && (
          <Resumen
            pendientes={pendientes}
            ultimaRecibida={ultimaRecibida}
            nombrePareja={nombrePareja}
            alIr={ir}
          />
        )}
        {seccion === "checkin" && (
          <BloqueCheckin
            checkin={checkin}
            nombrePareja={nombrePareja}
            pendiente={pendiente}
            correr={correr}
          />
        )}
        {seccion === "plan" && (
          <BloquePlan plan={plan} pendiente={pendiente} correr={correr} />
        )}
        {seccion === "acuerdos" && (
          <BloqueAcuerdos
            acuerdos={acuerdos}
            plantillas={plantillas}
            nombrePareja={nombrePareja}
            pendiente={pendiente}
            correr={correr}
          />
        )}
        {seccion === "palabras" && (
          <BloqueAfirmaciones
            afirmaciones={afirmaciones}
            nombrePareja={nombrePareja}
            pendiente={pendiente}
            correr={correr}
          />
        )}
      </div>
    </div>
  );
}

function Dato({
  icono: Icono,
  valor,
  unidad,
  etiqueta,
}: {
  icono: LucideIcon;
  valor: number | string;
  unidad?: string;
  etiqueta: string;
}) {
  return (
    <div className="flex flex-col items-center px-1 text-center">
      <Icono className="text-accent size-5" aria-hidden />
      <p className="font-display mt-1.5 text-2xl leading-none sm:text-3xl">
        {valor}
        {unidad && <span className="text-muted ml-1 text-xs">{unidad}</span>}
      </p>
      <p className="text-muted mt-1 text-xs leading-tight">{etiqueta}</p>
    </div>
  );
}
