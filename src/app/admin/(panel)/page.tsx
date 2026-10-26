import { TrendingUp, TrendingDown, ShieldCheck, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requerirAdmin } from "@/server/admin-session";
import {
  obtenerMetricas,
  serieParejasActivas,
  usuariosActivosDesde,
} from "@/server/modules/admin";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  await requerirAdmin();

  const [metricas, serie, activos7] = await Promise.all([
    obtenerMetricas(),
    serieParejasActivas(),
    usuariosActivosDesde(7),
  ]);

  const tarjetas = [
    {
      label: "Parejas activas esta semana",
      dato: metricas.parejasActivas,
      nota: "Métrica norte: ambos usaron la app",
    },
    { label: "Usuarios registrados", dato: metricas.usuarios },
    {
      label: "Usuarios activos (7 días)",
      dato: { valor: activos7, delta: null },
    },
    { label: "Parejas vinculadas", dato: metricas.parejasVinculadas },
    { label: "Devocionales esta semana", dato: metricas.devocionalesSemana },
    {
      label: "Invitaciones aceptadas",
      dato: metricas.aceptacionInvitacion,
      sufijo: "%",
    },
  ];

  const max = Math.max(...serie.map((s) => s.valor), 1);
  const sinDatos = serie.every((s) => s.valor === 0);

  return (
    <div>
      <PageHeader
        eyebrow="Panel"
        title="Dashboard"
        description="Solo datos agregados. Ninguna pantalla del panel muestra contenido escrito por un usuario."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tarjetas.map(({ label, dato, nota, sufijo }) => {
          const sube = (dato.delta ?? 0) >= 0;
          const Icono =
            dato.delta === null ? Minus : sube ? TrendingUp : TrendingDown;
          return (
            <Card key={label} flat className="p-5">
              <p className="text-muted text-sm">{label}</p>
              <div className="mt-2 flex items-baseline gap-3">
                <p className="font-display text-4xl">
                  {dato.valor.toLocaleString("es")}
                  {sufijo}
                </p>
                {dato.delta !== null && (
                  <span
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium",
                      sube
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-800 dark:text-amber-300",
                    )}
                  >
                    <Icono className="size-4" aria-hidden />
                    {sube ? "+" : ""}
                    {dato.delta}%
                  </span>
                )}
              </div>
              {nota && <p className="text-muted mt-2 text-xs">{nota}</p>}
            </Card>
          );
        })}
      </div>

      <Card flat className="mt-4 p-6">
        <h2 className="text-xl">Parejas activas por semana</h2>
        <p className="text-muted mt-1 text-sm">Últimas 12 semanas</p>

        {sinDatos ? (
          <p className="text-muted mt-6 leading-relaxed">
            Todavía no hay parejas activas que graficar. Esta serie cuenta las
            parejas en las que ambos miembros registraron oración durante la
            semana.
          </p>
        ) : (
          <>
            <div
              className="mt-6 flex h-48 items-end gap-2"
              role="img"
              aria-label={`Serie de parejas activas, de ${serie[0].valor} a ${serie.at(-1)?.valor} en 12 semanas.`}
            >
              {serie.map((s, i) => (
                <div key={s.semana} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-muted text-[0.65rem]">{s.valor}</span>
                  <div
                    className={cn(
                      "w-full rounded-t-lg",
                      i === serie.length - 1 ? "bg-honey-500" : "bg-honey-300",
                    )}
                    style={{ height: `${(s.valor / max) * 100}%` }}
                  />
                </div>
              ))}
            </div>

            <details className="mt-5">
              <summary className="text-muted hover:text-foreground cursor-pointer text-sm">
                Ver los datos en tabla
              </summary>
              <table className="mt-3 w-full text-sm">
                <caption className="sr-only">
                  Parejas activas por semana, últimas 12 semanas
                </caption>
                <thead>
                  <tr className="text-muted text-left">
                    <th scope="col" className="py-1.5 font-medium">
                      Semana del
                    </th>
                    <th scope="col" className="py-1.5 font-medium">
                      Parejas activas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {serie.map((s) => (
                    <tr
                      key={s.semana}
                      className="border-ink-700/8 border-t dark:border-white/8"
                    >
                      <td className="py-1.5">{formatDate(s.semana)}</td>
                      <td className="py-1.5">{s.valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </Card>

      <Card flat className="mt-4 flex items-start gap-3 p-5">
        <ShieldCheck className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
        <p className="text-muted text-sm leading-relaxed">
          Estas cifras salen de contar registros, nunca de leerlos. El panel no
          tiene ninguna consulta que devuelva devocionales, promesas, peticiones
          ni afirmaciones.
        </p>
      </Card>
    </div>
  );
}
