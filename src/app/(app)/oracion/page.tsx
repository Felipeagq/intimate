import { Flame } from "lucide-react";
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

        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-5">
            <Flame className="text-accent size-5" aria-hidden />
            <p className="mt-3 font-display text-4xl">{metricas.racha}</p>
            <p className="text-muted mt-1 text-sm">Racha actual</p>
          </Card>
          <Card className="p-5">
            <p className="text-muted text-sm">Racha más larga</p>
            <p className="mt-2 font-display text-4xl">{metricas.masLarga}</p>
          </Card>
          <Card className="p-5">
            <p className="text-muted text-sm">Constancia del mes</p>
            <p className="mt-2 font-display text-4xl">
              {metricas.constanciaDelMes}%
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-muted text-sm">Minutos esta semana</p>
            <p className="mt-2 font-display text-4xl">
              {metricas.minutosEstaSemana}
            </p>
          </Card>
        </div>

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
