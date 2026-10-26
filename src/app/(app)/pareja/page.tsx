import {
  Heart,
  Plus,
  ScrollText,
  Lock,
  Check,
  MessageCircleHeart,
  Compass,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  acuerdos,
  afirmaciones,
  checkInSemanal,
  conociendonos,
  pareja,
  usuario,
} from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Pareja" };

const tonoEstado = {
  vigente: "success",
  "en revisión": "warning",
  cumplido: "info",
} as const;

export default function ParejaPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Espacio de pareja"
        title={`${usuario.nombre} y ${pareja.nombre}`}
        description={`Vinculados desde el ${formatDate(pareja.vinculadaEn, { day: "numeric", month: "long", year: "numeric" })} · ${pareja.diasJuntos} días`}
      />

      <div className="space-y-4">
        {/* Check-in semanal */}
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-muted text-xs tracking-wide uppercase">
                Check-in semanal
              </p>
              <h2 className="mt-1.5 text-2xl">{checkInSemanal.semana}</h2>
            </div>
            <Badge tone={checkInSemanal.parejaRespondio ? "success" : "warning"}>
              {checkInSemanal.parejaRespondio
                ? "Los dos respondieron"
                : `Falta ${pareja.nombre}`}
            </Badge>
          </div>

          <ol className="mt-5 space-y-3">
            {checkInSemanal.preguntas.map((q, i) => (
              <li key={q} className="flex gap-3">
                <span className="bg-honey-300 text-ink-700 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {i + 1}
                </span>
                <p className="leading-relaxed">{q}</p>
              </li>
            ))}
          </ol>

          <div className="border-ink-700/10 mt-5 flex items-center gap-3 border-t pt-5 dark:border-white/10">
            {checkInSemanal.yoRespondi ? (
              <p className="text-muted flex items-center gap-2 text-sm">
                <Lock className="size-4" aria-hidden />
                Ya respondiste. Se revela cuando {pareja.nombre} termine.
              </p>
            ) : (
              <Button>Responder</Button>
            )}
          </div>
        </Card>

        {/* Conociéndonos a fondo */}
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Compass className="text-accent size-4" aria-hidden />
            <p className="text-muted text-xs tracking-wide uppercase">
              Conociéndonos a fondo
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl">{conociendonos.temaActual}</h2>
              <p className="text-muted mt-1 text-sm">
                Semana {conociendonos.semana} de {conociendonos.totalSemanas}
              </p>
            </div>
            <Button variant="secondary">Abrir conversación</Button>
          </div>

          <div
            className="bg-ink-700/10 mt-5 h-2 overflow-hidden rounded-full dark:bg-white/12"
            role="progressbar"
            aria-valuenow={conociendonos.semana}
            aria-valuemin={0}
            aria-valuemax={conociendonos.totalSemanas}
            aria-label="Avance del plan"
          >
            <div
              className="bg-honey-500 h-full rounded-full"
              style={{
                width: `${(conociendonos.semana / conociendonos.totalSemanas) * 100}%`,
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {conociendonos.completados.map((t) => (
              <Badge key={t} tone="neutral">
                <Check className="size-3" aria-hidden />
                {t}
              </Badge>
            ))}
            {conociendonos.siguientes.slice(0, 3).map((t) => (
              <Badge key={t} tone="neutral" className="opacity-55">
                {t}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Acuerdos */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <ScrollText className="text-accent size-5" aria-hidden />
            <h2 className="text-2xl">Acuerdos</h2>
          </div>
          <button className={buttonStyles({ size: "sm", variant: "secondary" })}>
            <Plus className="size-4" aria-hidden />
            Nuevo
          </button>
        </div>

        <div className="space-y-3">
          {acuerdos.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg">{a.titulo}</h3>
                  <p className="text-muted mt-1 leading-relaxed">
                    {a.descripcion}
                  </p>
                </div>
                <Badge tone={tonoEstado[a.estado]}>{a.estado}</Badge>
              </div>

              <div className="border-ink-700/10 mt-4 flex flex-wrap items-center gap-3 border-t pt-4 text-xs dark:border-white/10">
                {a.confirmadoPorAmbos ? (
                  <span className="text-muted flex items-center gap-1.5">
                    <Check className="size-3.5" aria-hidden />
                    Confirmado por los dos
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
                    Esperando que {pareja.nombre} confirme el cambio
                  </span>
                )}
                {a.proximaRevision && (
                  <span className="text-muted ml-auto">
                    Se revisa el {formatDate(a.proximaRevision)}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>

        <p className="text-muted px-2 text-sm leading-relaxed">
          Cambiar un acuerdo vigente requiere que los dos lo confirmen. Nada se
          modifica por una sola persona.
        </p>

        {/* Afirmaciones */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <MessageCircleHeart className="text-accent size-5" aria-hidden />
            <h2 className="text-2xl">Palabras de afirmación</h2>
          </div>
          <button className={buttonStyles({ size: "sm" })}>
            <Plus className="size-4" aria-hidden />
            Escribir
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {afirmaciones.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-muted text-xs">
                  De {a.de} · {formatDate(a.fecha)}
                </p>
                <Heart
                  className={
                    a.favorita
                      ? "text-accent size-4 fill-current"
                      : "text-muted size-4"
                  }
                  aria-label={a.favorita ? "Favorita" : undefined}
                />
              </div>
              <p className="mt-3 font-display text-lg leading-relaxed">
                {a.mensaje}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
