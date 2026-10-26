import { TrendingUp, TrendingDown, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { metricas, serieParejas } from "@/lib/mock-admin";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const tarjetas = [
  {
    label: "Parejas activas esta semana",
    dato: metricas.parejasActivas,
    nota: "Métrica norte: ambos usaron la app",
  },
  { label: "Usuarios activos", dato: metricas.usuariosActivos },
  { label: "Parejas vinculadas", dato: metricas.parejasVinculadas },
  { label: "Devocionales por semana", dato: metricas.devocionalesSemana },
  {
    label: "Invitación aceptada en 7 días",
    dato: metricas.aceptacionInvitacion,
    sufijo: "%",
  },
  { label: "Retención D30 por pareja", dato: metricas.retencionD30, sufijo: "%" },
];

export default function AdminDashboard() {
  const max = Math.max(...serieParejas);

  return (
    <div>
      <PageHeader
        eyebrow="Panel"
        title="Dashboard"
        description="Solo datos agregados. Ninguna pantalla del panel muestra contenido escrito por un usuario."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tarjetas.map(({ label, dato, nota, sufijo }) => {
          const sube = dato.delta >= 0;
          const Icono = sube ? TrendingUp : TrendingDown;
          return (
            <Card key={label} flat className="p-5">
              <p className="text-muted text-sm">{label}</p>
              <div className="mt-2 flex items-baseline gap-3">
                <p className="font-display text-4xl">
                  {dato.valor.toLocaleString("es")}
                  {sufijo}
                </p>
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
              </div>
              {nota && <p className="text-muted mt-2 text-xs">{nota}</p>}
            </Card>
          );
        })}
      </div>

      {/* Serie de la métrica norte. Barras: comparación entre periodos discretos. */}
      <Card flat className="mt-4 p-6">
        <h2 className="text-xl">Parejas activas por semana</h2>
        <p className="text-muted mt-1 text-sm">Últimas 12 semanas</p>

        <div className="mt-6 flex h-48 items-end gap-2" role="img"
          aria-label={`Serie de parejas activas, de ${serieParejas[0]} a ${serieParejas.at(-1)} en 12 semanas.`}
        >
          {serieParejas.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-muted text-[0.65rem]">{v}</span>
              <div
                className={cn(
                  "w-full rounded-t-lg",
                  i === serieParejas.length - 1
                    ? "bg-honey-500"
                    : "bg-honey-300",
                )}
                style={{ height: `${(v / max) * 100}%` }}
              />
            </div>
          ))}
        </div>

        {/* Tabla alternativa: accesible para lectores de pantalla. */}
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
                <th scope="col" className="py-1.5 font-medium">Semana</th>
                <th scope="col" className="py-1.5 font-medium">Parejas activas</th>
              </tr>
            </thead>
            <tbody>
              {serieParejas.map((v, i) => (
                <tr key={i} className="border-ink-700/8 border-t dark:border-white/8">
                  <td className="py-1.5">{i + 1}</td>
                  <td className="py-1.5">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Card>

      <Card flat className="mt-4 flex items-start gap-3 p-5">
        <ShieldCheck className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
        <p className="text-muted text-sm leading-relaxed">
          La analítica registra eventos como “completó devocional”, nunca el
          contenido. El rol del panel no tiene permiso de descifrado en KMS, así
          que ni siquiera con acceso a la base se pueden leer los textos.
        </p>
      </Card>
    </div>
  );
}
