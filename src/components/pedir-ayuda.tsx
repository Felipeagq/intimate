"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Check, LifeBuoy, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { enviarMensajeApp, enviarMensajePublico } from "@/actions/soporte";

const CATEGORIAS = [
  { valor: "ayuda", etiqueta: "Tengo una duda o un problema" },
  { valor: "reporte_abuso", etiqueta: "Quiero reportar un abuso o algo que me preocupa" },
  { valor: "eliminar_cuenta", etiqueta: "Quiero eliminar mi cuenta" },
  { valor: "otro", etiqueta: "Otro motivo" },
] as const;

const MINIMO = 10;
const MAXIMO = 4000;

/**
 * Formulario para escribirle al equipo.
 *
 * `sesion`: se usa desde Ajustes, y el mensaje sale con el correo de la
 * cuenta. `publico`: se usa desde /ayuda, para quien no puede entrar (por
 * ejemplo, con la cuenta suspendida), y pide el correo.
 */
export function PedirAyuda({
  modo,
  emailCuenta,
}: {
  modo: "sesion" | "publico";
  emailCuenta?: string;
}) {
  const [categoria, setCategoria] = useState<string>("ayuda");
  const [mensaje, setMensaje] = useState("");
  const [email, setEmail] = useState("");
  const [trampa, setTrampa] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    iniciar(async () => {
      setError(null);
      const r =
        modo === "sesion"
          ? await enviarMensajeApp(categoria, mensaje)
          : await enviarMensajePublico(email, categoria, mensaje, trampa);

      if (r.ok) setEnviado(true);
      else setError(r.error);
    });
  };

  if (enviado) {
    return (
      <div role="status" className="rounded-2xl bg-emerald-600/12 p-5">
        <p className="flex items-center gap-2 font-medium text-emerald-900 dark:text-emerald-200">
          <Check className="size-4" aria-hidden />
          Recibimos tu mensaje
        </p>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          Te responderemos al correo{" "}
          <strong className="text-foreground">
            {modo === "sesion" ? emailCuenta : email.trim().toLowerCase()}
          </strong>
          .{" "}
          {categoria === "reporte_abuso"
            ? "Los reportes de abuso se leen primero."
            : "Suele tardar un par de días."}
        </p>
      </div>
    );
  }

  const faltan = Math.max(0, MINIMO - mensaje.trim().length);

  return (
    <form onSubmit={enviar} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">¿Sobre qué es?</legend>
        <div className="space-y-2">
          {CATEGORIAS.map((c) => (
            <label
              key={c.valor}
              className={cn(
                "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm transition-colors duration-200",
                categoria === c.valor
                  ? "border-honey-500 bg-honey-300/25"
                  : "border-ink-700/12 hover:bg-white/50 dark:border-white/12 dark:hover:bg-white/6",
              )}
            >
              <input
                type="radio"
                name="categoria"
                value={c.valor}
                checked={categoria === c.valor}
                onChange={() => setCategoria(c.valor)}
                className="accent-honey-500 size-4 cursor-pointer"
              />
              {c.etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      {categoria === "reporte_abuso" && (
        <div className="rounded-2xl bg-amber-500/14 p-4 text-sm leading-relaxed">
          <p className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
            <ShieldAlert className="size-4 shrink-0" aria-hidden />
            Si estás en peligro ahora mismo
          </p>
          <p className="text-muted mt-1">
            Busca ayuda de emergencia en tu país. Este mensaje lo lee un equipo
            pequeño y <strong>no es un servicio de emergencia</strong>. Aun así,
            lo atendemos primero que todo lo demás.
          </p>
        </div>
      )}

      {modo === "publico" && (
        <>
          <Field
            htmlFor="ayuda-email"
            label="Tu correo"
            hint="Aquí te respondemos"
          >
            <Input
              id="ayuda-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </Field>

          {/* Trampa para robots: una persona no la ve ni la toca. */}
          <div
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
          >
            <label htmlFor="sitio_web">No rellenar</label>
            <input
              id="sitio_web"
              name="sitio_web"
              tabIndex={-1}
              autoComplete="off"
              value={trampa}
              onChange={(e) => setTrampa(e.target.value)}
            />
          </div>
        </>
      )}

      <Field htmlFor="ayuda-mensaje" label="Cuéntanos">
        <Textarea
          id="ayuda-mensaje"
          required
          maxLength={MAXIMO}
          className="min-h-36"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
        />
        <p className="text-muted mt-1.5 text-xs">
          {faltan > 0
            ? `Faltan ${faltan} caracteres como mínimo.`
            : `${mensaje.length} de ${MAXIMO}`}
        </p>
      </Field>

      <p className="text-muted text-xs leading-relaxed">
        Lo leerá el equipo de Intimate. Tus devocionales, promesas y demás
        notas <strong>nunca se adjuntan</strong>: el equipo solo ve lo que
        escribas aquí.
      </p>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <Button
        type="submit"
        loading={pendiente}
        disabled={mensaje.trim().length < MINIMO || (modo === "publico" && !email)}
      >
        <LifeBuoy className="size-4" aria-hidden />
        Enviar mensaje
      </Button>
    </form>
  );
}
