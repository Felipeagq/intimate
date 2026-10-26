import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { contextoApp } from "@/server/session";
import { obtenerDevocional } from "@/server/modules/devocional";
import { fechaLocal } from "@/server/modules/fecha";
import { formatDateOnly } from "@/lib/utils";
import { DevocionalParejaDetalle } from "../editor-pareja";
import { EditorPersonal } from "../editor-personal";

export const metadata = { title: "Devocional" };

// Un id que no es UUID no llega a la base: la consulta fallaría con un error
// de tipo en lugar de un 404 limpio.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function DevocionalDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const ctx = await contextoApp();
  const encontrado = await obtenerDevocional(ctx.userId, id);
  // null tanto si no existe como si no es suyo: el detalle no confirma la
  // existencia de un devocional ajeno.
  if (!encontrado) notFound();

  const fecha =
    encontrado.tipo === "personal"
      ? encontrado.personal.fechaLocal
      : encontrado.pareja.fechaLocal;
  const esDeHoy = fecha === fechaLocal(ctx.zona);

  const titulo = formatDateOnly(fecha, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>

      <PageHeader
        volver={{ href: "/devocional/historial", etiqueta: "Todos los devocionales" }}
        eyebrow={encontrado.tipo === "pareja" ? "En pareja" : "Personal"}
        title={esDeHoy ? "Hoy" : titulo}
        description={esDeHoy ? titulo : undefined}
        action={esDeHoy ? <Badge tone="honey">Cuenta para hoy</Badge> : undefined}
      />

      {encontrado.tipo === "pareja" ? (
        <DevocionalParejaDetalle
          devocional={encontrado.pareja}
          nombrePareja={ctx.pareja?.parejaNombre ?? "tu pareja"}
          miNombre={ctx.nombre}
          esDeHoy={esDeHoy}
        />
      ) : (
        <EditorPersonal inicial={encontrado.personal} esDeHoy={esDeHoy} />
      )}
    </div>
  );
}
