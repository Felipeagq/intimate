import { Lock, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { eventosAuditoria } from "@/lib/mock-admin";

export const metadata = { title: "Auditoría" };

const tonoRol = {
  admin: "honey",
  soporte: "info",
  "—": "neutral",
} as const;

export default function AuditoriaPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Panel"
        title="Auditoría"
        description="Quién hizo qué en el panel. El registro no se puede editar ni borrar, tampoco por un admin."
        action={
          <Button variant="secondary" size="sm">
            <Download className="size-4" aria-hidden />
            Exportar
          </Button>
        }
      />

      <Card flat className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Eventos de auditoría del panel</caption>
            <thead className="border-ink-700/10 border-b dark:border-white/10">
              <tr className="text-muted text-left">
                {["Cuándo", "Quién", "Rol", "Acción", "Objetivo", "IP"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-5 py-3 font-medium whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {eventosAuditoria.map((e) => (
                <tr
                  key={e.id}
                  className="border-ink-700/8 border-b last:border-0 dark:border-white/8"
                >
                  <td className="text-muted px-5 py-4 whitespace-nowrap">
                    <time dateTime={e.fecha}>
                      {new Intl.DateTimeFormat("es", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "UTC",
                      }).format(new Date(e.fecha))}
                    </time>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">{e.actor}</td>
                  <td className="px-5 py-4">
                    <Badge tone={tonoRol[e.rol as keyof typeof tonoRol] ?? "neutral"}>
                      {e.rol}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <code className="bg-ink-700/8 rounded-md px-2 py-1 font-mono text-xs dark:bg-white/10">
                      {e.accion}
                    </code>
                  </td>
                  <td className="text-muted px-5 py-4 font-mono text-xs">
                    {e.objetivo}
                  </td>
                  <td className="text-muted px-5 py-4 font-mono text-xs">
                    {e.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card flat className="mt-4 flex items-start gap-3 p-5">
        <Lock className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
        <p className="text-muted text-sm leading-relaxed">
          Solo el rol admin ve esta pantalla. Las IP se guardan parcialmente y
          hay alertas por patrones anómalos, como muchas consultas de cuentas
          seguidas desde una misma sesión.
        </p>
      </Card>
    </div>
  );
}
