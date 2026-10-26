"use client";

import { useState } from "react";
import { Check, Plus, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BotonAlternar } from "@/components/ui/boton-alternar";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { formatDate } from "@/lib/utils";
import { confirmarAcuerdo, crearAcuerdo } from "@/actions/app";
import type { Acuerdo, Correr, Plantilla } from "./tipos";

type Clave = "porConfirmar" | "esperando" | "revision" | "vigentes" | "cumplidos";

/**
 * En qué punto está un acuerdo, desde el punto de vista de quien mira. Lo que
 * le toca a esta persona va primero: es lo único que requiere su acción.
 */
function claveDe(a: Acuerdo): Clave {
  if (!a.confirmadoPorAmbos) return a.confirmadoPorMi ? "esperando" : "porConfirmar";
  if (a.estado === "en revisión") return "revision";
  if (a.estado === "cumplido") return "cumplidos";
  return "vigentes";
}

export function BloqueAcuerdos({
  acuerdos,
  plantillas,
  nombrePareja,
  pendiente,
  correr,
}: {
  acuerdos: Acuerdo[];
  plantillas: Plantilla[];
  nombrePareja: string;
  pendiente: boolean;
  correr: Correr;
}) {
  const [formulario, setFormulario] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const grupos: {
    clave: Clave;
    titulo: string;
    tono: "warning" | "info" | "success" | "neutral";
  }[] = [
    { clave: "porConfirmar", titulo: "Por confirmar", tono: "warning" },
    { clave: "esperando", titulo: `Esperando a ${nombrePareja}`, tono: "info" },
    { clave: "revision", titulo: "En revisión", tono: "warning" },
    { clave: "vigentes", titulo: "Vigentes", tono: "success" },
    { clave: "cumplidos", titulo: "Cumplidos", tono: "neutral" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ScrollText className="text-accent size-5" aria-hidden />
          <h2 className="text-2xl">Acuerdos</h2>
        </div>
        <BotonAlternar
          abierto={formulario}
          onClick={() => setFormulario((v) => !v)}
          etiqueta="Nuevo"
        />
      </div>

      {formulario && (
        <Card className="p-5 sm:p-6">
          <p className="text-muted text-sm">
            Parte de una plantilla o escríbelo desde cero. Lo adaptan ustedes.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {plantillas.map((p) => (
              <button
                key={p.titulo}
                type="button"
                onClick={() => {
                  setTitulo(p.titulo);
                  setDescripcion(p.descripcion);
                }}
                className="glass glass-hover min-h-11 cursor-pointer px-3 py-2 text-xs font-medium"
              >
                {p.titulo}
              </button>
            ))}
          </div>

          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              correr(async () => {
                const r = await crearAcuerdo({ titulo, descripcion });
                if (r.ok) {
                  setFormulario(false);
                  setTitulo("");
                  setDescripcion("");
                }
                return r;
              });
            }}
          >
            <Field htmlFor="acuerdo-titulo" label="Título">
              <Input
                id="acuerdo-titulo"
                required
                maxLength={120}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </Field>
            <Field htmlFor="acuerdo-desc" label="¿En qué quedamos?">
              <Textarea
                id="acuerdo-desc"
                className="min-h-24"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </Field>
            <Button type="submit" loading={pendiente}>
              Proponer acuerdo
            </Button>
          </form>
        </Card>
      )}

      {acuerdos.length === 0 && !formulario ? (
        <Card className="p-8 text-center">
          <ScrollText className="text-muted mx-auto size-6" aria-hidden />
          <p className="mt-3 font-medium">Todavía no han escrito acuerdos</p>
          <p className="text-muted mx-auto mt-2 max-w-sm text-sm leading-relaxed">
            Límites, tiempo juntos, redes, metas. Escribirlos evita que se
            queden en una conversación suelta que cada uno recuerda distinto.
          </p>
          <Button className="mt-5" onClick={() => setFormulario(true)}>
            <Plus aria-hidden />
            Proponer el primero
          </Button>
        </Card>
      ) : (
        grupos.map((g) => {
          const items = acuerdos.filter((a) => claveDe(a) === g.clave);
          if (items.length === 0) return null;
          return (
            <section key={g.clave} aria-label={g.titulo}>
              <h3 className="mb-2 flex items-center gap-2 px-1 text-sm font-medium">
                {g.titulo}
                <Badge tone={g.tono}>{items.length}</Badge>
              </h3>
              <div className="space-y-3">
                {items.map((a) => (
                  <Card key={a.id} className="p-5">
                    <h4 className="text-lg">{a.titulo}</h4>
                    {a.descripcion && (
                      <p className="text-muted mt-1 leading-relaxed">
                        {a.descripcion}
                      </p>
                    )}

                    <div className="border-ink-700/10 mt-4 flex flex-wrap items-center gap-3 border-t pt-4 text-xs dark:border-white/10">
                      {g.clave === "porConfirmar" ? (
                        <Button
                          size="sm"
                          loading={pendiente}
                          onClick={() => correr(() => confirmarAcuerdo(a.id))}
                        >
                          <Check aria-hidden />
                          Confirmar
                        </Button>
                      ) : g.clave === "esperando" ? (
                        <span className="font-medium text-amber-800 dark:text-amber-300">
                          Tú ya confirmaste
                        </span>
                      ) : (
                        <span className="text-muted flex items-center gap-1.5">
                          <Check className="size-3.5" aria-hidden />
                          Confirmado por los dos
                        </span>
                      )}
                      {a.proximaRevision && (
                        <span className="text-muted ml-auto">
                          Se revisa el {formatDate(a.proximaRevision)}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })
      )}

      <p className="text-muted px-2 text-sm leading-relaxed">
        Cambiar un acuerdo vigente requiere que los dos lo confirmen de nuevo.
        Nada se modifica por una sola persona.
      </p>
    </div>
  );
}
