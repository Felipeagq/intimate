import { Users, Flag, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { requerirAdmin } from "@/server/admin-session";
import { listarEquipo } from "@/server/modules/admin";
import { listarInvitacionesPendientes } from "@/server/modules/equipo";
import { PanelEquipo } from "./panel-equipo";
import {
  PREGUNTAS_CHECKIN,
  TEMAS_PLAN,
  PLANTILLAS_ACUERDO,
} from "@/content/plan-noviazgo";

export const metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const sesion = await requerirAdmin(["admin"]);

  const [equipo, invitaciones] = await Promise.all([
    listarEquipo(),
    listarInvitacionesPendientes(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Panel"
        title="Configuración"
        description="El estado real del sistema. Lo que todavía no se puede cambiar desde aquí está marcado como tal."
      />

      <div className="space-y-4">
        <Card flat className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="text-accent size-5" aria-hidden />
              <h2 className="text-xl">Equipo</h2>
            </div>
            <Badge tone="neutral">{equipo.length} cuentas</Badge>
          </div>

          <PanelEquipo
            miCorreo={sesion.email}
            equipo={equipo.map((m) => ({
              id: m.id,
              email: m.email,
              rol: m.rol ?? "lectura",
              mfa: Boolean(m.mfa),
              creada: m.creada.toISOString(),
            }))}
            invitaciones={invitaciones.map((i) => ({
              id: i.id,
              email: i.email,
              rol: i.rol,
              expiraEn: i.expiraEn.toISOString(),
            }))}
          />

          <p className="text-muted mt-4 text-xs leading-relaxed">
            El segundo factor es obligatorio para todo el equipo. La sesión
            del panel dura 8 horas y no sirve en la app, ni la de la app aquí.
            El registro público está desactivado: solo se entra por
            invitación.
          </p>
        </Card>

        <Card flat className="p-6">
          <div className="flex items-center gap-2">
            <BookOpen className="text-accent size-5" aria-hidden />
            <h2 className="text-xl">Contenido editorial</h2>
          </div>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Vive versionado en el repositorio, no en la base de datos. Editarlo
            desde el panel es trabajo de fase 2.
          </p>

          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-muted text-sm">Preguntas del check-in</dt>
              <dd className="font-display mt-1 text-3xl">
                {PREGUNTAS_CHECKIN.length}
              </dd>
            </div>
            <div>
              <dt className="text-muted text-sm">Temas del plan</dt>
              <dd className="font-display mt-1 text-3xl">{TEMAS_PLAN.length}</dd>
            </div>
            <div>
              <dt className="text-muted text-sm">Plantillas de acuerdo</dt>
              <dd className="font-display mt-1 text-3xl">
                {PLANTILLAS_ACUERDO.length}
              </dd>
            </div>
          </dl>

          <p className="mt-4 rounded-2xl bg-amber-500/12 p-4 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
            Este contenido es un primer borrador y no ha pasado revisión
            pastoral. Conviene resolverlo antes de que lo vean parejas reales.
          </p>
        </Card>

        <Card flat className="p-6">
          <div className="flex items-center gap-2">
            <Flag className="text-accent size-5" aria-hidden />
            <h2 className="text-xl">Pendiente de construir</h2>
          </div>
          <ul className="text-muted mt-4 space-y-2 text-sm leading-relaxed">
            <li>· Feature flags y versión mínima de la app</li>
            <li>· Textos de notificaciones editables</li>
            <li>· Recordatorios programados y exportación de datos</li>
          </ul>
          <p className="text-muted mt-4 text-xs leading-relaxed">
            Está escrito aquí a propósito: una pantalla de configuración con
            interruptores que no hacen nada es peor que una lista honesta.
          </p>
        </Card>
      </div>
    </div>
  );
}
