"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  Check,
  EyeOff,
  Lock,
  Save,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field, Textarea, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { BuscarPasaje } from "@/components/buscar-pasaje";
import { cn } from "@/lib/utils";
import {
  crearDevocionalDePareja,
  guardarRespuestaDevocional,
  guardarDevocionalPersonal,
} from "@/actions/app";

type DevocionalPareja = {
  id: string;
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

type Personal = {
  pasaje: string;
  textoPasaje: string | null;
  observacion: string | null;
  aplicacion: string | null;
  oracion: string | null;
  completado: boolean;
};

export function DevocionalView({
  tienePareja,
  nombrePareja,
  miNombre,
  devocionalPareja,
  personal,
}: {
  tienePareja: boolean;
  nombrePareja: string | null;
  miNombre: string;
  devocionalPareja: DevocionalPareja | null;
  personal: Personal | null;
}) {
  const [modo, setModo] = useState<"pareja" | "personal">(
    tienePareja ? "pareja" : "personal",
  );

  return (
    <div>
      <PageHeader
        eyebrow="Devocional"
        title={modo === "pareja" ? "Juntos, hoy" : "Tu tiempo con Dios"}
        description={
          modo === "pareja"
            ? "Cada uno escribe por separado. Las respuestas se revelan cuando ambos terminan."
            : "Método SOAP, una sección a la vez. El borrador se guarda al avanzar."
        }
      />

      <div
        role="tablist"
        aria-label="Tipo de devocional"
        className="glass mb-5 inline-flex gap-1 p-1.5"
      >
        {(["pareja", "personal"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={modo === m}
            onClick={() => setModo(m)}
            className={cn(
              "min-h-11 cursor-pointer rounded-2xl px-5 text-sm font-medium transition-colors duration-200",
              modo === m
                ? "bg-honey-300 text-ink-700"
                : "text-muted hover:text-foreground",
            )}
          >
            {m === "pareja" ? "En pareja" : "Personal"}
          </button>
        ))}
      </div>

      {modo === "pareja" ? (
        !tienePareja ? (
          <EmptyState
            icon={UserPlus}
            titulo="El devocional en pareja necesita a los dos"
            descripcion="Cuando tu pareja acepte la invitación, podrán elegir un pasaje y escribir cada uno por su lado."
            accion={
              <Link href="/vincular" className={buttonStyles()}>
                Invitar a mi pareja
              </Link>
            }
          />
        ) : (
          <DevocionalEnPareja
            devocional={devocionalPareja}
            nombrePareja={nombrePareja ?? "tu pareja"}
            miNombre={miNombre}
          />
        )
      ) : (
        <DevocionalPersonal inicial={personal} />
      )}
    </div>
  );
}

function Mensaje({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="mt-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {error}
    </p>
  );
}

function DevocionalEnPareja({
  devocional,
  nombrePareja,
  miNombre,
}: {
  devocional: DevocionalPareja | null;
  nombrePareja: string;
  miNombre: string;
}) {
  const [pasajeNuevo, setPasajeNuevo] = useState("");
  const [textoNuevo, setTextoNuevo] = useState("");
  const [respuesta, setRespuesta] = useState(devocional?.miRespuesta ?? "");
  const [guardado, setGuardado] = useState(Boolean(devocional?.yoRespondi));
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
      if (!r.ok) setError(r.error);
    });

  const guardar = () =>
    iniciar(async () => {
      if (!devocional) return;
      setError(null);
      const r = await guardarRespuestaDevocional(devocional.id, respuesta);
      if (r.ok) setGuardado(true);
      else setError(r.error);
    });

  if (!devocional) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl">Elige el pasaje de hoy</h2>
        <p className="text-muted mt-2 leading-relaxed">
          Cualquiera de los dos puede proponerlo. {nombrePareja} lo verá en
          cuanto lo guardes.
        </p>

        <form action={crear} className="mt-6 space-y-4">
          <Field htmlFor="pasaje" label="Pasaje">
            <Input
              id="pasaje"
              name="pasaje"
              required
              maxLength={120}
              value={pasajeNuevo}
              onChange={(e) => setPasajeNuevo(e.target.value)}
              placeholder="Eclesiastés 4:9-12"
            />
          </Field>
          <BuscarPasaje
            referencia={pasajeNuevo}
            uso="devocional"
            onEncontrado={(p) => {
              setPasajeNuevo(p.referencia);
              setTextoNuevo(p.texto);
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
              value={textoNuevo}
              onChange={(e) => setTextoNuevo(e.target.value)}
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

const PASOS = [
  {
    id: "observacion" as const,
    letra: "O",
    titulo: "Observación",
    ayuda: "¿Qué dice el texto? ¿De quién habla, qué pasa?",
  },
  {
    id: "aplicacion" as const,
    letra: "A",
    titulo: "Aplicación",
    ayuda: "¿Qué cambia esto en tu semana?",
  },
  {
    id: "oracion" as const,
    letra: "O",
    titulo: "Oración",
    ayuda: "Escríbelo como se lo dirías a Dios.",
  },
];

function DevocionalPersonal({ inicial }: { inicial: Personal | null }) {
  const [pasaje, setPasaje] = useState(inicial?.pasaje ?? "");
  const [textoPasaje, setTextoPasaje] = useState(inicial?.textoPasaje ?? "");
  const [valores, setValores] = useState({
    observacion: inicial?.observacion ?? "",
    aplicacion: inicial?.aplicacion ?? "",
    oracion: inicial?.oracion ?? "",
  });
  const [paso, setPaso] = useState(0);
  const [completado, setCompletado] = useState(inicial?.completado ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;

  const guardar = (terminar = false) =>
    iniciar(async () => {
      setError(null);
      const r = await guardarDevocionalPersonal({
        pasaje,
        textoPasaje: textoPasaje || undefined,
        ...valores,
        completado: terminar,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      if (terminar) setCompletado(true);
      else if (!esUltimo) setPaso((p) => p + 1);
    });

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <Field htmlFor="pasaje-personal" label="Pasaje de hoy">
          <Input
            id="pasaje-personal"
            value={pasaje}
            onChange={(e) => setPasaje(e.target.value)}
            maxLength={120}
            placeholder="Salmo 23"
          />
        </Field>

        <div className="mt-3">
          <BuscarPasaje
            referencia={pasaje}
            uso="devocional"
            onEncontrado={(p) => {
              setPasaje(p.referencia);
              setTextoPasaje(p.texto);
            }}
          />
        </div>

        {textoPasaje && (
          <blockquote className="border-honey-500 mt-5 border-l-2 pl-4">
            <p className="font-display text-lg leading-relaxed">{textoPasaje}</p>
          </blockquote>
        )}
      </Card>

      <Card className="p-6">
        <ol className="mb-6 flex gap-2" aria-label="Progreso del devocional">
          {PASOS.map((p, i) => (
            <li key={p.id} className="flex-1">
              <button
                onClick={() => setPaso(i)}
                aria-current={i === paso ? "step" : undefined}
                className={cn(
                  "flex min-h-11 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium transition-colors duration-200",
                  i === paso
                    ? "bg-honey-300 text-ink-700"
                    : valores[p.id]
                      ? "bg-ink-700/10 text-foreground dark:bg-white/12"
                      : "text-muted hover:bg-white/50 dark:hover:bg-white/8",
                )}
              >
                <span className="font-display text-base">{p.letra}</span>
                <span className="hidden sm:block">{p.titulo}</span>
              </button>
            </li>
          ))}
        </ol>

        <Field
          htmlFor={`soap-${actual.id}`}
          label={actual.titulo}
          hint={actual.ayuda}
        >
          <Textarea
            id={`soap-${actual.id}`}
            value={valores[actual.id]}
            onChange={(e) =>
              setValores((v) => ({ ...v, [actual.id]: e.target.value }))
            }
          />
        </Field>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setPaso((p) => Math.max(0, p - 1))}
            disabled={paso === 0}
          >
            Atrás
          </Button>
          <Button
            onClick={() => guardar(esUltimo)}
            loading={pendiente}
            disabled={!pasaje.trim() || (esUltimo && !valores.oracion.trim())}
          >
            {esUltimo ? "Terminar devocional" : "Guardar y seguir"}
          </Button>
        </div>

        <Mensaje error={error} />

        {completado && (
          <p className="mt-4 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <Check className="size-4" aria-hidden />
            Devocional completo. Cuenta para tu racha de hoy.
          </p>
        )}
      </Card>

      <p className="text-muted px-2 text-sm leading-relaxed">
        Si cierras la app a mitad, vuelves donde quedaste. Cuenta para la racha
        porque incluye la sección Oración.
      </p>
    </div>
  );
}
