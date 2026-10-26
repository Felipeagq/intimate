import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { obtenerSesionAdmin } from "@/server/admin-session";
import { ConfigurarMfaForm } from "./configurar-mfa-form";

export const metadata = { title: "Configurar segundo factor" };

export default async function ConfigurarMfaPage() {
  const sesion = await obtenerSesionAdmin();
  if (!sesion) redirect("/admin/entrar");
  if (sesion.dobleFactorActivo) redirect("/admin");

  return (
    <AdminShell nota="El segundo factor es obligatorio para todo el equipo. Sin él no se entra al panel.">
      <ConfigurarMfaForm email={sesion.email} />
    </AdminShell>
  );
}
