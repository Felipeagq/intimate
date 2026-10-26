import Link from "next/link";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonStyles } from "@/components/ui/button";
import { AvatarPareja } from "@/components/ui/avatar";
import { PanelPareja } from "./panel-pareja";
import { contextoApp } from "@/server/session";
import { checkinDeLaSemana, avancePlan } from "@/server/modules/checkin";
import { listarAcuerdos, listarAfirmaciones } from "@/server/modules/acuerdos";
import { PLANTILLAS_ACUERDO } from "@/content/plan-noviazgo";
import { formatDate } from "@/lib/utils";
import { rachaDePareja } from "@/server/modules/oracion";
import { fechaLocal, proximoHito } from "@/server/modules/fecha";
import type { Seccion } from "./tipos";

export const metadata = { title: "Pareja" };

const SECCIONES: Seccion[] = ["resumen", "checkin", "plan", "acuerdos", "palabras"];

export default async function ParejaPage({
  searchParams,
}: {
  searchParams: Promise<{ seccion?: string }>;
}) {
  const ctx = await contextoApp();
  const { seccion } = await searchParams;
  const seccionInicial = SECCIONES.find((s) => s === seccion) ?? "resumen";

  if (!ctx.pareja) {
    return (
      <div>
        <PageHeader eyebrow="Espacio de pareja" title="Todavía están los dos por juntarse" />
        <EmptyState
          icon={UserPlus}
          titulo="Invita a tu pareja"
          descripcion="Aquí vivirán el check-in semanal, los acuerdos que ambos confirman, las palabras de afirmación y el plan para conocerse a fondo. Se abre cuando acepte la invitación."
          accion={
            <Link href="/vincular" className={buttonStyles()}>
              Generar código
            </Link>
          }
        />
      </div>
    );
  }

  const hito = proximoHito(
    fechaLocal(ctx.zona, ctx.pareja.vinculadaEn),
    fechaLocal(ctx.zona),
  );

  const [checkin, plan, acuerdos, afirmaciones, racha] = await Promise.all([
    checkinDeLaSemana(
      ctx.userId,
      ctx.pareja.coupleId,
      ctx.pareja.parejaId,
      ctx.zona,
    ),
    avancePlan(ctx.userId, ctx.pareja.coupleId),
    listarAcuerdos(ctx.userId, ctx.pareja.coupleId),
    listarAfirmaciones(ctx.userId, ctx.pareja.coupleId),
    rachaDePareja(ctx.pareja.coupleId, ctx.zona),
  ]);

  return (
    <div>
      {/* Las dos fotos, superpuestas: lo primero que se ve al entrar. */}
      <div className="mb-6 flex justify-center">
        <AvatarPareja
          unoUrl={ctx.fotoUrl}
          unoNombre={ctx.nombre}
          dosUrl={ctx.parejaFotoUrl}
          dosNombre={ctx.pareja.parejaNombre}
          tamano="xl"
        />
      </div>

      <PageHeader
        eyebrow="Espacio de pareja"
        title={`${ctx.nombre} y ${ctx.pareja.parejaNombre}`}
        description={`Vinculados desde el ${formatDate(ctx.pareja.vinculadaEn, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`}
      />

      <PanelPareja
        miId={ctx.userId}
        nombrePareja={ctx.pareja.parejaNombre}
        checkin={{
          semanaInicio: checkin.semanaInicio,
          preguntas: [...checkin.preguntas],
          misRespuestas: checkin.misRespuestas,
          respuestasPareja: checkin.respuestasPareja,
          yoRespondi: checkin.yoRespondi,
          parejaRespondio: checkin.parejaRespondio,
          revelado: checkin.revelado,
        }}
        plan={{
          semana: plan.semana,
          totalSemanas: plan.totalSemanas,
          temaActual: plan.temaActual,
          completados: plan.completados.map((t) => t.titulo),
          siguientes: plan.siguientes.map((t) => t.titulo),
        }}
        acuerdos={acuerdos.map((a) => ({
          id: a.id,
          titulo: a.titulo,
          descripcion: a.descripcion,
          estado: a.estado,
          proximaRevision: a.proximaRevision,
          confirmadoPorMi: a.confirmadoPorMi,
          confirmadoPorAmbos: a.confirmadoPorAmbos,
        }))}
        plantillas={PLANTILLAS_ACUERDO}
        racha={racha}
        diasJuntos={ctx.pareja.diasJuntos}
        hito={{ dias: hito.dias, etiqueta: hito.etiqueta }}
        seccionInicial={seccionInicial}
        afirmaciones={afirmaciones.map((a) => ({
          id: a.id,
          mensaje: a.mensaje,
          favorita: a.favorita,
          mia: a.deId === ctx.userId,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
