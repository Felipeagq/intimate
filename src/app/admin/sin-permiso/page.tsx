import Link from "next/link";
import { ShieldX } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { obtenerSesionAdmin } from "@/server/admin-session";

export const metadata = { title: "Sin permiso" };

export default async function SinPermisoPage() {
  const sesion = await obtenerSesionAdmin();

  return (
    <AdminShell nota="El intento quedó registrado en auditoría.">
      <Card flat className="p-7 text-center">
        <ShieldX className="text-muted mx-auto size-8" aria-hidden />
        <h1 className="mt-4 text-2xl">No tienes permiso</h1>
        <p className="text-muted mt-3 text-sm leading-relaxed">
          Tu rol es{" "}
          <span className="text-foreground font-medium">
            {sesion?.rol ?? "desconocido"}
          </span>{" "}
          y esta sección pide uno superior. Si crees que es un error, pídele a
          un admin que revise tus permisos.
        </p>
        <Link href="/admin" className={buttonStyles({ className: "mt-6" })}>
          Volver al panel
        </Link>
      </Card>
    </AdminShell>
  );
}
