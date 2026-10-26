import { CalendarCheck, Clock, Flame, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { MapaCalor } from "./mapa-calor";
import { PanelPeticiones } from "./panel-peticiones";
import { RegistrarOracion } from "./registrar-oracion";
import { contextoApp } from "@/server/session";
import { listarPeticiones, obtenerMetricas } from "@/server/modules/oracion";

export const metadata = { title: "Oración" };

export default async function OracionPage() {
  const ctx = await contextoApp();

  const [metricas, peticiones] = await Promise.all([
    obtenerMetricas(ctx.userId, ctx.zona),
    listarPeticiones(ctx.userId, ctx.pareja?.coupleId),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Oración"
        title="Tu constancia"
        description="La racha se calcula con tu zona horaria y tienes un día de gracia por semana que no la rompe."
      />

      <div className="space-y-4">
        <RegistrarOracion yaRegistrado={metricas.hoyRegistrado} />

        {/* Las cuatro métricas en una sola tarjeta: dos columnas en el móvil. */}
        <Card className="p-3 sm:p-4">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              {
                icono: Flame,
                etiqueta: "Racha actual",
                valor: metricas.racha,
                unidad: metricas.racha === 1 ? "día" : "días",
                destacada: true,
              },
              {
                icono: Trophy,
                etiqueta: "Racha más larga",
                valor: metricas.masLarga,
                unidad: metricas.masLarga === 1 ? "día" : "días",
              },
              {
                icono: CalendarCheck,
                etiqueta: "Constancia del mes",
                valor: `${metricas.constanciaDelMes}%`,
              },
              {
                icono: Clock,
                etiqueta: "Minutos esta semana",
                valor: metricas.minutosEstaSemana,
                unidad: "min",
              },
            ].map((m) => (
              <div
                key={m.etiqueta}
                className={
                  m.destacada
                    ? "bg-honey-300/25 rounded-2xl p-3.5 dark:bg-white/8"
                    : "bg-ink-700/6 rounded-2xl p-3.5 dark:bg-white/6"
                }
              >
                <dt className="text-muted flex items-center gap-1.5 text-xs leading-tight">
                  <m.icono
                    className={m.destacada ? "text-accent size-4" : "size-4"}
                    aria-hidden
                  />
                  {m.etiqueta}
                </dt>
                <dd className="mt-1.5 flex items-baseline gap-1">
                  <span className="font-display text-3xl leading-none">
                    {m.valor}
                  </span>
                  {m.unidad && (
                    <span className="text-muted text-xs">{m.unidad}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <MapaCalor
          dias={metricas.mapaCalor}
          constancia={metricas.constanciaDelMes}
        />

        <PanelPeticiones
          propias={peticiones.propias.map((p) => ({
            id: p.id,
            titulo: p.titulo,
            detalle: p.detalle,
            estado: p.estado,
            compartida: p.compartida,
            createdAt: p.createdAt.toISOString(),
            respondidaEn: p.respondidaEn?.toISOString() ?? null,
            nota: p.nota,
          }))}
          compartidas={peticiones.compartidas.map((p) => ({
            id: p.id,
            titulo: p.titulo,
            detalle: p.detalle,
            estado: p.estado,
            createdAt: p.createdAt.toISOString(),
          }))}
          nombrePareja={ctx.pareja?.parejaNombre ?? null}
        />
      </div>
    </div>
  );
}
