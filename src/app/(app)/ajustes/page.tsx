import { Bell, Fingerprint, Mail, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { CerrarSesion } from "./cerrar-sesion";
import { SubirFoto } from "@/components/subir-foto";
import { EditarPerfil } from "./editar-perfil";
import { SelectorZona } from "./selector-zona";
import { ZonaDelicada } from "./zona-delicada";
import { contextoApp } from "@/server/session";
import { desfaseDe, listarZonas } from "@/server/modules/zona";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const ctx = await contextoApp();

  // La lista sale del servidor y no del navegador: si cada uno armara la
  // suya, podrían diferir y React avisaría de un desajuste al hidratar.
  const opcionesZona = listarZonas().map((z) => ({
    valor: z,
    etiqueta: `${z.replaceAll("_", " ")} (${desfaseDe(z)})`,
  }));

  return (
    <div>
      <PageHeader eyebrow="Ajustes" title="Tu cuenta" />

      <div className="space-y-4">
        <Card className="p-6">
          <h2 className="text-xl">Tu perfil</h2>
          <p className="text-muted mt-2 mb-5 text-sm leading-relaxed">
            Tu foto y tu nombre son lo que ve tu pareja en el espacio de los
            dos.
          </p>

          <SubirFoto urlActual={ctx.fotoUrl} nombre={ctx.nombre} />

          <div className="border-ink-700/10 mt-6 border-t pt-6 dark:border-white/10">
            <EditarPerfil
              nombreInicial={ctx.nombreCompleto}
              telefonoInicial={ctx.telefono}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl">Cuenta</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted flex items-center gap-2">
                <Mail className="size-4" aria-hidden />
                Correo
              </dt>
              <dd className="font-medium">{ctx.email}</dd>
            </div>
          </dl>

          <div className="border-ink-700/10 mt-5 border-t pt-5 dark:border-white/10">
            <SelectorZona zonaActual={ctx.zona} opciones={opcionesZona} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Bell className="text-accent size-5" aria-hidden />
            <h2 className="text-xl">Notificaciones</h2>
          </div>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Todavía no están conectadas. El envío de correo ya funciona, pero
            los recordatorios programados necesitan un proceso aparte, porque
            el alojamiento no ejecuta tareas en segundo plano.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Fingerprint className="text-accent size-5" aria-hidden />
            <h2 className="text-xl">Bloqueo de la app</h2>
          </div>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Pendiente. La idea es pedir tu huella, rostro o PIN al abrir
            Intimate, para proteger lo que escribes si alguien toma tu
            teléfono.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl">Tus datos</h2>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Podrás llevarte todo lo que has escrito, en cualquier momento. La
            exportación aún no está construida.
          </p>
          <Button variant="secondary" className="mt-4" disabled>
            <Download className="size-4" aria-hidden />
            Exportar mis datos
          </Button>
        </Card>

        <ZonaDelicada
          nombrePareja={ctx.pareja?.parejaNombre ?? null}
          vinculadaEn={
            ctx.pareja ? formatDate(ctx.pareja.vinculadaEn) : null
          }
        />

        <CerrarSesion />
      </div>
    </div>
  );
}
