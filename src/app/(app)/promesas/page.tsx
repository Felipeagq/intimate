import { PageHeader } from "@/components/ui/page-header";
import { PanelPromesas } from "./panel-promesas";
import { contextoApp } from "@/server/session";
import { contarPromesas, listarPromesas } from "@/server/modules/promesas";

export const metadata = { title: "Promesas" };

export default async function PromesasPage() {
  const ctx = await contextoApp();

  const [lista, conteo] = await Promise.all([
    listarPromesas(ctx.userId),
    contarPromesas(ctx.userId),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Promesas"
        title="Tu banco de promesas"
        description="Lo que Dios te ha dicho, con el contexto de cuándo lo recibiste. Con el tiempo se vuelve un registro de su fidelidad."
      />

      <PanelPromesas
        promesas={lista.map((p) => ({
          id: p.id,
          cita: p.cita,
          texto: p.texto,
          contexto: p.contexto,
          etiquetas: p.etiquetas,
          cumplida: p.cumplida,
          cumplidaEn: p.cumplidaEn?.toISOString() ?? null,
          testimonio: p.testimonio,
          createdAt: p.createdAt.toISOString(),
        }))}
        total={conteo.total}
        cumplidas={conteo.cumplidas}
      />
    </div>
  );
}
