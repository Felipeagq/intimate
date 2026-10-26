import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { obtenerSesionAdmin } from "@/server/admin-session";
import { VerificarForm } from "./verificar-form";

export const metadata = { title: "Verificación" };

export default async function VerificarPage() {
  // Con la sesión ya completa no hay nada que verificar.
  const sesion = await obtenerSesionAdmin();
  if (sesion?.dobleFactorActivo) redirect("/admin");

  return (
    <AdminShell nota="¿Perdiste el dispositivo? Usa uno de tus códigos de respaldo.">
      <VerificarForm />
    </AdminShell>
  );
}
