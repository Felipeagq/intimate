"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  Check,
  Compass,
  Heart,
  Lock,
  MessageCircleHeart,
  Plus,
  ScrollText,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { formatDate } from "@/lib/utils";
import {
  confirmarAcuerdo,
  crearAcuerdo,
  enviarAfirmacion,
  alternarFavorita,
  responderCheckin,
  completarTemaPlan,
} from "@/actions/app";

type Checkin = {
  semanaInicio: string;
  preguntas: string[];
  misRespuestas: string[] | null;
  respuestasPareja: string[] | null;
  yoRespondi: boolean;
  parejaRespondio: boolean;
  revelado: boolean;
};

type Plan = {
  semana: number;
  totalSemanas: number;
  temaActual: { slug: string; titulo: string; descripcion: string; preguntas: string[] };
  completados: string[];
  siguientes: string[];
};

type Acuerdo = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  proximaRevision: string | null;
  confirmadoPorMi: boolean;
  confirmadoPorAmbos: boolean;
};

type Plantilla = { titulo: string; descripcion: string; categoria: string };

type Afirmacion = {
  id: string;
  mensaje: string;
  favorita: boolean;
  mia: boolean;
  createdAt: string;
};

const TONO_ESTADO: Record<string, "success" | "warning" | "info" | "neutral"> = {
  vigente: "success",
  "en revisión": "warning",
  cumplido: "info",
};

export function PanelPareja({
  nombrePareja,
  checkin,
  plan,
  acuerdos,
  plantillas,
  afirmaciones,
}: {
  miId: string;
  nombrePareja: string;
  checkin: Checkin;
  plan: Plan;
  acuerdos: Acuerdo[];
  plantillas: Plantilla[];
  afirmaciones: Afirmacion[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const correr = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    iniciar(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Algo salió mal.");
    });

  return (
    <div className="space-y-4">
      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <BloqueCheckin
        checkin={checkin}
        nombrePareja={nombrePareja}
        pendiente={pendiente}
        correr={correr}
      />

      <BloquePlan plan={plan} pendiente={pendiente} correr={correr} />

      <BloqueAcuerdos
        acuerdos={acuerdos}
        plantillas={plantillas}
        nombrePareja={nombrePareja}
        pendiente={pendiente}
        correr={correr}
      />

      <BloqueAfirmaciones
        afirmaciones={afirmaciones}
        nombrePareja={nombrePareja}
        pendiente={pendiente}
        correr={correr}
      />
    </div>
  );
}

type Correr = (fn: () => Promise<{ ok: boolean; error?: string }>) => void;

function BloqueCheckin({
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

  return (
    <Card className="p-6">
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
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            correr(async () => {
              const r = await responderCheckin(respuestas);
              if (r.ok) setEditando(false);
              return r;
            });
          }}
        >
          {checkin.preguntas.map((pregunta, i) => (
            <Field key={pregunta} htmlFor={`q-${i}`} label={pregunta}>
              <Textarea
                id={`q-${i}`}
                required
                className="min-h-20"
                value={respuestas[i] ?? ""}
                onChange={(e) =>
                  setRespuestas((r) =>
                    r.map((v, j) => (j === i ? e.target.value : v)),
                  )
                }
              />
            </Field>
          ))}
          <Button type="submit" loading={pendiente}>
            Guardar mis respuestas
          </Button>
        </form>
      ) : (
        <div className="mt-5 space-y-5">
          {checkin.preguntas.map((pregunta, i) => (
            <div key={pregunta}>
              <p className="font-medium">{pregunta}</p>
              <p className="text-muted mt-1.5 text-sm leading-relaxed">
                <span className="text-foreground">Tú:</span>{" "}
                {checkin.misRespuestas?.[i]}
              </p>
              {checkin.revelado ? (
                <p className="text-muted mt-1 text-sm leading-relaxed">
                  <span className="text-foreground">{nombrePareja}:</span>{" "}
                  {checkin.respuestasPareja?.[i]}
                </p>
              ) : null}
            </div>
          ))}

          {!checkin.revelado && (
            <p className="text-muted flex items-center gap-2 text-sm">
              <Lock className="size-4" aria-hidden />
              Lo de {nombrePareja} se revela cuando responda.
            </p>
          )}

          <Button variant="ghost" size="sm" onClick={() => setEditando(true)}>
            Cambiar mis respuestas
          </Button>
        </div>
      )}
    </Card>
  );
}

