import { KeyRound, Users, Flag, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { requerirAdmin } from "@/server/admin-session";
import { listarEquipo } from "@/server/modules/admin";
import {
  PREGUNTAS_CHECKIN,
  TEMAS_PLAN,
  PLANTILLAS_ACUERDO,
} from "@/content/plan-noviazgo";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Configuración" };

const TONO_ROL = { admin: "honey", soporte: "info", lectura: "neutral" } as const;

export default async function ConfiguracionPage() {
  await requerirAdmin(["admin"]);
  const equipo = await listarEquipo();

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

          <ul className="mt-4 space-y-1">
            {equipo.map((m) => (
              <li
                key={m.id}
                className="border-ink-700/8 flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0 dark:border-white/8"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{m.email}</p>
                  <p className="text-muted flex items-center gap-1.5 text-xs">
                    <KeyRound className="size-3" aria-hidden />
                    {m.mfa ? "segundo factor activo" : "sin segundo factor"} ·
                    desde el {formatDate(m.creada)}
                  </p>
                </div>
                <Badge tone={TONO_ROL[m.rol as keyof typeof TONO_ROL] ?? "neutral"}>
                  {m.rol}
                </Badge>
              </li>
            ))}
          </ul>

          <p className="text-muted mt-4 text-xs leading-relaxed">
            Las cuentas del equipo se crean con{" "}
            <code className="bg-ink-700/8 rounded px-1.5 py-0.5 font-mono dark:bg-white/10">
              pnpm seed:admin
            </code>
            . Crearlas desde el panel todavía no está construido. El registro
            público está desactivado, así que no hay otra forma de entrar.
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
            <li>· Invitar cuentas del equipo desde el panel</li>
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
