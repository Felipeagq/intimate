import { Smartphone, Bell, Users, Flag, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { equipo } from "@/lib/mock-admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Configuración" };

const flags = [
  { id: "checkin", label: "Check-in semanal", activa: true, fase: "MVP" },
  { id: "conociendonos", label: "Plan Conociéndonos a fondo", activa: true, fase: "MVP" },
  { id: "predicas", label: "Notas de prédicas", activa: false, fase: "Fase 2" },
  { id: "ia", label: "Acompañamiento con IA", activa: false, fase: "Fase 2" },
  { id: "premium", label: "Suscripción premium", activa: false, fase: "Fase 2" },
];

const tonoRol = { admin: "honey", soporte: "info", lectura: "neutral" } as const;

export default function ConfiguracionPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Panel"
        title="Configuración"
        description="Lo que se puede cambiar sin desplegar. Cada cambio queda en auditoría."
      />

      <div className="space-y-4">
        <Card flat className="p-6">
          <div className="flex items-center gap-2">
            <Smartphone className="text-accent size-5" aria-hidden />
            <h2 className="text-xl">Versión mínima</h2>
          </div>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Por debajo de esta versión, la app pide actualizar antes de
            continuar. Úsalo solo cuando un cambio rompa compatibilidad.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Field htmlFor="version" label="Versión" className="max-w-40">
              <Input id="version" defaultValue="1.4.0" />
            </Field>
            <Button>Guardar</Button>
          </div>
        </Card>

        <Card flat className="p-6">
          <div className="flex items-center gap-2">
            <Flag className="text-accent size-5" aria-hidden />
            <h2 className="text-xl">Feature flags</h2>
          </div>
          <ul className="mt-4 space-y-1">
            {flags.map((f) => (
              <li
                key={f.id}
                className="border-ink-700/8 flex min-h-14 items-center justify-between gap-4 border-b last:border-0 dark:border-white/8"
              >
                <label htmlFor={f.id} className="flex cursor-pointer items-center gap-3 text-sm">
                  {f.label}
                  <Badge tone={f.fase === "MVP" ? "success" : "neutral"}>
                    {f.fase}
                  </Badge>
                </label>
                <input
                  type="checkbox"
                  id={f.id}
                  defaultChecked={f.activa}
                  className="accent-honey-500 size-5 cursor-pointer"
                />
              </li>
            ))}
          </ul>
        </Card>

        <Card flat className="p-6">
          <div className="flex items-center gap-2">
            <Bell className="text-accent size-5" aria-hidden />
            <h2 className="text-xl">Textos de notificaciones</h2>
          </div>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Sin presión ni culpa. Nunca comparan a los dos miembros de la
            pareja.
          </p>
          <div className="mt-4 space-y-4">
            <Field htmlFor="n-devocional" label="Recordatorio del devocional">
              <Input
                id="n-devocional"
                defaultValue="Su devocional de hoy los espera."
              />
            </Field>
            <Field
              htmlFor="n-racha"
              label="Racha en riesgo"
              hint="Máximo una al día"
            >
              <Input
                id="n-racha"
                defaultValue="Hoy todavía cuenta. ¿Oramos un momento?"
              />
            </Field>
          </div>
        </Card>

        <Card flat className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="text-accent size-5" aria-hidden />
              <h2 className="text-xl">Equipo</h2>
            </div>
            <Button size="sm" variant="secondary">
              Invitar
            </Button>
          </div>

          <ul className="mt-4 space-y-1">
            {equipo.map((m) => (
              <li
                key={m.email}
                className="border-ink-700/8 flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0 dark:border-white/8"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{m.email}</p>
                  <p className="text-muted flex items-center gap-1.5 text-xs">
                    <KeyRound className="size-3" aria-hidden />
                    {m.mfa} · entró el {formatDate(m.ultimoAcceso)}
                  </p>
                </div>
                <Badge tone={tonoRol[m.rol]}>{m.rol}</Badge>
              </li>
            ))}
          </ul>

          <p className="text-muted mt-4 text-xs leading-relaxed">
            El MFA es obligatorio para todo el equipo. La sesión del panel dura
            8 horas y no sirve en la app, ni la de la app aquí.
          </p>
        </Card>
      </div>
    </div>
  );
}
