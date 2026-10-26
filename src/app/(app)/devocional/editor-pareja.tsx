"use client";

import { useState, useTransition } from "react";
import { Check, EyeOff, Lock, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { EditorEnriquecido } from "@/components/editor-enriquecido";
import { TextoEnriquecido } from "@/components/texto-enriquecido";
import { Mensaje } from "./mensaje";
import {
  Seccion,
  SeccionesPasaje,
  SeccionQueSigueParejas,
} from "./pasaje-campos";
import {
  crearDevocionalDePareja,
  guardarRespuestaDevocional,
} from "@/actions/app";

export type DevocionalPareja = {
  id: string;
  fechaLocal: string;
  pasaje: string;
  titulo: string | null;
  textoPasaje: string | null;
  elegidoPorMi: boolean;
  miRespuesta: string | null;
  respuestaPareja: string | null;
  yoRespondi: boolean;
  parejaRespondio: boolean;
  revelado: boolean;
};

/**
 * Elegir el pasaje del día. Cualquiera de los dos puede proponerlo, y solo
 * cabe uno por día: el servidor rechaza el segundo con un mensaje.
 */
export function FormularioPasajePareja({
  nombrePareja,
  alCrear,
}: {
  nombrePareja: string;
  /** Si se pasa, la pantalla navega al devocional creado. */
  alCrear?: (id: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const crear = (datos: FormData) =>
    iniciar(async () => {
      setError(null);
      const r = await crearDevocionalDePareja({
        pasaje: String(datos.get("pasaje") ?? ""),
        titulo: String(datos.get("titulo") ?? "") || undefined,
        textoPasaje: String(datos.get("texto") ?? "") || undefined,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      if (alCrear && r.datos) alCrear(r.datos.id);
    });

  return (
    <form action={crear} className="max-w-xl space-y-4">
      <SeccionesPasaje placeholder="Eclesiastés 4:9-12" />
      <Seccion numero={2} titulo="Título" ayuda="Opcional: una frase para recordarlo.">
        <Field htmlFor="titulo" label="Título">
          <Input
            id="titulo"
            name="titulo"
            maxLength={120}
            placeholder="Cordón de tres dobleces"
          />
        </Field>
      </Seccion>
      <SeccionQueSigueParejas numero={3} nombrePareja={nombrePareja} />
      <Button type="submit" size="lg" loading={pendiente} className="w-full sm:w-auto">
        Empezar el devocional
      </Button>
      <Mensaje error={error} />
    </form>
  );
}

/**
 * Un devocional de pareja ya creado: el pasaje, lo que escribí yo y —solo
 * cuando los dos escribieron— lo que escribió el otro. El texto de la pareja
 * ni siquiera llega al navegador antes del revelado.
 */
export function DevocionalParejaDetalle({
  devocional,
  nombrePareja,
  miNombre,
  esDeHoy = true,
}: {
  devocional: DevocionalPareja;
  nombrePareja: string;
  miNombre: string;
  esDeHoy?: boolean;
}) {
  const [respuesta, setRespuesta] = useState(devocional.miRespuesta ?? "");
  const [guardado, setGuardado] = useState(devocional.yoRespondi);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const guardar = () =>
    iniciar(async () => {
      setError(null);
      const r = await guardarRespuestaDevocional(devocional.id, respuesta);
      if (r.ok) setGuardado(true);
      else setError(r.error);
    });

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl">{devocional.titulo ?? devocional.pasaje}</h2>
            <p className="text-accent mt-1 text-sm font-medium">
              {devocional.pasaje}
            </p>
          </div>
          <Badge tone="honey">
            Elegido por {devocional.elegidoPorMi ? miNombre : nombrePareja}
          </Badge>
        </div>

        {devocional.textoPasaje && (
          <blockquote className="border-honey-500 mt-5 border-l-2 pl-4">
            <p className="font-display text-lg leading-relaxed">
              {devocional.textoPasaje}
            </p>
          </blockquote>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-2 flex items-baseline gap-2 text-sm">
          <span id="etiqueta-mi-respuesta" className="font-medium">
            Lo que Dios me dijo
          </span>
          <span className="text-muted text-xs">
            {devocional.revelado
              ? "Ya se reveló"
              : "Solo tú lo ves hasta que los dos escriban"}
          </span>
        </div>
        <EditorEnriquecido
          valor={respuesta}
          limite={4000}
          idEtiqueta="etiqueta-mi-respuesta"
          placeholder="No tiene que ser largo. Una frase honesta vale más que una página."
          onCambio={(md) => {
            setRespuesta(md);
            setGuardado(false);
          }}
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            onClick={guardar}
            loading={pendiente}
            disabled={!respuesta.trim()}
          >
            <Save className="size-4" aria-hidden />
            {guardado ? "Guardado" : "Guardar"}
          </Button>
          {guardado && (
            <span className="text-muted flex items-center gap-1.5 text-sm">
              <Check
                className="size-4 text-emerald-700 dark:text-emerald-400"
                aria-hidden
              />
              Tu respuesta está guardada
            </span>
          )}
        </div>

        {!esDeHoy && (
          <p className="text-muted mt-3 text-sm leading-relaxed">
            Es un devocional de otro día: puedes escribirlo o cambiarlo, pero no
            cuenta para la racha de hoy.
          </p>
        )}

        <Mensaje error={error} />
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <EyeOff className="text-muted size-4" aria-hidden />
          <p className="text-muted text-xs tracking-wide uppercase">
            Lo que escribió {nombrePareja}
          </p>
        </div>

        {devocional.revelado ? (
          <TextoEnriquecido
            className="mt-3"
            markdown={devocional.respuestaPareja ?? ""}
          />
        ) : (
          <div className="mt-4 flex items-start gap-3">
            <Lock className="text-muted mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">Todavía no se revela</p>
              <p className="text-muted mt-1 text-sm leading-relaxed">
                {devocional.parejaRespondio
                  ? `${nombrePareja} ya escribió. Guarda lo tuyo y se revelan las dos.`
                  : `${nombrePareja} aún no ha escrito. Cuando termine, los dos verán la respuesta del otro al mismo tiempo.`}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
