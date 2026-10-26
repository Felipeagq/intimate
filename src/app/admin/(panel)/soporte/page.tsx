import { EyeOff, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TablaCuentas } from "./tabla-cuentas";
import { requerirAdmin } from "@/server/admin-session";
import { buscarCuentas } from "@/server/modules/admin";

export const metadata = { title: "Soporte" };

export default async function SoportePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sesion = await requerirAdmin(["admin", "soporte"]);
  const { q } = await searchParams;

  const cuentas = await buscarCuentas(q?.trim() || undefined);

  return (
    <div>
      <PageHeader
        eyebrow="Panel"
        title="Soporte"
        description="Busca una cuenta por correo para ayudar a un usuario. Se ve su estado, nunca lo que escribió en la app. Los mensajes que envía al equipo están en la Bandeja."
      />

      {cuentas.length === 0 && !q ? (
        <EmptyState
          flat
          icon={Users}
          titulo="Todavía no hay cuentas"
          descripcion="Cuando alguien se registre en la app, aparecerá aquí con su estado y su último acceso."
        />
      ) : (
        <TablaCuentas
          busquedaInicial={q ?? ""}
          puedeOperar={sesion.rol === "admin" || sesion.rol === "soporte"}
          cuentas={cuentas.map((c) => ({
            id: c.id,
            email: c.email,
            estado: c.estado,
            pareja: c.pareja,
            creada: c.creada.toISOString(),
            ultimoAcceso: c.ultimoAcceso
              ? new Date(c.ultimoAcceso).toISOString()
              : null,
          }))}
        />
      )}

      <Card flat className="mt-4 flex items-start gap-3 p-5">
        <EyeOff className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="text-muted text-sm leading-relaxed">
          <p>
            Suspender una cuenta cierra sus sesiones abiertas de inmediato: sin
            eso, la persona seguiría dentro hasta que caducara su cookie.
          </p>
          <p className="mt-2">
            Cada acción de esta pantalla queda registrada en auditoría, con
            quién la hizo y cuándo.
          </p>
        </div>
      </Card>
    </div>
  );
}
