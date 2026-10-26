import { PageHeader } from "@/components/ui/page-header";
import { contextoApp } from "@/server/session";
import { devocionalDeParejaHoy } from "@/server/modules/devocional";
import { NuevoView } from "./nuevo-view";

export const metadata = { title: "Nuevo devocional" };

export default async function NuevoDevocionalPage() {
  const ctx = await contextoApp();

  // Si la pareja ya tiene el de hoy, no se ofrece crear otro: se ofrece abrirlo.
  const deParejaHoy = ctx.pareja
    ? await devocionalDeParejaHoy(
        ctx.userId,
        ctx.pareja.coupleId,
        ctx.pareja.parejaId,
        ctx.zona,
      )
    : null;

  return (
    <div>

      <PageHeader
        volver={{ href: "/devocional/historial", etiqueta: "Todos los devocionales" }}
        eyebrow="Devocional"
        title="Nuevo devocional"
        description="Elige el pasaje para empezar. Puedes hacer varios personales el mismo día; el de pareja es uno al día, para los dos."
      />

      <NuevoView
        tienePareja={Boolean(ctx.pareja)}
        nombrePareja={ctx.pareja?.parejaNombre ?? null}
        idDeParejaHoy={deParejaHoy?.id ?? null}
      />
    </div>
  );
}
