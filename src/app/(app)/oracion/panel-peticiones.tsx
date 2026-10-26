"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Archive, Check, HandHeart, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BotonAlternar } from "@/components/ui/boton-alternar";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { crearPeticion, cambiarEstadoPeticion } from "@/actions/app";
import { formatDate } from "@/lib/utils";

type Peticion = {
  id: string;
  titulo: string;
  detalle: string | null;
  estado: string;
  compartida?: boolean;
  createdAt: string;
  respondidaEn?: string | null;
  nota?: string | null;
};

export function PanelPeticiones({
  propias,
  compartidas,
  nombrePareja,
}: {
  propias: Peticion[];
  compartidas: Peticion[];
  nombrePareja: string | null;
}) {
  const [formulario, setFormulario] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const activas = propias.filter((p) => p.estado === "activa");
  const respondidas = propias.filter((p) => p.estado === "respondida");

  const enviar = (datos: FormData) =>
    iniciar(async () => {
      setError(null);
      const r = await crearPeticion({
        titulo: String(datos.get("titulo") ?? ""),
        detalle: String(datos.get("detalle") ?? "") || undefined,
        compartida: datos.get("compartida") === "on",
      });
      if (r.ok) setFormulario(false);
      else setError(r.error);
    });

  const cambiar = (id: string, estado: "respondida" | "archivada") =>
    iniciar(async () => {
      setError(null);
      const r = await cambiarEstadoPeticion(id, estado);
      if (!r.ok) setError(r.error);
    });

  return (
    <>
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-2xl">Peticiones</h2>
        <BotonAlternar
          abierto={formulario}
          onClick={() => setFormulario((v) => !v)}
          etiqueta="Nueva"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {formulario && (
        <Card className="p-6">
          <form action={enviar} className="space-y-4">
            <Field htmlFor="titulo" label="¿Por qué quieres orar?">
              <Input
                id="titulo"
                name="titulo"
                required
                maxLength={120}
                placeholder="El trabajo de mi hermano"
              />
            </Field>
            <Field htmlFor="detalle" label="Detalle" hint="Opcional">
              <Textarea
                id="detalle"
                name="detalle"
                maxLength={2000}
                className="min-h-24"
              />
            </Field>

            {nombrePareja && (
              <label
                htmlFor="compartida"
                className="flex min-h-12 cursor-pointer items-center gap-3 text-sm"
              >
                <input
                  type="checkbox"
                  id="compartida"
                  name="compartida"
                  className="accent-honey-500 size-5 cursor-pointer"
                />
                Compartir con {nombrePareja}
              </label>
            )}

            <Button type="submit" loading={pendiente}>
              Guardar petición
            </Button>
          </form>
        </Card>
      )}

      {activas.length === 0 && !formulario ? (
        <EmptyState
          icon={HandHeart}
          titulo="No tienes peticiones activas"
          descripcion="Anota aquello por lo que estás orando. Cuando Dios responda, podrás marcarlo y guardar lo que pasó."
          accion={
            <Button onClick={() => setFormulario(true)}>
              <Plus className="size-4" aria-hidden />
              Escribir la primera
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {activas.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg">{p.titulo}</h3>
                  {p.detalle && (
                    <p className="text-muted mt-1 text-sm leading-relaxed">
                      {p.detalle}
                    </p>
                  )}
                </div>
                {p.compartida && <Badge tone="honey">Compartida</Badge>}
              </div>

              <div className="border-ink-700/10 mt-4 flex flex-wrap items-center gap-3 border-t pt-4 dark:border-white/10">
                <span className="text-muted text-xs">
                  Desde el {formatDate(p.createdAt)}
                </span>
                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cambiar(p.id, "archivada")}
                    disabled={pendiente}
                  >
                    <Archive className="size-4" aria-hidden />
                    Archivar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => cambiar(p.id, "respondida")}
                    disabled={pendiente}
                  >
                    <Check className="size-4" aria-hidden />
                    Respondida
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {compartidas.length > 0 && (
        <>
          <h3 className="text-muted pt-4 text-sm font-medium tracking-wide uppercase">
            Compartidas por {nombrePareja}
          </h3>
          <div className="space-y-3">
            {compartidas.map((p) => (
              <Card key={p.id} className="p-5">
                <h3 className="text-lg">{p.titulo}</h3>
                {p.detalle && (
                  <p className="text-muted mt-1 text-sm leading-relaxed">
                    {p.detalle}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {respondidas.length > 0 && (
        <>
          <h3 className="text-muted pt-4 text-sm font-medium tracking-wide uppercase">
            Oraciones respondidas · {respondidas.length}
          </h3>
          <div className="space-y-3">
            {respondidas.map((p) => (
              <Card key={p.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-lg">{p.titulo}</h3>
                  {p.respondidaEn && (
                    <Badge tone="success">
                      Respondida el {formatDate(p.respondidaEn)}
                    </Badge>
                  )}
                </div>
                {p.nota && (
                  <p className="mt-2 leading-relaxed italic">“{p.nota}”</p>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
