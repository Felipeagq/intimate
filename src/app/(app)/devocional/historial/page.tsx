import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Plus,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { contextoApp } from "@/server/session";
import {
  listarDevocionales,
  type ItemDevocional,
  type TipoHistorial,
} from "@/server/modules/devocional";
import { cn, formatDateOnly } from "@/lib/utils";

export const metadata = { title: "Todos los devocionales" };

const FILTROS: { id: TipoHistorial; etiqueta: string }[] = [
  { id: "todos", etiqueta: "Todos" },
  { id: "personal", etiqueta: "Personales" },
  { id: "pareja", etiqueta: "En pareja" },
];

function esTipo(valor: string | undefined): valor is TipoHistorial {
  return valor === "todos" || valor === "personal" || valor === "pareja";
}

/** "Octubre de 2026", para agrupar la lista. */
function mesDe(fecha: string) {
  return formatDateOnly(fecha, { month: "long", year: "numeric" });
}

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const ctx = await contextoApp();
  const { tipo: pedido } = await searchParams;
  const tipo: TipoHistorial = esTipo(pedido) ? pedido : "todos";

  const devocionales = await listarDevocionales(
    ctx.userId,
    ctx.pareja?.coupleId ?? null,
    { tipo },
  );

  // Agrupados por mes: una lista larga de fechas sueltas se vuelve difícil de
  // recorrer.
  const meses: { mes: string; items: ItemDevocional[] }[] = [];
  for (const item of devocionales) {
    const mes = mesDe(item.fechaLocal);
    const ultimo = meses[meses.length - 1];
    if (ultimo?.mes === mes) ultimo.items.push(item);
    else meses.push({ mes, items: [item] });
  }

  const nombrePareja = ctx.pareja?.parejaNombre ?? "tu pareja";

  return (
    <div>
      <Link
        href="/devocional"
        className="text-muted hover:text-foreground mb-4 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Devocional de hoy
      </Link>

      <PageHeader
        eyebrow="Devocional"
        title="Todos los devocionales"
        description="Lo que has hecho hasta hoy, lo tuyo y lo de los dos. Toca uno para abrirlo, seguir escribiendo o terminarlo."
        action={
          <Link href="/devocional/nuevo" className={buttonStyles()}>
            <Plus className="size-4" aria-hidden />
            Nuevo devocional
          </Link>
        }
      />

      <nav
        aria-label="Filtrar devocionales"
        className="glass mb-5 inline-flex gap-1 p-1.5"
      >
        {FILTROS.map((f) => (
          <Link
            key={f.id}
            href={
              f.id === "todos"
                ? "/devocional/historial"
                : `/devocional/historial?tipo=${f.id}`
            }
            aria-current={tipo === f.id ? "page" : undefined}
            className={cn(
              "flex min-h-11 cursor-pointer items-center rounded-2xl px-5 text-sm font-medium transition-colors duration-200",
              tipo === f.id
                ? "bg-honey-300 text-ink-700"
                : "text-muted hover:text-foreground",
            )}
          >
            {f.etiqueta}
          </Link>
        ))}
      </nav>

      {devocionales.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          titulo={
            tipo === "pareja"
              ? "Todavía no han hecho ninguno juntos"
              : "Todavía no hay devocionales"
          }
          descripcion={
            tipo === "pareja"
              ? "Cuando alguno de los dos elija un pasaje, el devocional aparecerá aquí con el estado de cada uno."
              : "Empieza el primero: eliges un pasaje y escribes lo que Dios te dijo, una sección a la vez."
          }
          accion={
            <Link href="/devocional/nuevo" className={buttonStyles()}>
              <Plus className="size-4" aria-hidden />
              Nuevo devocional
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <p className="text-muted text-sm">
            {devocionales.length}{" "}
            {devocionales.length === 1 ? "devocional" : "devocionales"}
          </p>

          {meses.map((grupo) => (
            <section key={grupo.mes}>
              <h2 className="text-muted mb-2 px-1 text-xs font-medium tracking-wide uppercase">
                {grupo.mes}
              </h2>
              <ul className="space-y-2">
                {grupo.items.map((item) => (
                  <li key={item.id}>
                    <Fila item={item} nombrePareja={nombrePareja} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Fila({
  item,
  nombrePareja,
}: {
  item: ItemDevocional;
  nombrePareja: string;
}) {
  const estado = estadoDe(item, nombrePareja);

  return (
    <Link href={`/devocional/${item.id}`} className="block cursor-pointer">
      <Card interactive className="flex items-center gap-4 p-4">
        <span
          className={cn(
            "flex size-11 shrink-0 flex-col items-center justify-center rounded-2xl text-center leading-none",
            item.completado
              ? "bg-honey-300 text-ink-700"
              : "bg-ink-700/8 text-muted dark:bg-white/10",
          )}
          aria-hidden
        >
          <span className="font-display text-base">
            {formatDateOnly(item.fechaLocal, { day: "numeric" })}
          </span>
          <span className="mt-0.5 text-[0.6rem] uppercase">
            {formatDateOnly(item.fechaLocal, { month: "short" }).replace(".", "")}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{item.titulo ?? item.pasaje}</p>
          <p className="text-muted mt-0.5 truncate text-sm">
            <span className="sr-only">
              {formatDateOnly(item.fechaLocal, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {". "}
            </span>
            {item.titulo ? `${item.pasaje} · ` : ""}
            {item.tipo === "pareja" ? "En pareja" : "Personal"}
          </p>
        </div>

        <Badge tone={estado.tono} className="hidden sm:inline-flex">
          <estado.icono className="size-3.5" aria-hidden />
          {estado.texto}
        </Badge>
        <ChevronRight className="text-muted size-4 shrink-0" aria-hidden />
      </Card>
    </Link>
  );
}

function estadoDe(item: ItemDevocional, nombrePareja: string) {
  if (item.tipo === "personal") {
    return item.completado
      ? { tono: "success" as const, texto: "Terminado", icono: Check }
      : { tono: "neutral" as const, texto: "Sin terminar", icono: Clock };
  }
  if (item.completado) {
    return { tono: "success" as const, texto: "Revelado", icono: Users };
  }
  return item.yoRespondi
    ? {
        tono: "warning" as const,
        texto: `Falta ${nombrePareja}`,
        icono: Clock,
      }
    : { tono: "neutral" as const, texto: "Te falta escribir", icono: Clock };
}
