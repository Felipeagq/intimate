import { Lock, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requerirAdmin } from "@/server/admin-session";
import { listarEventos } from "@/server/modules/auditoria";

export const metadata = { title: "Auditoría" };

const TONO_ROL: Record<string, "honey" | "info" | "neutral"> = {
  admin: "honey",
  soporte: "info",
};

export default async function AuditoriaPage() {
  await requerirAdmin(["admin"]);
  const eventos = await listarEventos();

  return (
    <div>
      <PageHeader
        eyebrow="Panel"
        title="Auditoría"
        description="Quién hizo qué en el panel. El registro solo crece: no hay ninguna función para editarlo ni borrarlo, tampoco para un admin."
      />

      {eventos.length === 0 ? (
        <EmptyState
          flat
          icon={ScrollText}
          titulo="Sin eventos todavía"
          descripcion="Cada acción del equipo que modifique datos deja una línea aquí: quién, qué, sobre qué cuenta y desde dónde."
        />
      ) : (
        <Card flat className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Eventos de auditoría del panel</caption>
              <thead className="border-ink-700/10 border-b dark:border-white/10">
                <tr className="text-muted text-left">
                  {["Cuándo", "Quién", "Rol", "Acción", "Objetivo", "IP"].map(
                    (h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-5 py-3 font-medium whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {eventos.map((e) => (
                  <tr
                    key={e.id}
                    className="border-ink-700/8 border-b last:border-0 dark:border-white/8"
                  >
                    <td className="text-muted px-5 py-4 whitespace-nowrap">
                      <time dateTime={e.createdAt.toISOString()}>
                        {new Intl.DateTimeFormat("es", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(e.createdAt)}
                      </time>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">{e.actor}</td>
                    <td className="px-5 py-4">
                      <Badge tone={TONO_ROL[e.rol] ?? "neutral"}>{e.rol}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <code className="bg-ink-700/8 rounded-md px-2 py-1 font-mono text-xs dark:bg-white/10">
                        {e.accion}
                      </code>
                    </td>
                    <td className="text-muted px-5 py-4 font-mono text-xs">
                      {e.objetivo ?? "—"}
                    </td>
                    <td className="text-muted px-5 py-4 font-mono text-xs">
                      {e.ip ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card flat className="mt-4 flex items-start gap-3 p-5">
        <Lock className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
        <p className="text-muted text-sm leading-relaxed">
          Solo el rol admin ve esta pantalla. Las IP se guardan recortadas a sus
          dos primeros grupos: suficiente para detectar patrones anómalos, no
          para rastrear a nadie.
        </p>
      </Card>
    </div>
  );
}
