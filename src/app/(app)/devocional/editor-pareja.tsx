"use client";

import { useState, useTransition } from "react";
import { Check, EyeOff, Lock, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Textarea, Input } from "@/components/ui/field";
import { BuscarPasaje } from "@/components/buscar-pasaje";
import { Mensaje } from "./mensaje";
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
  const [pasaje, setPasaje] = useState("");
  const [texto, setTexto] = useState("");
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
    <Card className="p-6">
      <h2 className="text-2xl">Elige el pasaje de hoy</h2>
      <p className="text-muted mt-2 leading-relaxed">
        Cualquiera de los dos puede proponerlo. {nombrePareja} lo verá en cuanto
        lo guardes.
      </p>

      <form action={crear} className="mt-6 space-y-4">
        <Field htmlFor="pasaje" label="Pasaje">
          <Input
            id="pasaje"
            name="pasaje"
            required
            maxLength={120}
            value={pasaje}
            onChange={(e) => setPasaje(e.target.value)}
            placeholder="Eclesiastés 4:9-12"
          />
        </Field>
        <BuscarPasaje
          referencia={pasaje}
          uso="devocional"
          onEncontrado={(p) => {
            setPasaje(p.referencia);
            setTexto(p.texto);
          }}
        />
        <Field htmlFor="titulo" label="Título" hint="Opcional">
          <Input
            id="titulo"
            name="titulo"
            maxLength={120}
            placeholder="Cordón de tres dobleces"
          />
        </Field>
        <Field
          htmlFor="texto"
          label="Texto del pasaje"
          hint="Opcional: se llena con “Traer el texto”"
        >
          <Textarea
            id="texto"
            name="texto"
            className="min-h-28"
            maxLength={4000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </Field>
        <Button type="submit" loading={pendiente}>
          Empezar el devocional
        </Button>
      </form>

      <Mensaje error={error} />
    </Card>
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
        <Field
          htmlFor="mi-respuesta"
          label="Lo que Dios me dijo"
          hint={
            devocional.revelado
              ? "Ya se reveló"
              : "Solo tú lo ves hasta que los dos escriban"
          }
        >
          <Textarea
            id="mi-respuesta"
            value={respuesta}
            onChange={(e) => {
              setRespuesta(e.target.value);
              setGuardado(false);
            }}
            placeholder="No tiene que ser largo. Una frase honesta vale más que una página."
          />
        </Field>

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
          <p className="mt-3 leading-relaxed">{devocional.respuestaPareja}</p>
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
