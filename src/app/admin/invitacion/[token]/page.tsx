import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui/card";
import { verificarInvitacionEquipo } from "@/actions/equipo-invitacion";
import { AceptarInvitacionForm } from "./form";

export const metadata = { title: "Invitación al panel" };

export default async function InvitacionEquipoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitacion = await verificarInvitacionEquipo(token);

  if (!invitacion) {
    return (
      <AdminShell>
        <Card flat className="p-7 text-center">
          <h1 className="text-2xl">El enlace no es válido</h1>
          <p className="text-muted mt-3 text-sm leading-relaxed">
            Puede que ya se haya usado o que haya caducado. Pídele a quien te
            invitó que te mande una invitación nueva.
          </p>
        </Card>
      </AdminShell>
    );
  }

  return (
    <AdminShell nota="Después de crear tu cuenta, vas a configurar el segundo factor. Es obligatorio para todo el equipo.">
      <AceptarInvitacionForm
        token={token}
        email={invitacion.email}
        rol={invitacion.rol}
      />
    </AdminShell>
  );
}
