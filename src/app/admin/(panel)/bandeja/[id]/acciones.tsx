"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Hand, RotateCcw, Send, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import {
  agregarNotaMensaje,
  asignarMensaje,
  cambiarEstadoMensaje,
  responderMensaje,
} from "@/actions/admin";

export function AccionesMensaje({
  id,
  estado,
  asignadoA,
  miCorreo,
  correoDestino,
}: {
  id: string;
  estado: string;
  asignadoA: string | null;
  miCorreo: string;
  correoDestino: string;
}) {
  const router = useRouter();
  const [nota, setNota] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const correr = (
    fn: () => Promise<{ ok: boolean; error?: string }>,
    alTerminar?: () => void,
    mensajeOk?: string,
  ) =>
    iniciar(async () => {
      setError(null);
      setAviso(null);
      const r = await fn();
      if (r.ok) {
        alTerminar?.();
        if (mensajeOk) setAviso(mensajeOk);
        router.refresh();
      } else {
        setError(r.error ?? "Algo salió mal.");
      }
    });

  const loTengoYo = asignadoA === miCorreo;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {estado === "nuevo" && (
          <Button
            size="sm"
            variant="secondary"
            loading={pendiente}
            onClick={() => correr(() => cambiarEstadoMensaje(id, "en_curso"))}
          >
            Marcar en curso
          </Button>
        )}

        {estado !== "resuelto" ? (
          <Button
            size="sm"
            loading={pendiente}
            onClick={() => correr(() => cambiarEstadoMensaje(id, "resuelto"))}
          >
            <Check className="size-4" aria-hidden />
            Resolver
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            loading={pendiente}
            onClick={() => correr(() => cambiarEstadoMensaje(id, "en_curso"))}
          >
            <RotateCcw className="size-4" aria-hidden />
            Reabrir
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          loading={pendiente}
          onClick={() => correr(() => asignarMensaje(id, !loTengoYo))}
        >
          <Hand className="size-4" aria-hidden />
          {loTengoYo ? "Soltarlo" : "Tomarlo yo"}
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          correr(() => agregarNotaMensaje(id, nota), () => setNota(""), "Nota guardada.");
        }}
        className="border-ink-700/10 border-t pt-5 dark:border-white/10"
      >
        <Field
          htmlFor="nota"
          label="Nota interna"
          hint="Solo la ve el equipo, nunca la persona"
        >
          <Textarea
            id="nota"
            className="min-h-20"
            maxLength={2000}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </Field>
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          className="mt-3"
          loading={pendiente}
          disabled={!nota.trim()}
        >
          <StickyNote className="size-4" aria-hidden />
          Guardar nota
        </Button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!confirmando) {
            setConfirmando(true);
            return;
          }
          correr(
            () => responderMensaje(id, respuesta),
            () => {
              setRespuesta("");
              setConfirmando(false);
            },
            `Respuesta enviada a ${correoDestino}.`,
          );
        }}
        className="border-ink-700/10 border-t pt-5 dark:border-white/10"
      >
        <Field
          htmlFor="respuesta"
          label="Responder por correo"
          hint={`Se envía a ${correoDestino}`}
        >
          <Textarea
            id="respuesta"
            className="min-h-32"
            maxLength={4000}
            value={respuesta}
            onChange={(e) => {
              setRespuesta(e.target.value);
              setConfirmando(false);
            }}
          />
        </Field>

        {confirmando && (
          <p className="mt-3 rounded-2xl bg-amber-500/14 p-3 text-sm leading-relaxed">
            Esto sale por correo a <strong>{correoDestino}</strong> y no se puede
            retirar. ¿Está bien lo que dice?
          </p>
        )}

        <div className="mt-3 flex gap-2">
          <Button type="submit" size="sm" loading={pendiente} disabled={!respuesta.trim()}>
            <Send className="size-4" aria-hidden />
            {confirmando ? "Sí, enviar" : "Enviar respuesta"}
          </Button>
          {confirmando && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pendiente}
              onClick={() => setConfirmando(false)}
            >
              Revisar
            </Button>
          )}
        </div>
      </form>

      {aviso && (
        <p role="status" className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
          <Check className="size-4" aria-hidden />
          {aviso}
        </p>
      )}
      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
