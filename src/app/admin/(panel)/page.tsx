import Link from "next/link";
import { MailWarning, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TarjetaMetrica } from "./tarjeta-metrica";
import { PageHeader } from "@/components/ui/page-header";
import { requerirAdmin } from "@/server/admin-session";
import {
  obtenerMetricas,
  serieParejasActivas,
  usuariosActivosDesde,
  distribucionDeRachas,
  embudoActivacion,
  retencionPorCohorte,
  desgloseModulos,
} from "@/server/modules/admin";
import { resumenCorreos } from "@/server/modules/sistema";
import {
  DesgloseModulos,
  DistribucionRachas,
  Embudo,
  RetencionCohortes,
} from "./graficos";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  await requerirAdmin();

  const [metricas, serie, activos7, rachas, cohortes, modulos, correos] =
    await Promise.all([
      obtenerMetricas(),
      serieParejasActivas(),
      usuariosActivosDesde(7),
      distribucionDeRachas(),
      retencionPorCohorte(),
      desgloseModulos(),
      resumenCorreos(7),
    ]);

  // El embudo reutiliza la distribución ya calculada en lugar de recorrer
  // todas las parejas otra vez.
  const embudo = await embudoActivacion(rachas);

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
    {
      label: "Devocionales de pareja esta semana",
      dato: metricas.devocionalesSemana,
    },
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

      {/* Un fallo de correo es silencioso para el usuario: no llega su código
          y no sabe por qué. Se avisa aquí para no depender de que alguien
          entre a mirar la pantalla de Sistema. */}
      {correos.fallidos > 0 && (
        <Link
          href="/admin/sistema"
          className="mb-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-amber-500/14 p-4 transition-colors duration-200 hover:bg-amber-500/22"
        >
          <MailWarning
            className="mt-0.5 size-5 shrink-0 text-amber-800 dark:text-amber-300"
            aria-hidden
          />
          <span className="text-sm leading-relaxed">
            <strong className="font-medium">
              {correos.fallidos}{" "}
              {correos.fallidos === 1
                ? "correo no se pudo enviar"
                : "correos no se pudieron enviar"}
            </strong>{" "}
            esta semana. Si son códigos de acceso, alguien se quedó sin poder
            entrar. Ver detalle →
          </span>
        </Link>
      )}

      {/* Dos por fila en teléfono; la métrica norte ocupa el ancho completo.
          Si queda una suelta al final, también lo ocupa, para no dejar un
          hueco. En escritorio son tres columnas y no hace falta nada de eso. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        {tarjetas.map(({ label, dato, nota, sufijo }, i) => {
          const esPrimera = i === 0;
          const quedaSuelta =
            i === tarjetas.length - 1 && (tarjetas.length - 1) % 2 === 1;

          return (
            <TarjetaMetrica
              key={label}
              label={label}
              dato={dato}
              nota={nota}
              sufijo={sufijo}
              destacada={esPrimera}
              className={
                esPrimera || quedaSuelta
                  ? "col-span-2 lg:col-span-1"
                  : undefined
              }
            />
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

      <div className="mt-4 space-y-4">
        <Embudo pasos={embudo} />

        <div className="grid gap-4 lg:grid-cols-2">
          <DistribucionRachas buckets={rachas} />
          <DesgloseModulos filas={modulos} />
        </div>

        <RetencionCohortes filas={cohortes} />
      </div>

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
