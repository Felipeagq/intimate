import Link from "next/link";
import { Inbox, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requerirAdmin } from "@/server/admin-session";
import {
  CATEGORIAS,
  contarPendientes,
  listarTickets,
  type Categoria,
  type FiltroTickets,
} from "@/server/modules/soporte";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Bandeja" };

const FILTROS: { valor: FiltroTickets; etiqueta: string }[] = [
  { valor: "abiertos", etiqueta: "Abiertos" },
  { valor: "nuevo", etiqueta: "Nuevos" },
  { valor: "en_curso", etiqueta: "En curso" },
  { valor: "resuelto", etiqueta: "Resueltos" },
  { valor: "todos", etiqueta: "Todos" },
];

const ESTADO = {
  nuevo: { etiqueta: "Nuevo", tono: "warning" },
  en_curso: { etiqueta: "En curso", tono: "info" },
  resuelto: { etiqueta: "Resuelto", tono: "success" },
} as const;

function esFiltro(v: string | undefined): v is FiltroTickets {
  return FILTROS.some((f) => f.valor === v);
}

export default async function BandejaPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  await requerirAdmin(["admin", "soporte"]);

  const { estado } = await searchParams;
  const filtro: FiltroTickets = esFiltro(estado) ? estado : "abiertos";

  const [tickets, pendientes] = await Promise.all([
    listarTickets(filtro),
    contarPendientes(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Panel"
        title="Bandeja"
        description="Mensajes que la gente le escribió al equipo. Es lo único del panel que muestra texto de un usuario, porque lo dirigió a ustedes a propósito; nunca trae nada de lo que escribió dentro de la app."
      />

      {pendientes.urgentes > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-amber-500/14 p-4">
          <ShieldAlert
            className="mt-0.5 size-5 shrink-0 text-amber-800 dark:text-amber-300"
            aria-hidden
          />
          <p className="text-sm leading-relaxed">
            <strong className="font-medium">
              {pendientes.urgentes}{" "}
              {pendientes.urgentes === 1
                ? "reporte urgente sin resolver"
                : "reportes urgentes sin resolver"}
            </strong>
            . Los reportes de abuso van primero en la lista.
          </p>
        </div>
      )}

      <nav aria-label="Filtrar mensajes" className="mb-4 flex gap-1 overflow-x-auto">
        {FILTROS.map((f) => (
          <Link
            key={f.valor}
            href={f.valor === "abiertos" ? "/admin/bandeja" : `/admin/bandeja?estado=${f.valor}`}
            aria-current={f.valor === filtro ? "page" : undefined}
            className={cn(
              "min-h-11 shrink-0 cursor-pointer rounded-full px-4 text-sm font-medium leading-[2.75rem] transition-colors duration-200",
              f.valor === filtro
                ? "bg-honey-300 text-ink-700"
                : "text-muted hover:text-foreground",
            )}
          >
            {f.etiqueta}
          </Link>
        ))}
      </nav>

      {tickets.length === 0 ? (
        <EmptyState
          flat
          icon={Inbox}
          titulo={filtro === "abiertos" ? "Nada pendiente" : "No hay mensajes aquí"}
          descripcion={
            filtro === "abiertos"
              ? "Cuando alguien escriba desde Ajustes o desde la página de ayuda, aparece aquí."
              : "Ningún mensaje coincide con este filtro."
          }
        />
      ) : (
        <ul className="space-y-3">
          {tickets.map((t) => {
            const urgente = t.prioridad === "urgente" && t.estado !== "resuelto";
            const est = ESTADO[t.estado as keyof typeof ESTADO] ?? ESTADO.nuevo;

            return (
              <li key={t.id}>
                <Link
                  href={`/admin/bandeja/${t.id}`}
                  className="block cursor-pointer"
                >
                  <Card
                    flat
                    interactive
                    className={cn("p-5", urgente && "ring-1 ring-amber-500/50")}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {urgente && <Badge tone="danger">Urgente</Badge>}
                      <Badge tone="neutral">
                        {CATEGORIAS[t.categoria as Categoria] ?? t.categoria}
                      </Badge>
                      <Badge tone={est.tono}>{est.etiqueta}</Badge>
                      {!t.verificado && <Badge tone="warning">Sin verificar</Badge>}
                      <span className="text-muted ml-auto text-xs">
                        {formatDate(t.createdAt, {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-medium">{t.email}</p>
                    <p className="text-muted mt-1 line-clamp-2 text-sm leading-relaxed">
                      {t.mensaje}
                    </p>
                    {t.asignadoA && (
                      <p className="text-muted mt-2 text-xs">
                        Lo atiende {t.asignadoA}
                      </p>
                    )}
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
