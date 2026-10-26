import { Clock, Flame, HandHeart, Plus, Check, Archive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { mapaCalor, peticiones, rachas } from "@/lib/mock-data";
import { formatDate, cn } from "@/lib/utils";

export const metadata = { title: "Oración" };

const niveles = [
  { clase: "bg-ink-700/8 dark:bg-white/8", texto: "sin registro" },
  {
    clase: "bg-ink-700/15 dark:bg-white/15 ring-1 ring-dashed ring-ink-700/30",
    texto: "día de gracia",
  },
  { clase: "bg-honey-300", texto: "oraste" },
  { clase: "bg-honey-500", texto: "devocional completo" },
];

export default function OracionPage() {
  const activas = peticiones.filter((p) => p.estado === "activa");
  const respondidas = peticiones.filter((p) => p.estado === "respondida");

  return (
    <div>
      <PageHeader
        eyebrow="Oración"
        title="Tu constancia"
        description="La racha se calcula con tu zona horaria y tienes un día de gracia por semana que no la rompe."
      />

      <div className="space-y-4">
        {/* Acción de un toque */}
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="bg-honey-300 text-ink-700 flex size-14 shrink-0 items-center justify-center rounded-2xl">
                <HandHeart className="size-6" aria-hidden />
              </span>
              <div>
                <p className="text-lg font-medium">Hoy oré</p>
                <p className="text-muted text-sm">
                  Un toque. Si quieres, también puedes medir los minutos.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary">
                <Clock className="size-4" aria-hidden />
                Temporizador
              </Button>
              <Button>Registrar</Button>
            </div>
          </div>
        </Card>

        {/* Métricas */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-5">
            <Flame className="text-accent size-5" aria-hidden />
            <p className="mt-3 font-display text-4xl">
              {rachas.actual}
            </p>
            <p className="text-muted mt-1 text-sm">Racha actual</p>
          </Card>
          <Card className="p-5">
            <p className="text-muted text-sm">Racha más larga</p>
            <p className="mt-2 font-display text-4xl">
              {rachas.masLarga}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-muted text-sm">Constancia del mes</p>
            <p className="mt-2 font-display text-4xl">
              {rachas.constanciaDelMes}%
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-muted text-sm">Minutos esta semana</p>
            <p className="mt-2 font-display text-4xl">
              {rachas.minutosEstaSemana}
            </p>
          </Card>
        </div>

        {/* Mapa de calor */}
        <Card className="p-6">
          <h2 className="text-xl">Últimos cuatro meses</h2>
          <div
            className="mt-5 grid grid-flow-col gap-1 overflow-x-auto pb-2"
            style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
            role="img"
            aria-label={`Mapa de constancia: ${rachas.constanciaDelMes}% del mes con oración registrada.`}
          >
            {mapaCalor.map((nivel, i) => (
              <span
                key={i}
                title={niveles[nivel].texto}
                className={cn("size-3.5 rounded-[4px]", niveles[nivel].clase)}
              />
            ))}
          </div>
          <ul className="text-muted mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {niveles.map((n) => (
              <li key={n.texto} className="flex items-center gap-1.5">
                <span className={cn("size-3 rounded-[4px]", n.clase)} aria-hidden />
                {n.texto}
              </li>
            ))}
          </ul>
        </Card>

        {/* Peticiones */}
        <div className="flex items-center justify-between pt-4">
          <h2 className="text-2xl">Peticiones</h2>
          <button className={buttonStyles({ size: "sm", variant: "secondary" })}>
            <Plus className="size-4" aria-hidden />
            Nueva
          </button>
        </div>

        <div className="space-y-3">
          {activas.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg">{p.titulo}</h3>
                  <p className="text-muted mt-1 text-sm leading-relaxed">
                    {p.detalle}
                  </p>
                </div>
                {p.compartida && <Badge tone="honey">Compartida</Badge>}
              </div>
              <div className="border-ink-700/10 mt-4 flex flex-wrap items-center gap-3 border-t pt-4 dark:border-white/10">
                <span className="text-muted text-xs">
                  Desde el {formatDate(p.fecha)}
                </span>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="ghost">
                    <Archive className="size-4" aria-hidden />
                    Archivar
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Check className="size-4" aria-hidden />
                    Respondida
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {respondidas.length > 0 && (
          <>
            <h3 className="text-muted pt-4 text-sm font-medium tracking-wide uppercase">
              Oraciones respondidas · {respondidas.length}
            </h3>
            <div className="space-y-3">
              {respondidas.map((p) => (
                <Card key={p.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-lg">{p.titulo}</h3>
                    <Badge tone="success">
                      Respondida el {formatDate(p.respondidaEn!)}
                    </Badge>
                  </div>
                  {p.nota && (
                    <p className="mt-2 leading-relaxed italic">“{p.nota}”</p>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
