"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Check, Plus, Sparkles, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { BuscarPasaje } from "@/components/buscar-pasaje";
import { crearPromesa, marcarPromesaCumplida } from "@/actions/app";
import { formatDate } from "@/lib/utils";

type Promesa = {
  id: string;
  cita: string;
  texto: string;
  contexto: string | null;
  etiquetas: string[];
  cumplida: boolean;
  cumplidaEn: string | null;
  testimonio: string | null;
  createdAt: string;
};

export function PanelPromesas({
  promesas,
  total,
  cumplidas,
}: {
  promesas: Promesa[];
  total: number;
  cumplidas: number;
}) {
  const [formulario, setFormulario] = useState(false);
  const [citaNueva, setCitaNueva] = useState("");
  const [textoNuevo, setTextoNuevo] = useState("");
  const [cumpliendo, setCumpliendo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const guardar = (datos: FormData) =>
    iniciar(async () => {
      setError(null);
      const etiquetas = String(datos.get("etiquetas") ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      const r = await crearPromesa({
        cita: String(datos.get("cita") ?? ""),
        texto: String(datos.get("texto") ?? ""),
        contexto: String(datos.get("contexto") ?? "") || undefined,
        etiquetas,
      });

      if (r.ok) {
        setFormulario(false);
        setCitaNueva("");
        setTextoNuevo("");
      } else {
        setError(r.error);
      }
    });

  const cumplir = (id: string, datos: FormData) =>
    iniciar(async () => {
      setError(null);
      const r = await marcarPromesaCumplida(
        id,
        String(datos.get("testimonio") ?? "") || undefined,
      );
      if (r.ok) setCumpliendo(null);
      else setError(r.error);
    });

  if (promesas.length === 0 && !formulario) {
    return (
      <EmptyState
        icon={Sparkles}
        titulo="Todavía no has guardado ninguna promesa"
        descripcion="Empieza por el versículo que Dios usó contigo esta temporada. Anota también qué estabas atravesando: eso es lo que le da peso cuando lo relees dentro de un año."
        accion={
          <Button onClick={() => setFormulario(true)}>
            <Plus className="size-4" aria-hidden />
            Guardar la primera
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Card className="flex flex-wrap items-center gap-6 p-5">
          <div>
            <p className="font-display text-3xl">{total}</p>
            <p className="text-muted text-sm">guardadas</p>
          </div>
          <div className="bg-ink-700/10 h-10 w-px dark:bg-white/10" aria-hidden />
          <div>
            <p className="font-display text-3xl">{cumplidas}</p>
            <p className="text-muted text-sm">cumplidas</p>
          </div>
        </Card>

        <Button
          variant={formulario ? "ghost" : "primary"}
          onClick={() => setFormulario((v) => !v)}
        >
          {formulario ? (
            <>
              <X className="size-4" aria-hidden />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="size-4" aria-hidden />
              Nueva promesa
            </>
          )}
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {formulario && (
        <Card className="mb-4 p-6">
          <form action={guardar} className="space-y-4">
            <Field htmlFor="cita" label="Cita bíblica">
              <Input
                id="cita"
                name="cita"
                required
                maxLength={80}
                value={citaNueva}
                onChange={(e) => setCitaNueva(e.target.value)}
                placeholder="Jeremías 29:11"
              />
            </Field>
            <BuscarPasaje
              referencia={citaNueva}
              uso="promesa"
              onEncontrado={(p) => {
                setCitaNueva(p.referencia);
                setTextoNuevo(p.texto);
              }}
            />
            <Field htmlFor="texto" label="Texto del versículo">
              <Textarea
                id="texto"
                name="texto"
                required
                maxLength={2000}
                className="min-h-24"
                value={textoNuevo}
                onChange={(e) => setTextoNuevo(e.target.value)}
              />
            </Field>
            <Field
              htmlFor="contexto"
              label="¿Qué estabas atravesando?"
              hint="Opcional, pero es lo que le da peso"
            >
              <Textarea
                id="contexto"
                name="contexto"
                maxLength={2000}
                className="min-h-24"
              />
            </Field>
            <Field
              htmlFor="etiquetas"
              label="Etiquetas"
              hint="Separadas por comas"
            >
              <Input
                id="etiquetas"
                name="etiquetas"
                placeholder="dirección, futuro"
              />
            </Field>
            <Button type="submit" loading={pendiente}>
              Guardar promesa
            </Button>
          </form>
        </Card>
      )}

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

            {p.contexto && (
              <p className="text-muted mt-4 text-sm leading-relaxed">
                {p.contexto}
              </p>
            )}

            {p.cumplida && p.testimonio && (
              <div className="bg-honey-300/30 mt-4 rounded-2xl p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                  <Sparkles className="size-3" aria-hidden />
                  Testimonio
                </p>
                <p className="mt-1.5 text-sm leading-relaxed">{p.testimonio}</p>
              </div>
            )}

            {cumpliendo === p.id && (
              <form
                action={(datos) => cumplir(p.id, datos)}
                className="border-ink-700/10 mt-4 border-t pt-4 dark:border-white/10"
              >
                <Field
                  htmlFor={`testimonio-${p.id}`}
                  label="¿Qué pasó?"
                  hint="Opcional"
                >
                  <Textarea
                    id={`testimonio-${p.id}`}
                    name="testimonio"
                    className="min-h-20"
                  />
                </Field>
                <div className="mt-3 flex gap-2">
                  <Button type="submit" size="sm" loading={pendiente}>
                    Marcar cumplida
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setCumpliendo(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            <div className="border-ink-700/10 mt-4 flex flex-wrap items-center gap-2 border-t pt-4 dark:border-white/10">
              <span className="text-muted text-xs">
                {formatDate(p.createdAt, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              {p.etiquetas.map((e) => (
                <Badge key={e} tone="neutral" className="text-[0.65rem]">
                  {e}
                </Badge>
              ))}
              {!p.cumplida && cumpliendo !== p.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => setCumpliendo(p.id)}
                >
                  Marcar cumplida
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
