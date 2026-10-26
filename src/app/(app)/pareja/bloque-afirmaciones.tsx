"use client";

import { useState } from "react";
import { Heart, MessageCircleHeart, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BotonAlternar } from "@/components/ui/boton-alternar";
import { Button } from "@/components/ui/button";
import { EditorEnriquecido } from "@/components/editor-enriquecido";
import { TextoEnriquecido } from "@/components/texto-enriquecido";
import { cn, formatDate } from "@/lib/utils";
import { alternarFavorita, enviarAfirmacion } from "@/actions/app";
import type { Afirmacion, Correr } from "./tipos";

type Vista = "recibidas" | "enviadas";

export function BloqueAfirmaciones({
  afirmaciones,
  nombrePareja,
  pendiente,
  correr,
}: {
  afirmaciones: Afirmacion[];
  nombrePareja: string;
  pendiente: boolean;
  correr: Correr;
}) {
  const [formulario, setFormulario] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [vista, setVista] = useState<Vista>("recibidas");

  const recibidas = afirmaciones
    .filter((a) => !a.mia)
    // Las favoritas primero; dentro de cada grupo se respeta el orden recibido.
    .sort((a, b) => Number(b.favorita) - Number(a.favorita));
  const enviadas = afirmaciones.filter((a) => a.mia);
  const lista = vista === "recibidas" ? recibidas : enviadas;

  const pestanas: { id: Vista; etiqueta: string; n: number }[] = [
    { id: "recibidas", etiqueta: `De ${nombrePareja}`, n: recibidas.length },
    { id: "enviadas", etiqueta: "Las tuyas", n: enviadas.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <MessageCircleHeart className="text-accent size-5 shrink-0" aria-hidden />
          <h2 className="truncate text-2xl">Palabras de afirmación</h2>
        </div>
        <BotonAlternar
          abierto={formulario}
          onClick={() => setFormulario((v) => !v)}
          etiqueta="Escribir"
        />
      </div>

      {formulario && (
        <Card className="p-5 sm:p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (mensaje.trim().length < 2) return;
              correr(async () => {
                const r = await enviarAfirmacion(mensaje);
                if (r.ok) {
                  setMensaje("");
                  setFormulario(false);
                  setVista("enviadas");
                }
                return r;
              });
            }}
          >
            <p id="etiqueta-afirmacion" className="text-sm font-medium">
              Para {nombrePareja}
            </p>
            <p className="text-muted mb-2 text-xs">
              Algo concreto que viste esta semana
            </p>
            <EditorEnriquecido
              valor=""
              limite={1000}
              herramientas="basicas"
              idEtiqueta="etiqueta-afirmacion"
              placeholder="Lo que admiras, agradeces o viste en el otro…"
              onCambio={setMensaje}
            />
            <Button
              type="submit"
              className="mt-4"
              loading={pendiente}
              disabled={mensaje.trim().length < 2}
            >
              Enviar
            </Button>
          </form>
        </Card>
      )}

      <div
        role="tablist"
        aria-label="Palabras de afirmación"
        className="glass inline-flex gap-1 p-1.5"
      >
        {pestanas.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={vista === p.id}
            onClick={() => setVista(p.id)}
            className={cn(
              "min-h-11 cursor-pointer rounded-2xl px-4 text-sm font-medium transition-colors duration-200",
              vista === p.id
                ? "bg-honey-300 text-ink-700"
                : "text-muted hover:text-foreground",
            )}
          >
            {p.etiqueta}
            <span className="ml-1.5 text-xs opacity-75">{p.n}</span>
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageCircleHeart className="text-muted mx-auto size-6" aria-hidden />
          <p className="mt-3 font-medium">
            {vista === "recibidas"
              ? `${nombrePareja} aún no te ha escrito`
              : "Todavía no has escrito ninguna"}
          </p>
          <p className="text-muted mx-auto mt-2 max-w-sm text-sm leading-relaxed">
            Decir en voz alta lo que uno ve en el otro cuesta poco y pesa mucho.
          </p>
          {vista === "enviadas" && !formulario && (
            <Button className="mt-5" onClick={() => setFormulario(true)}>
              Escribir la primera
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lista.map((a) => (
            <Card
              key={a.id}
              className={cn(
                "flex flex-col p-5",
                a.favorita && "ring-honey-500/50 bg-honey-300/10 ring-1",
              )}
            >
              <Quote
                className="text-accent size-5 shrink-0 opacity-70"
                aria-hidden
              />
              <TextoEnriquecido className="mt-2 flex-1" markdown={a.mensaje} />

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-muted text-xs">
                  {a.mia ? "Tú" : nombrePareja} · {formatDate(a.createdAt)}
                </p>
                {!a.mia && (
                  <button
                    type="button"
                    disabled={pendiente}
                    onClick={() => correr(() => alternarFavorita(a.id))}
                    aria-label={
                      a.favorita ? "Quitar de favoritas" : "Marcar como favorita"
                    }
                    aria-pressed={a.favorita}
                    className="-m-2.5 flex size-11 cursor-pointer items-center justify-center"
                  >
                    <Heart
                      className={
                        a.favorita
                          ? "text-accent size-5 fill-current"
                          : "text-muted size-5"
                      }
                      aria-hidden
                    />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
