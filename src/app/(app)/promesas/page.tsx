import { Plus, Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { promesas } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Promesas" };

export default function PromesasPage() {
  const cumplidas = promesas.filter((p) => p.cumplida).length;

  return (
    <div>
      <PageHeader
        eyebrow="Promesas"
        title="Tu banco de promesas"
        description="Lo que Dios te ha dicho, con el contexto de cuándo lo recibiste. Con el tiempo se vuelve un registro de su fidelidad."
        action={
          <button className={buttonStyles({ size: "sm" })}>
            <Plus className="size-4" aria-hidden />
            Nueva promesa
          </button>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-6 p-5">
        <div>
          <p className="font-display text-3xl">
            {promesas.length}
          </p>
          <p className="text-muted text-sm">guardadas</p>
        </div>
        <div className="bg-ink-700/10 h-10 w-px dark:bg-white/10" aria-hidden />
        <div>
          <p className="font-display text-3xl">
            {cumplidas}
          </p>
          <p className="text-muted text-sm">cumplidas</p>
        </div>
        <p className="text-muted ml-auto max-w-xs text-sm leading-relaxed">
          La promesa del día sale de aquí y no se repite hasta recorrer todo el
          banco.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {promesas.map((p) => (
          <Card key={p.id} className="flex flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-accent text-sm font-medium">{p.cita}</p>
              {p.cumplida ? (
                <Badge tone="success">
                  <Check className="size-3" aria-hidden />
                  Cumplida
                </Badge>
              ) : (
                <Badge tone="neutral">Esperando</Badge>
              )}
            </div>

            <blockquote className="mt-3 flex-1">
              <p className="font-display text-lg leading-relaxed">
                “{p.texto}”
              </p>
            </blockquote>

            <p className="text-muted mt-4 text-sm leading-relaxed">
              {p.contexto}
            </p>

            {p.cumplida && p.testimonio && (
              <div className="bg-honey-300/30 mt-4 rounded-2xl p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                  <Sparkles className="size-3" aria-hidden />
                  Testimonio
                </p>
                <p className="mt-1.5 text-sm leading-relaxed">{p.testimonio}</p>
              </div>
            )}

            <div className="border-ink-700/10 mt-4 flex flex-wrap items-center gap-2 border-t pt-4 dark:border-white/10">
              <span className="text-muted text-xs">
                {formatDate(p.fecha, { day: "numeric", month: "short", year: "numeric" })}
              </span>
              {p.etiquetas.map((e) => (
                <Badge key={e} tone="neutral" className="text-[0.65rem]">
                  {e}
                </Badge>
              ))}
              {!p.cumplida && (
                <Button size="sm" variant="ghost" className="ml-auto">
                  Marcar cumplida
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
