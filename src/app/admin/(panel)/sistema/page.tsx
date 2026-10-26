import { AlertTriangle, Check, MailWarning, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Comprobar } from "./comprobar";
import { requerirAdmin } from "@/server/admin-session";
import {
  correosFallidos,
  resumenCorreos,
  revisarConfiguracion,
} from "@/server/modules/sistema";

export const metadata = { title: "Sistema" };

const TIPOS: Record<string, string> = {
  codigo: "Código de acceso",
  vinculacion: "Vinculación",
  invitacion_equipo: "Invitación al equipo",
  soporte: "Soporte",
  prueba: "Prueba",
  otro: "Otro",
};

export default async function SistemaPage() {
  const sesion = await requerirAdmin(["admin", "soporte"]);

  const [resumen, fallidos] = await Promise.all([
    resumenCorreos(7),
    correosFallidos(30),
  ]);
  const config = revisarConfiguracion();

  return (
    <div>
      <PageHeader
        eyebrow="Panel"
        title="Sistema"
        description="Si algo falla, aquí se ve antes de que se queje un usuario. No muestra valores de configuración, solo si están definidos."
      />

      <div className="space-y-4">
        {config.avisos.length > 0 && (
          <Card flat className="p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className="size-5 text-amber-700 dark:text-amber-300"
                aria-hidden
              />
              <h2 className="text-lg">Requiere atención</h2>
            </div>
            <ul className="text-muted mt-3 space-y-2 text-sm leading-relaxed">
              {config.avisos.map((a) => (
                <li key={a}>· {a}</li>
              ))}
            </ul>
          </Card>
        )}

        <Card flat className="p-6">
          <h2 className="text-xl">Conexiones</h2>
          <p className="text-muted mt-1 mb-5 text-sm leading-relaxed">
            Hace peticiones reales a la base de datos, a SendGrid, a S3 y a la
            API bíblica. La de S3 escribe un archivo diminuto y lo borra. Por
            eso solo corre cuando lo pides, y queda en auditoría.
          </p>
          <Comprobar puedeEnviarPrueba={sesion.rol === "admin"} />
        </Card>

        <Card flat className="p-6">
          <div className="flex items-center gap-2">
            <MailWarning className="text-accent size-5" aria-hidden />
            <h2 className="text-xl">Correos de los últimos 7 días</h2>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <dt className="text-muted text-xs">Enviados</dt>
              <dd className="font-display mt-1 text-3xl tabular-nums">
                {resumen.enviados}
              </dd>
            </div>
            <div>
              <dt className="text-muted text-xs">Fallidos</dt>
              <dd
                className={
                  resumen.fallidos > 0
                    ? "font-display mt-1 text-3xl text-amber-800 tabular-nums dark:text-amber-300"
                    : "font-display mt-1 text-3xl tabular-nums"
                }
              >
                {resumen.fallidos}
              </dd>
            </div>
            <div>
              <dt className="text-muted text-xs">Entrega</dt>
              <dd className="font-display mt-1 text-3xl tabular-nums">
                {resumen.entrega === null ? "—" : `${resumen.entrega}%`}
              </dd>
            </div>
          </dl>

          {fallidos.length === 0 ? (
            <p className="text-muted mt-5 flex items-center gap-2 text-sm">
              <Check className="size-4 text-emerald-700 dark:text-emerald-400" aria-hidden />
              Ningún correo ha fallado.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Correos que no se pudieron enviar</caption>
                <thead className="border-ink-700/10 border-b dark:border-white/10">
                  <tr className="text-muted text-left">
                    <th scope="col" className="py-2 pr-4 font-medium">Cuándo</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Tipo</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Para</th>
                    <th scope="col" className="py-2 font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {fallidos.map((f) => (
                    <tr
                      key={f.id}
                      className="border-ink-700/8 border-b align-top last:border-0 dark:border-white/8"
                    >
                      <td className="text-muted py-2.5 pr-4 whitespace-nowrap">
                        <time dateTime={f.createdAt.toISOString()}>
                          {new Intl.DateTimeFormat("es", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(f.createdAt)}
                        </time>
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        <Badge tone="neutral">{TIPOS[f.tipo] ?? f.tipo}</Badge>
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">{f.para ?? "—"}</td>
                      <td className="text-muted py-2.5 text-xs leading-relaxed">
                        {f.error ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-muted mt-4 text-xs leading-relaxed">
            De los envíos correctos solo se cuenta el tipo y la fecha. El
            destinatario se guarda únicamente cuando el envío falla, que es
            cuando soporte lo necesita para ayudar.
          </p>
        </Card>

        <Card flat className="p-6">
          <h2 className="text-xl">Configuración</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {config.grupos.map((g) => (
              <div key={g.grupo}>
                <p className="text-sm font-medium">{g.grupo}</p>
                <ul className="mt-2 space-y-1.5">
                  {g.variables.map((v) => (
                    <li
                      key={v.nombre}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <code className="text-muted font-mono">{v.nombre}</code>
                      {v.definida ? (
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <Check className="size-3.5" aria-hidden />
                          definida
                        </span>
                      ) : (
                        <span
                          className={
                            v.obligatoria
                              ? "flex items-center gap-1 font-medium text-red-700 dark:text-red-400"
                              : "text-muted flex items-center gap-1"
                          }
                        >
                          <Minus className="size-3.5" aria-hidden />
                          {v.obligatoria ? "falta" : "sin definir"}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
