import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { obtenerSesionAdmin } from "@/server/admin-session";
import { AdminEntrarForm } from "./entrar-form";

export const metadata = { title: "Entrar al panel" };

export default async function AdminEntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ cuenta_creada?: string }>;
}) {
  const sesion = await obtenerSesionAdmin();
  if (sesion) {
    redirect(sesion.dobleFactorActivo ? "/admin" : "/admin/configurar-mfa");
  }

  const { cuenta_creada } = await searchParams;

  return (
    <AdminShell nota="Cada intento de acceso queda registrado en auditoría.">
      <AdminEntrarForm cuentaCreada={cuenta_creada === "1"} />
    </AdminShell>
  );
}
