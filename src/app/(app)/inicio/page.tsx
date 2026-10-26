import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Flame,
  HandHeart,
  MessageCircleHeart,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import {
  checkInSemanal,
  devocionalHoy,
  pareja,
  promesas,
  rachas,
  usuario,
} from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Inicio" };

const promesaDelDia = promesas[0];

export default function InicioPage() {
  const hoy = formatDate(new Date(), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <p className="text-muted text-sm capitalize">{hoy}</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Hola, {usuario.nombre}</h1>
      </div>

      {/* Devocional de hoy: la acción principal de la pantalla. */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-muted text-xs tracking-wide uppercase">
              Devocional de hoy
            </p>
            <h2 className="mt-1.5 text-2xl">{devocionalHoy.titulo}</h2>
            <p className="text-accent mt-1 text-sm font-medium">
              {devocionalHoy.pasaje}
            </p>
          </div>
          <Badge tone="honey">Día {pareja.rachaPareja}</Badge>
        </div>

        <div className="border-ink-700/10 mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2 dark:border-white/10">
          <EstadoPersona
            nombre={usuario.nombre}
            listo={devocionalHoy.yoRespondi}
            textoListo="Ya escribiste"
            textoPendiente="Te falta escribir"
          />
          <EstadoPersona
            nombre={pareja.nombre}
            listo={devocionalHoy.parejaRespondio}
            textoListo="Ya escribió"
            textoPendiente="Aún no responde"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/devocional" className={buttonStyles()}>
            {devocionalHoy.yoRespondi ? "Ver mi respuesta" : "Escribir ahora"}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          {devocionalHoy.yoRespondi && !devocionalHoy.parejaRespondio && (
            <p className="text-muted self-center text-sm">
              Se revela cuando {pareja.nombre} escriba.
            </p>
          )}
        </div>
      </Card>

      {/* Acciones de un toque */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center gap-4 p-5" interactive>
          <span className="bg-honey-300 text-ink-700 flex size-12 shrink-0 items-center justify-center rounded-2xl">
            <HandHeart className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-medium">Hoy oré</p>
            <p className="text-muted text-sm">Registra tu oración del día.</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5" interactive>
          <span className="bg-honey-300 text-ink-700 flex size-12 shrink-0 items-center justify-center rounded-2xl">
            <MessageCircleHeart className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-medium">Estoy orando por ti</p>
            <p className="text-muted text-sm">
              Avísale a {pareja.nombre} sin escribir nada.
            </p>
          </div>
        </Card>
      </div>

      {/* Rachas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <Flame className="text-accent size-5" aria-hidden />
          <p className="mt-3 font-[family-name:var(--font-display)] text-4xl">
            {pareja.rachaPareja}
          </p>
          <p className="text-muted mt-1 text-sm">Racha de pareja</p>
        </Card>
        <Card className="p-5">
          <Flame className="text-muted size-5" aria-hidden />
          <p className="mt-3 font-[family-name:var(--font-display)] text-4xl">
            {rachas.actual}
          </p>
          <p className="text-muted mt-1 text-sm">Tu racha personal</p>
        </Card>
        <Card className="p-5">
          <Check className="text-muted size-5" aria-hidden />
          <p className="mt-3 font-[family-name:var(--font-display)] text-4xl">
            {rachas.constanciaDelMes}%
          </p>
          <p className="text-muted mt-1 text-sm">Constancia del mes</p>
        </Card>
      </div>

      {/* Check-in semanal pendiente */}
      {!checkInSemanal.parejaRespondio && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BookOpen className="text-accent size-4" aria-hidden />
                <p className="text-muted text-xs tracking-wide uppercase">
                  Check-in semanal
                </p>
              </div>
              <p className="mt-2 font-medium">{checkInSemanal.semana}</p>
              <p className="text-muted mt-1 text-sm">
                {checkInSemanal.yoRespondi
                  ? `Ya respondiste. Falta ${pareja.nombre}.`
                  : `${checkInSemanal.preguntas.length} preguntas, dos minutos.`}
              </p>
            </div>
            <Link
              href="/pareja"
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              {checkInSemanal.yoRespondi ? "Ver" : "Responder"}
            </Link>
          </div>
        </Card>
      )}

      {/* Promesa del día */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="text-accent size-4" aria-hidden />
          <p className="text-muted text-xs tracking-wide uppercase">
            Promesa del día
          </p>
        </div>
        <blockquote className="mt-3">
          <p className="font-[family-name:var(--font-display)] text-xl leading-relaxed">
            “{promesaDelDia.texto}”
          </p>
          <cite className="text-accent mt-3 block text-sm font-medium not-italic">
            {promesaDelDia.cita}
          </cite>
        </blockquote>
        <p className="text-muted border-ink-700/10 mt-4 border-t pt-4 text-sm leading-relaxed dark:border-white/10">
          La guardaste el {formatDate(promesaDelDia.fecha)}:{" "}
          {promesaDelDia.contexto}
        </p>
      </Card>
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
        {listo ? <Check className="size-4" /> : <span className="text-xs">···</span>}
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
