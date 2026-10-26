import Link from "next/link";
import { ArrowLeft, Lock, UserX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { AccionesCuenta } from "./acciones";
import { requerirAdmin } from "@/server/admin-session";
import { obtenerDetalleCuenta } from "@/server/modules/admin";
import { eventosDeCuenta } from "@/server/modules/auditoria";
import { registrarConsulta } from "@/actions/admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Detalle de cuenta" };

const TONO_ESTADO = {
  activa: "success",
  suspendida: "warning",
  "eliminación pendiente": "danger",
} as const;

export default async function DetalleCuentaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await requerirAdmin(["admin", "soporte"]);
  const { id } = await params;

  const detalle = await obtenerDetalleCuenta(id);

  if (!detalle) {
    return (
      <div>
        <PageHeader eyebrow="Soporte" title="Cuenta no encontrada" />
        <EmptyState
          flat
          icon={UserX}
          titulo="No existe esa cuenta"
          descripcion="Puede que ya se haya eliminado, o que el enlace esté mal."
        />
      </div>
    );
  }

  // Cada mirada a una cuenta ajena queda registrada, no solo las acciones
  // que cambian algo.
  await registrarConsulta(detalle.email);

  const eventos =
    sesion.rol === "admin" ? await eventosDeCuenta(detalle.email) : [];

  return (
    <div>
      <Link
        href="/admin/soporte"
        className="text-muted hover:text-foreground mb-4 flex cursor-pointer items-center gap-1.5 text-sm transition-colors duration-200"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Soporte
      </Link>

      <PageHeader
        eyebrow="Soporte"
        title={detalle.email}
        description={`Cuenta creada el ${formatDate(detalle.creada, { day: "numeric", month: "long", year: "numeric" })}`}
        action={<Badge tone={TONO_ESTADO[detalle.estado as keyof typeof TONO_ESTADO] ?? "neutral"}>{detalle.estado}</Badge>}
      />

      <div className="space-y-4">
        <Card flat className="p-6">
          <h2 className="text-xl">Cuenta</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Último acceso</dt>
              <dd className="font-medium">
                {detalle.ultimoAcceso ? formatDate(detalle.ultimoAcceso) : "nunca"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted font-mono text-xs">{detalle.id}</dt>
            </div>
          </dl>

          <div className="border-ink-700/10 mt-5 border-t pt-5 dark:border-white/10">
            <AccionesCuenta
              cuenta={{ id: detalle.id, email: detalle.email, estado: detalle.estado }}
              pareja={detalle.pareja}
              puedeOperar={sesion.rol === "admin" || sesion.rol === "soporte"}
            />
          </div>
        </Card>

        <Card flat className="p-6">
          <h2 className="text-xl">Pareja</h2>
          {!detalle.pareja ? (
            <p className="text-muted mt-2 text-sm leading-relaxed">
              Esta cuenta no se ha vinculado con nadie.
            </p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Vinculada con</dt>
                <dd className="font-medium">{detalle.pareja.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Estado</dt>
                <dd>
                  <Badge tone={detalle.pareja.estado === "activa" ? "success" : "neutral"}>
                    {detalle.pareja.estado}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Vinculados desde</dt>
                <dd className="font-medium">{formatDate(detalle.pareja.vinculadaEn)}</dd>
              </div>
              {detalle.pareja.archivadaEn && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Archivada el</dt>
                  <dd className="font-medium">{formatDate(detalle.pareja.archivadaEn)}</dd>
                </div>
              )}
            </div>
          )}
        </Card>

        {sesion.rol === "admin" && (
          <Card flat className="p-6">
            <div className="flex items-center gap-2">
              <Lock className="text-accent size-4" aria-hidden />
              <h2 className="text-xl">Auditoría de esta cuenta</h2>
            </div>

            {eventos.length === 0 ? (
              <p className="text-muted mt-3 text-sm leading-relaxed">
                Sin eventos todavía.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    Eventos de auditoría sobre {detalle.email}
                  </caption>
                  <thead className="border-ink-700/10 border-b dark:border-white/10">
                    <tr className="text-muted text-left">
                      <th scope="col" className="py-2 pr-4 font-medium">Cuándo</th>
                      <th scope="col" className="py-2 pr-4 font-medium">Quién</th>
                      <th scope="col" className="py-2 font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventos.map((e) => (
                      <tr
                        key={e.id}
                        className="border-ink-700/8 border-b last:border-0 dark:border-white/8"
                      >
                        <td className="text-muted py-2 pr-4 whitespace-nowrap">
                          <time dateTime={e.createdAt.toISOString()}>
                            {new Intl.DateTimeFormat("es", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(e.createdAt)}
                          </time>
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">{e.actor}</td>
                        <td className="py-2">
                          <code className="bg-ink-700/8 rounded-md px-2 py-1 font-mono text-xs dark:bg-white/10">
                            {e.accion}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
