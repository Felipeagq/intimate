"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Clock, Copy, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { cn, formatDate } from "@/lib/utils";
import { crearInvitacion, aceptarInvitacion } from "@/actions/app";

export function VincularView({
  yaHayInvitacion,
  expiraEn,
}: {
  yaHayInvitacion: boolean;
  expiraEn: string | null;
}) {
  const router = useRouter();
  const [modo, setModo] = useState<"invitar" | "tengo">("invitar");
  const [codigo, setCodigo] = useState<string | null>(null);
  const [caduca, setCaduca] = useState<string | null>(expiraEn);
  const [copiado, setCopiado] = useState(false);
  const [entrada, setEntrada] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const generar = () =>
    iniciar(async () => {
      setError(null);
      const r = await crearInvitacion();
      if (r.ok && r.datos) {
        setCodigo(r.datos.codigo);
        setCaduca(new Date(r.datos.expiraEn).toISOString());
      } else if (!r.ok) {
        setError(r.error);
      }
    });

  const aceptar = (e: React.FormEvent) => {
    e.preventDefault();
    iniciar(async () => {
      setError(null);
      const r = await aceptarInvitacion(entrada);
      if (r.ok) router.push("/pareja");
      else setError(r.error);
    });
  };

  const copiar = async () => {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin portapapeles el código sigue visible para escribirlo a mano.
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Espacio de pareja"
        title="Invita a tu pareja"
        description="Mientras tanto, la app funciona completa para ti. Nada de lo que escribas se pierde cuando se vinculen."
      />

      <div
        role="tablist"
        aria-label="Forma de vincularse"
        className="glass mb-5 inline-flex gap-1 p-1.5"
      >
        {(
          [
            ["invitar", "Enviar invitación"],
            ["tengo", "Tengo un código"],
          ] as const
        ).map(([valor, label]) => (
          <button
            key={valor}
            role="tab"
            aria-selected={modo === valor}
            onClick={() => {
              setModo(valor);
              setError(null);
            }}
            className={cn(
              "min-h-11 cursor-pointer rounded-2xl px-5 text-sm font-medium transition-colors duration-200",
              modo === valor
                ? "bg-honey-300 text-ink-700"
                : "text-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {modo === "invitar" ? (
        <Card className="p-7">
          {codigo ? (
            <>
              <p className="text-muted text-sm">Tu código de invitación</p>
              <p className="font-display mt-3 text-5xl tracking-[0.2em]">
                {codigo}
              </p>
              {caduca && (
                <p className="text-muted mt-4 flex items-center gap-2 text-sm">
                  <Clock className="size-4" aria-hidden />
                  Caduca el {formatDate(caduca, {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  y sirve una sola vez.
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={copiar}>
                  {copiado ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <Copy className="size-4" aria-hidden />
                  )}
                  {copiado ? "Copiado" : "Copiar código"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (navigator.share) {
                      navigator
                        .share({
                          title: "Intimate",
                          text: `Mi código para vincularnos en Intimate es ${codigo}`,
                        })
                        .catch(() => {});
                    }
                  }}
                >
                  <Share2 className="size-4" aria-hidden />
                  Compartir
                </Button>
              </div>

              <p className="text-muted border-ink-700/10 mt-6 border-t pt-5 text-sm leading-relaxed dark:border-white/10">
                Guárdalo ahora: por seguridad solo conservamos una huella del
                código, así que no podemos volver a mostrártelo. Si lo pierdes,
                genera uno nuevo.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl">
                {yaHayInvitacion
                  ? "Ya tienes una invitación activa"
                  : "Genera tu código"}
              </h2>
              <p className="text-muted mt-2 leading-relaxed">
                {yaHayInvitacion
                  ? "No podemos volver a mostrarte el código anterior. Si lo perdiste, genera uno nuevo: el viejo deja de servir."
                  : "Son seis caracteres, caducan en 48 horas y solo sirven una vez."}
              </p>
              <Button className="mt-6" onClick={generar} loading={pendiente}>
                {yaHayInvitacion ? "Generar uno nuevo" : "Generar código"}
              </Button>
            </>
          )}
        </Card>
      ) : (
        <Card className="p-7">
          <form onSubmit={aceptar}>
            <Field
              htmlFor="codigo-pareja"
              label="Código de tu pareja"
              hint="Seis caracteres"
            >
              <Input
                id="codigo-pareja"
                maxLength={6}
                required
                autoCapitalize="characters"
                value={entrada}
                onChange={(e) =>
                  setEntrada(
                    e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(),
                  )
                }
                placeholder="A1B2C3"
                className="text-center font-display text-2xl tracking-[0.3em] uppercase"
              />
            </Field>
            <Button
              type="submit"
              className="mt-4 w-full"
              loading={pendiente}
              disabled={entrada.length !== 6}
            >
              Vincularnos
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
