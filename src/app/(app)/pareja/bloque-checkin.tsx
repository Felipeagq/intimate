"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditorEnriquecido } from "@/components/editor-enriquecido";
import { TextoEnriquecido } from "@/components/texto-enriquecido";
import { formatDate } from "@/lib/utils";
import { responderCheckin } from "@/actions/app";
import type { Checkin, Correr } from "./tipos";

export function BloqueCheckin({
  checkin,
  nombrePareja,
  pendiente,
  correr,
}: {
  checkin: Checkin;
  nombrePareja: string;
  pendiente: boolean;
  correr: Correr;
}) {
  const [respuestas, setRespuestas] = useState<string[]>(
    checkin.misRespuestas ?? checkin.preguntas.map(() => ""),
  );
  const [editando, setEditando] = useState(!checkin.yoRespondi);
  // Cada vez que se abre el formulario, los editores se reinician con lo guardado.
  const [tanda, setTanda] = useState(0);

  const incompleto = respuestas.some((r) => !r.trim());

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted text-xs tracking-wide uppercase">
            Check-in semanal
          </p>
          <h2 className="mt-1.5 text-2xl">
            Semana del {formatDate(checkin.semanaInicio)}
          </h2>
        </div>
        <Badge tone={checkin.revelado ? "success" : "warning"}>
          {checkin.revelado
            ? "Los dos respondieron"
            : checkin.yoRespondi
              ? `Falta ${nombrePareja}`
              : "Te toca responder"}
        </Badge>
      </div>

      {editando ? (
        <form
          className="mt-5 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (incompleto) return;
            correr(async () => {
              const r = await responderCheckin(respuestas);
              if (r.ok) setEditando(false);
              return r;
            });
          }}
        >
          {checkin.preguntas.map((pregunta, i) => (
            <div key={pregunta}>
              <p id={`q-${i}`} className="mb-2 text-sm font-medium">
                {pregunta}
              </p>
              <EditorEnriquecido
                key={`${tanda}-${i}`}
                valor={respuestas[i] ?? ""}
                limite={2000}
                herramientas="basicas"
                idEtiqueta={`q-${i}`}
                placeholder="Escribe con calma…"
                onCambio={(md) =>
                  setRespuestas((r) => r.map((v, j) => (j === i ? md : v)))
                }
              />
            </div>
          ))}
          <Button type="submit" loading={pendiente} disabled={incompleto}>
            Guardar mis respuestas
          </Button>
          {incompleto && (
            <p className="text-muted -mt-2 text-xs">
              Responde todas las preguntas para guardar.
            </p>
          )}
        </form>
      ) : (
        <div className="mt-5 space-y-6">
          {checkin.preguntas.map((pregunta, i) => (
            <div key={pregunta}>
              <p className="font-medium">{pregunta}</p>
              <div className="mt-2 space-y-3">
                <div>
                  <p className="text-muted text-xs tracking-wide uppercase">Tú</p>
                  <TextoEnriquecido
                    className="mt-1 text-base! leading-7!"
                    markdown={checkin.misRespuestas?.[i] ?? ""}
                  />
                </div>
                {checkin.revelado && (
                  <div>
                    <p className="text-muted text-xs tracking-wide uppercase">
                      {nombrePareja}
                    </p>
                    <TextoEnriquecido
                      className="mt-1 text-base! leading-7!"
                      markdown={checkin.respuestasPareja?.[i] ?? ""}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {!checkin.revelado && (
            <p className="text-muted flex items-center gap-2 text-sm">
              <Lock className="size-4" aria-hidden />
              Lo de {nombrePareja} se revela cuando responda.
            </p>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTanda((t) => t + 1);
              setEditando(true);
            }}
          >
            Cambiar mis respuestas
          </Button>
        </div>
      )}
    </Card>
  );
}
