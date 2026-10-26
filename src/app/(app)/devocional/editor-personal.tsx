"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronDown,
  Eye,
  HandHeart,
  List,
  Pencil,
  Plus,
  Save,
  Sprout,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { EditorEnriquecido } from "@/components/editor-enriquecido";
import { BuscarPasaje } from "@/components/buscar-pasaje";
import { cn } from "@/lib/utils";
import { Mensaje } from "./mensaje";
import { guardarDevocionalPersonal } from "@/actions/app";

export type Personal = {
  id?: string;
  pasaje: string;
  textoPasaje: string | null;
  observacion: string | null;
  aplicacion: string | null;
  oracion: string | null;
  completado: boolean;
};

const PASOS = [
  {
    id: "observacion" as const,
    icono: Eye,
    titulo: "Observación",
    ayuda: "¿Qué dice el texto? ¿De quién habla, qué pasa?",
  },
  {
    id: "aplicacion" as const,
    icono: Sprout,
    titulo: "Aplicación",
    ayuda: "¿Qué cambia esto en tu semana?",
  },
  {
    id: "oracion" as const,
    icono: HandHeart,
    titulo: "Oración",
    ayuda: "Escríbelo como se lo dirías a Dios.",
  },
];

const LIMITE = 4000;

export function EditorPersonal({
  inicial,
  esDeHoy = true,
}: {
  inicial: Personal | null;
  esDeHoy?: boolean;
}) {
  // El id se conserva entre guardados: en el primero el servidor lo devuelve y
  // a partir de ahí cada paso edita este devocional en vez de crear otro.
  const [id, setId] = useState(inicial?.id);
  const [pasaje, setPasaje] = useState(inicial?.pasaje ?? "");
  const [textoPasaje, setTextoPasaje] = useState(inicial?.textoPasaje ?? "");
  const [valores, setValores] = useState({
    observacion: inicial?.observacion ?? "",
    aplicacion: inicial?.aplicacion ?? "",
    oracion: inicial?.oracion ?? "",
  });
  const [paso, setPaso] = useState(0);
  const [completado, setCompletado] = useState(inicial?.completado ?? false);
  const [guardado, setGuardado] = useState(Boolean(inicial?.id));
  // Sin pasaje (devocional recién abierto) se arranca editándolo.
  const [editandoPasaje, setEditandoPasaje] = useState(!inicial?.pasaje);
  const [verTexto, setVerTexto] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const [autoGuardando, setAutoGuardando] = useState(false);
  // Caracteres visibles del paso actual, que informa el editor.
  const [caracteres, setCaracteres] = useState(0);
  // Cuenta las ediciones: si se escribe mientras un guardado está en vuelo, al
  // terminar no se marca como guardado lo que aún no lo está.
  const version = useRef(0);
  const enVuelo = useRef(false);

  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;
  const contenido = valores[actual.id];

  const marcarCambio = () => {
    version.current += 1;
    setGuardado(false);
  };

  /**
   * Un guardado, sea manual o automático. Editar un devocional ya terminado no
   * lo desmarca mientras conserve la Oración; sin ella deja de estar completo.
   */
  const persistir = async (terminar: boolean) => {
    const capturada = version.current;
    const completa = terminar || (completado && Boolean(valores.oracion.trim()));
    const r = await guardarDevocionalPersonal({
      id,
      pasaje,
      textoPasaje: textoPasaje || undefined,
      ...valores,
      completado: completa,
    });
    if (!r.ok) return r;
    if (r.datos) setId(r.datos.id);
    setCompletado(completa);
    if (capturada === version.current) setGuardado(true);
    return r;
  };

  const guardar = (modo: "guardar" | "seguir" | "terminar") =>
    iniciar(async () => {
      setError(null);
      enVuelo.current = true;
      const r = await persistir(modo === "terminar");
      enVuelo.current = false;
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setEditandoPasaje(false);
      if (modo === "seguir" && !esUltimo) setPaso((p) => p + 1);
    });

  // Autoguardado: un par de segundos después de dejar de escribir. No cambia de
  // paso ni muestra el estado de carga en los botones, para no interrumpir.
  useEffect(() => {
    if (guardado || !pasaje.trim() || pendiente) return;
    const temporizador = setTimeout(async () => {
      if (enVuelo.current) return;
      enVuelo.current = true;
      setAutoGuardando(true);
      const r = await persistir(false);
      enVuelo.current = false;
      setAutoGuardando(false);
      if (!r.ok) setError(r.error);
    }, 2000);
    return () => clearTimeout(temporizador);
    // `persistir` se redefine en cada render con el estado más reciente; lo que
    // dispara el guardado son los cambios, no su identidad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardado, valores, pasaje, textoPasaje]);

  const irA = (i: number) => {
    setPaso(i);
    setError(null);
  };

  const cerca = caracteres > LIMITE * 0.9;

  return (
    // En pantallas anchas el pasaje queda fijo a la izquierda mientras se
    // escribe a la derecha; en el móvil va encima.
    <div className="space-y-4 xl:grid xl:grid-cols-5 xl:items-start xl:gap-4 xl:space-y-0">
      <Card className="p-5 sm:p-6 xl:sticky xl:top-6 xl:col-span-2">
        {editandoPasaje ? (
          <div>
            <Field
              htmlFor="pasaje-personal"
              label={esDeHoy ? "Pasaje de hoy" : "Pasaje"}
            >
              <Input
                id="pasaje-personal"
                value={pasaje}
                onChange={(e) => {
                  setPasaje(e.target.value);
                  marcarCambio();
                }}
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
                  marcarCambio();
                }}
              />
            </div>
            {pasaje.trim() && (
              <button
                type="button"
                onClick={() => setEditandoPasaje(false)}
                className="text-accent mt-2 inline-flex min-h-11 cursor-pointer items-center text-sm font-medium underline"
              >
                Listo
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-honey-300/40 text-ink-700 flex size-10 shrink-0 items-center justify-center rounded-xl dark:bg-white/10 dark:text-honey-300">
                <BookOpen className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-muted text-xs">
                  {esDeHoy ? "Pasaje de hoy" : "Pasaje"}
                </p>
                <p className="truncate text-lg font-medium">{pasaje}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditandoPasaje(true)}
                aria-label="Cambiar el pasaje"
                className="glass glass-hover flex size-11 shrink-0 cursor-pointer items-center justify-center"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
            </div>

            {textoPasaje && (
              <>
                <button
                  type="button"
                  onClick={() => setVerTexto((v) => !v)}
                  aria-expanded={verTexto}
                  className="text-muted hover:text-foreground mt-2 inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-medium transition-colors duration-200"
                >
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform duration-200",
                      verTexto && "rotate-180",
                    )}
                    aria-hidden
                  />
                  {verTexto ? "Ocultar el texto" : "Ver el texto"}
                </button>
                {verTexto && (
                  <blockquote className="border-honey-500 mt-1 border-l-2 pl-4 xl:max-h-[55vh] xl:overflow-y-auto">
                    <p className="font-display text-lg leading-relaxed">
                      {textoPasaje}
                    </p>
                  </blockquote>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      <Card className="p-5 sm:p-6 xl:col-span-3">
        {/* Progreso conectado: la línea se llena hasta el paso en que vas. */}
        <ol className="mb-5 flex" aria-label="Progreso del devocional">
          {PASOS.map((p, i) => {
            const hecho = Boolean(valores[p.id]) && i !== paso;
            return (
              <li key={p.id} className="relative flex flex-1 flex-col items-center">
                {i < PASOS.length - 1 && (
                  <span
                    className={cn(
                      "absolute top-[21px] left-1/2 h-0.5 w-full transition-colors duration-300",
                      i < paso
                        ? "bg-honey-500"
                        : "bg-ink-700/15 dark:bg-white/15",
                    )}
                    aria-hidden
                  />
                )}
                <button
                  type="button"
                  onClick={() => irA(i)}
                  aria-current={i === paso ? "step" : undefined}
                  className="group relative z-10 flex cursor-pointer flex-col items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full border transition-colors duration-200",
                      i === paso
                        ? "bg-honey-300 text-ink-700 border-transparent"
                        : hecho
                          ? "border-emerald-600/40 bg-emerald-600/15 text-emerald-800 dark:text-emerald-300"
                          : "bg-background border-[var(--glass-border)] text-muted group-hover:text-foreground",
                    )}
                  >
                    {hecho ? (
                      <Check className="size-5" aria-hidden />
                    ) : (
                      <p.icono className="size-5" aria-hidden />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      i === paso ? "text-foreground" : "text-muted",
                    )}
                  >
                    {p.titulo}
                    {hecho && <span className="sr-only"> (con contenido)</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span id={`etiqueta-${actual.id}`} className="font-medium">
            {actual.titulo}
          </span>
          <p
            className="text-accent text-xs font-medium tracking-wide uppercase"
            aria-live="polite"
          >
            Paso {paso + 1} de {PASOS.length}
          </p>
        </div>
        <p className="text-muted mb-3 text-sm">{actual.ayuda}</p>

        {/* key: cada paso es un texto distinto, así que el editor se reinicia. */}
        <EditorEnriquecido
          key={actual.id}
          valor={contenido}
          limite={LIMITE}
          idEtiqueta={`etiqueta-${actual.id}`}
          placeholder="Escribe aquí…"
          onCaracteres={setCaracteres}
          onCambio={(md) => {
            setValores((v) => ({ ...v, [actual.id]: md }));
            marcarCambio();
          }}
        />

        <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
          <p className="text-muted min-h-4" aria-live="polite">
            {autoGuardando || pendiente
              ? "Guardando…"
              : guardado
                ? "Guardado"
                : "Cambios sin guardar"}
          </p>
          <p
            className={cn(
              "tabular-nums",
              cerca ? "font-medium text-amber-800 dark:text-amber-300" : "text-muted",
            )}
          >
            {caracteres.toLocaleString("es")} / {LIMITE.toLocaleString("es")}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => irA(Math.max(0, paso - 1))}
            disabled={paso === 0}
          >
            Atrás
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => guardar("guardar")}
              loading={pendiente}
              disabled={!pasaje.trim() || guardado || autoGuardando}
            >
              {guardado ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Save className="size-4" aria-hidden />
              )}
              {guardado ? "Guardado" : "Guardar"}
            </Button>
            {esUltimo ? (
              <Button
                onClick={() => guardar("terminar")}
                loading={pendiente}
                disabled={
                  !pasaje.trim() || !valores.oracion.trim() || autoGuardando
                }
              >
                Terminar devocional
              </Button>
            ) : (
              <Button
                onClick={() => guardar("seguir")}
                loading={pendiente}
                disabled={!pasaje.trim() || autoGuardando}
              >
                Siguiente
              </Button>
            )}
          </div>
        </div>

        <Mensaje error={error} />

        {completado && (
          <div
            role="status"
            className="border-ink-700/10 mt-5 rounded-2xl border bg-emerald-600/10 p-4 dark:border-white/10"
          >
            <p className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
              <Check className="size-5" aria-hidden />
              Devocional completo
            </p>
            <p className="text-muted mt-1 text-sm leading-relaxed">
              {esDeHoy
                ? "Cuenta para tu racha de hoy. Puedes seguir editándolo cuando quieras."
                : "Guardado. Es de otro día, así que no cambia tu racha de hoy."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/devocional/historial"
                className={buttonStyles({ variant: "secondary", size: "sm" })}
              >
                <List className="size-4" aria-hidden />
                Ver todos
              </Link>
              <Link
                href="/devocional/nuevo"
                className={buttonStyles({ variant: "ghost", size: "sm" })}
              >
                <Plus className="size-4" aria-hidden />
                Hacer otro
              </Link>
            </div>
          </div>
        )}
      </Card>

      <p className="text-muted px-2 text-sm leading-relaxed xl:col-span-5">
        {esDeHoy
          ? "Si cierras la app a mitad, vuelves donde quedaste. Cuenta para la racha porque incluye la sección Oración."
          : "Es un devocional de otro día: puedes terminarlo o cambiarlo, pero no cuenta para la racha de hoy."}
      </p>
    </div>
  );
}