function BloquePlan({
  plan,
  pendiente,
  correr,
}: {
  plan: Plan;
  pendiente: boolean;
  correr: Correr;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <Compass className="text-accent size-4" aria-hidden />
        <p className="text-muted text-xs tracking-wide uppercase">
          Conociéndonos a fondo
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl">{plan.temaActual.titulo}</h2>
          <p className="text-muted mt-1 text-sm">
            Semana {plan.semana} de {plan.totalSemanas} ·{" "}
            {plan.temaActual.descripcion}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setAbierto((v) => !v)}>
          {abierto ? "Cerrar" : "Abrir conversación"}
        </Button>
      </div>

      <div
        className="bg-ink-700/10 mt-5 h-2 overflow-hidden rounded-full dark:bg-white/12"
        role="progressbar"
        aria-valuenow={plan.completados.length}
        aria-valuemin={0}
        aria-valuemax={plan.totalSemanas}
        aria-label="Avance del plan"
      >
        <div
          className="bg-honey-500 h-full rounded-full transition-all duration-300"
          style={{
            width: `${(plan.completados.length / plan.totalSemanas) * 100}%`,
          }}
        />
      </div>

      {abierto && (
        <div className="border-ink-700/10 mt-5 border-t pt-5 dark:border-white/10">
          <ol className="space-y-3">
            {plan.temaActual.preguntas.map((p, i) => (
              <li key={p} className="flex gap-3">
                <span className="bg-honey-300 text-ink-700 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {i + 1}
                </span>
                <p className="leading-relaxed">{p}</p>
              </li>
            ))}
          </ol>
          <Button
            className="mt-5"
            loading={pendiente}
            onClick={() => correr(() => completarTemaPlan(plan.temaActual.slug))}
          >
            <Check className="size-4" aria-hidden />
            Ya lo conversamos
          </Button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {plan.completados.map((t) => (
          <Badge key={t} tone="neutral">
            <Check className="size-3" aria-hidden />
            {t}
          </Badge>
        ))}
        {plan.siguientes.slice(0, 3).map((t) => (
          <Badge key={t} tone="neutral" className="opacity-55">
            {t}
          </Badge>
        ))}
      </div>
    </Card>
  );
}

function BloqueAcuerdos({
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

  return (
    <>
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <ScrollText className="text-accent size-5" aria-hidden />
          <h2 className="text-2xl">Acuerdos</h2>
        </div>
        <Button
          size="sm"
          variant={formulario ? "ghost" : "secondary"}
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
              Nuevo
            </>
          )}
        </Button>
      </div>

      {formulario && (
        <Card className="p-6">
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
                className="glass glass-hover cursor-pointer px-3 py-2 text-xs font-medium"
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
            <Plus className="size-4" aria-hidden />
            Proponer el primero
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {acuerdos.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg">{a.titulo}</h3>
                  {a.descripcion && (
                    <p className="text-muted mt-1 leading-relaxed">
                      {a.descripcion}
                    </p>
                  )}
                </div>
                <Badge tone={TONO_ESTADO[a.estado] ?? "neutral"}>
                  {a.estado}
                </Badge>
              </div>

              <div className="border-ink-700/10 mt-4 flex flex-wrap items-center gap-3 border-t pt-4 text-xs dark:border-white/10">
                {a.confirmadoPorAmbos ? (
                  <span className="text-muted flex items-center gap-1.5">
                    <Check className="size-3.5" aria-hidden />
                    Confirmado por los dos
                  </span>
                ) : a.confirmadoPorMi ? (
                  <span className="font-medium text-amber-800 dark:text-amber-300">
                    Esperando que {nombrePareja} confirme
                  </span>
                ) : (
                  <Button
                    size="sm"
                    loading={pendiente}
                    onClick={() => correr(() => confirmarAcuerdo(a.id))}
                  >
                    <Check className="size-4" aria-hidden />
                    Confirmar
                  </Button>
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
      )}

      <p className="text-muted px-2 text-sm leading-relaxed">
        Cambiar un acuerdo vigente requiere que los dos lo confirmen de nuevo.
        Nada se modifica por una sola persona.
      </p>
    </>
  );
}

function BloqueAfirmaciones({
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

  return (
    <>
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <MessageCircleHeart className="text-accent size-5" aria-hidden />
          <h2 className="text-2xl">Palabras de afirmación</h2>
        </div>
        <Button
          size="sm"
          variant={formulario ? "ghost" : "primary"}
          onClick={() => setFormulario((v) => !v)}
        >
          {formulario ? "Cancelar" : "Escribir"}
        </Button>
      </div>

      {formulario && (
        <Card className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              correr(async () => {
                const r = await enviarAfirmacion(mensaje);
                if (r.ok) {
                  setMensaje("");
                  setFormulario(false);
                }
                return r;
              });
            }}
          >
            <Field
              htmlFor="afirmacion"
              label={`Para ${nombrePareja}`}
              hint="Algo concreto que viste esta semana"
            >
              <Textarea
                id="afirmacion"
                required
                maxLength={1000}
                className="min-h-24"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
              />
            </Field>
            <Button type="submit" className="mt-4" loading={pendiente}>
              Enviar
            </Button>
          </form>
        </Card>
      )}

      {afirmaciones.length === 0 && !formulario ? (
        <Card className="p-8 text-center">
          <MessageCircleHeart className="text-muted mx-auto size-6" aria-hidden />
          <p className="mt-3 font-medium">Nadie ha escrito todavía</p>
          <p className="text-muted mx-auto mt-2 max-w-sm text-sm leading-relaxed">
            Decir en voz alta lo que uno ve en el otro cuesta poco y pesa mucho.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {afirmaciones.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
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
                    className="cursor-pointer"
                  >
                    <Heart
                      className={
                        a.favorita
                          ? "text-accent size-4 fill-current"
                          : "text-muted size-4"
                      }
                    />
                  </button>
                )}
              </div>
              <p className="font-display mt-3 text-lg leading-relaxed">
                {a.mensaje}
              </p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
