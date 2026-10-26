import {
  Bell,
  Download,
  Fingerprint,
  Globe,
  LogOut,
  Trash2,
  UserMinus,
  Mail,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { pareja, usuario } from "@/lib/mock-data";

export const metadata = { title: "Ajustes" };

const notificaciones = [
  { id: "devocional", label: "Recordatorio del devocional", activa: true },
  { id: "racha", label: "Racha en riesgo", activa: true, nota: "Máximo una al día" },
  { id: "afirmacion", label: "Recibí una afirmación", activa: true },
  { id: "pareja", label: `${pareja.nombre} respondió el devocional`, activa: true },
];

export default function AjustesPage() {
  return (
    <div>
      <PageHeader eyebrow="Ajustes" title="Tu cuenta" />

      <div className="space-y-4">
        <Card className="p-6">
          <h2 className="text-xl">Cuenta</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted flex items-center gap-2">
                <Mail className="size-4" aria-hidden />
                Correo
              </dt>
              <dd className="font-medium">{usuario.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted flex items-center gap-2">
                <Globe className="size-4" aria-hidden />
                Zona horaria
              </dt>
              <dd className="font-medium">{usuario.zonaHoraria}</dd>
            </div>
          </dl>
          <p className="text-muted mt-4 text-xs leading-relaxed">
            Tu zona horaria decide qué cuenta como “hoy” para la racha. Orar a
            las 23:50 cuenta para ese día.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Bell className="text-accent size-5" aria-hidden />
            <h2 className="text-xl">Notificaciones</h2>
          </div>
          <ul className="mt-4 space-y-1">
            {notificaciones.map((n) => (
              <li
                key={n.id}
                className="flex min-h-12 items-center justify-between gap-4"
              >
                <label htmlFor={n.id} className="cursor-pointer text-sm">
                  {n.label}
                  {n.nota && (
                    <span className="text-muted block text-xs">{n.nota}</span>
                  )}
                </label>
                <input
                  type="checkbox"
                  id={n.id}
                  defaultChecked={n.activa}
                  className="accent-honey-500 size-5 cursor-pointer"
                />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Fingerprint className="text-accent size-5" aria-hidden />
            <h2 className="text-xl">Bloqueo de la app</h2>
          </div>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Pide tu huella, rostro o PIN cada vez que abras Intimate. Lo que
            escribes aquí es privado; esto lo protege si alguien toma tu
            teléfono.
          </p>
          <Button variant="secondary" className="mt-4">
            Activar bloqueo
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl">Tus datos</h2>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Puedes llevarte todo lo que has escrito, en cualquier momento.
          </p>
          <Button variant="secondary" className="mt-4">
            <Download className="size-4" aria-hidden />
            Exportar mis datos
          </Button>
        </Card>

        {/* Acciones delicadas, separadas visualmente del resto. */}
        <Card className="border-red-900/15 p-6 dark:border-red-400/20">
          <h2 className="text-xl">Zona delicada</h2>

          <div className="border-ink-700/10 mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-5 dark:border-white/10">
            <div className="min-w-0">
              <p className="font-medium">Desvincularme de {pareja.nombre}</p>
              <p className="text-muted mt-1 max-w-md text-sm leading-relaxed">
                Es inmediato. Conservas todo lo que tú escribiste; el espacio
                compartido se archiva y ninguno de los dos podrá leer lo del
                otro.
              </p>
            </div>
            <Button variant="secondary">
              <UserMinus className="size-4" aria-hidden />
              Desvincular
            </Button>
          </div>

          <div className="border-ink-700/10 mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-5 dark:border-white/10">
            <div className="min-w-0">
              <p className="font-medium">Eliminar mi cuenta</p>
              <p className="text-muted mt-1 max-w-md text-sm leading-relaxed">
                Borra tu cuenta y todo tu contenido. No se puede deshacer.
              </p>
            </div>
            <Button variant="danger">
              <Trash2 className="size-4" aria-hidden />
              Eliminar
            </Button>
          </div>
        </Card>

        <Button variant="ghost" className="w-full">
          <LogOut className="size-4" aria-hidden />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
