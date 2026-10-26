import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Flame,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BotonOrar } from "./boton-orar";
import { contextoApp } from "@/server/session";
import { obtenerMetricas, rachaDePareja } from "@/server/modules/oracion";
import { promesaDelDia } from "@/server/modules/promesas";
import { devocionalDeParejaHoy } from "@/server/modules/devocional";
import { checkinDeLaSemana } from "@/server/modules/checkin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Inicio" };

export default async function InicioPage() {
  const ctx = await contextoApp();

  const [metricas, promesa] = await Promise.all([
    obtenerMetricas(ctx.userId, ctx.zona),
    promesaDelDia(ctx.userId, ctx.zona),
  ]);

  const devocional = ctx.pareja
    ? await devocionalDeParejaHoy(
        ctx.userId,
        ctx.pareja.coupleId,
        ctx.pareja.parejaId,
        ctx.zona,
      )
    : null;

  const checkin = ctx.pareja
    ? await checkinDeLaSemana(
        ctx.userId,
        ctx.pareja.coupleId,
        ctx.pareja.parejaId,
        ctx.zona,
      )
    : null;

  const racha = ctx.pareja
    ? await rachaDePareja(ctx.pareja.coupleId, ctx.zona)
    : 0;

  const hoy = formatDate(new Date(), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <p className="text-muted text-sm capitalize">{hoy}</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Hola, {ctx.nombre}</h1>
      </div>

      {/* --- Devocional de hoy --- */}
      {!ctx.pareja ? (
        <EmptyState
          icon={UserPlus}
          titulo="Invita a tu pareja"
          descripcion="El devocional de los dos, los acuerdos y la racha de pareja se abren cuando acepte la invitación. Mientras tanto, todo lo personal ya funciona."
          accion={
            <Link href="/vincular" className={buttonStyles()}>
              Generar código
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />
      ) : !devocional ? (
        <EmptyState
          icon={BookOpen}
          titulo="Aún no hay devocional de hoy"
          descripcion="Cualquiera de los dos puede elegir el pasaje. Cuando los dos escriban, se revelan las respuestas."
          accion={
            <Link href="/devocional" className={buttonStyles()}>
              Elegir pasaje
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />
      ) : (
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-muted text-xs tracking-wide uppercase">
                Devocional de hoy
              </p>
              <h2 className="mt-1.5 text-2xl">
                {devocional.titulo ?? devocional.pasaje}
              </h2>
              <p className="text-accent mt-1 text-sm font-medium">
                {devocional.pasaje}
              </p>
            </div>
            {racha > 0 && <Badge tone="honey">Día {racha}</Badge>}
          </div>

          <div className="border-ink-700/10 mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2 dark:border-white/10">
            <EstadoPersona
              nombre={ctx.nombre}
              listo={devocional.yoRespondi}
              textoListo="Ya escribiste"
              textoPendiente="Te falta escribir"
            />
            <EstadoPersona
              nombre={ctx.pareja.parejaNombre}
              listo={devocional.parejaRespondio}
              textoListo="Ya escribió"
              textoPendiente="Aún no responde"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/devocional" className={buttonStyles()}>
              {devocional.yoRespondi ? "Ver mi respuesta" : "Escribir ahora"}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            {devocional.yoRespondi && !devocional.parejaRespondio && (
              <p className="text-muted self-center text-sm">
                Se revela cuando {ctx.pareja.parejaNombre} escriba.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* --- Oración de un toque --- */}
      <BotonOrar
        yaRegistrado={metricas.hoyRegistrado}
        nombrePareja={ctx.pareja?.parejaNombre ?? null}
      />

      {/* --- Rachas --- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <Flame
            className={ctx.pareja ? "text-accent size-5" : "text-muted size-5"}
            aria-hidden
          />
          <p className="mt-3 font-display text-4xl">
            {ctx.pareja ? racha : "—"}
          </p>
          <p className="text-muted mt-1 text-sm">Racha de pareja</p>
        </Card>
        <Card className="p-5">
          <Flame className="text-muted size-5" aria-hidden />
          <p className="mt-3 font-display text-4xl">{metricas.racha}</p>
          <p className="text-muted mt-1 text-sm">Tu racha personal</p>
        </Card>
        <Card className="p-5">
          <Check className="text-muted size-5" aria-hidden />
          <p className="mt-3 font-display text-4xl">
            {metricas.constanciaDelMes}%
          </p>
          <p className="text-muted mt-1 text-sm">Constancia del mes</p>
        </Card>
      </div>

      {/* --- Check-in semanal --- */}
      {checkin && !checkin.revelado && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BookOpen className="text-accent size-4" aria-hidden />
                <p className="text-muted text-xs tracking-wide uppercase">
                  Check-in semanal
                </p>
              </div>
              <p className="mt-2 font-medium">
                Semana del {formatDate(checkin.semanaInicio)}
              </p>
              <p className="text-muted mt-1 text-sm">
                {checkin.yoRespondi
                  ? `Ya respondiste. Falta ${ctx.pareja?.parejaNombre}.`
                  : `${checkin.preguntas.length} preguntas, dos minutos.`}
              </p>
            </div>
            <Link
              href="/pareja"
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              {checkin.yoRespondi ? "Ver" : "Responder"}
            </Link>
          </div>
        </Card>
      )}

      {/* --- Promesa del día --- */}
      {promesa ? (
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="text-accent size-4" aria-hidden />
            <p className="text-muted text-xs tracking-wide uppercase">
              Promesa del día
            </p>
          </div>
          <blockquote className="mt-3">
            <p className="font-display text-xl leading-relaxed">
              “{promesa.texto}”
            </p>
            <cite className="text-accent mt-3 block text-sm font-medium not-italic">
              {promesa.cita}
            </cite>
          </blockquote>
          {promesa.contexto && (
            <p className="text-muted border-ink-700/10 mt-4 border-t pt-4 text-sm leading-relaxed dark:border-white/10">
              La guardaste el {formatDate(promesa.createdAt)}: {promesa.contexto}
            </p>
          )}
        </Card>
      ) : (
        <EmptyState
          icon={Sparkles}
          titulo="Tu banco de promesas está vacío"
          descripcion="Guarda el primer versículo que Dios te haya dado, con el contexto de cuándo lo recibiste. Con el tiempo se vuelve un registro de su fidelidad."
          accion={
            <Link href="/promesas" className={buttonStyles()}>
              Guardar una promesa
            </Link>
          }
        />
      )}
    </div>
  );
}

function EstadoPersona({
  nombre,
  listo,
  textoListo,
  textoPendiente,
}: {
  nombre: string;
  listo: boolean;
  textoListo: string;
  textoPendiente: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={
          listo
            ? "bg-honey-300 text-ink-700 flex size-10 items-center justify-center rounded-full"
            : "border-ink-700/25 text-muted flex size-10 items-center justify-center rounded-full border border-dashed dark:border-white/25"
        }
        aria-hidden
      >
        {listo ? (
          <Check className="size-4" />
        ) : (
          <span className="text-xs">···</span>
        )}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{nombre}</p>
        <p className="text-muted text-xs">
          {listo ? textoListo : textoPendiente}
        </p>
      </div>
    </div>
  );
}
