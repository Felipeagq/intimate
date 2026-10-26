"use client";

import { useState } from "react";
import { Copy, Clock, Share2, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

const CODIGO = "K7M2QX";

export function VincularView() {
  const [modo, setModo] = useState<"invitar" | "tengo">("invitar");
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(CODIGO);
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
            onClick={() => setModo(valor)}
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

      {modo === "invitar" ? (
        <Card className="p-7">
          <p className="text-muted text-sm">Tu código de invitación</p>
          <p className="font-[family-name:var(--font-display)] mt-3 text-5xl tracking-[0.2em]">
            {CODIGO}
          </p>

          <p className="text-muted mt-4 flex items-center gap-2 text-sm">
            <Clock className="size-4" aria-hidden />
            Caduca en 48 horas y sirve una sola vez.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={copiar}>
              {copiado ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
              {copiado ? "Copiado" : "Copiar código"}
            </Button>
            <Button variant="secondary">
              <Share2 className="size-4" aria-hidden />
              Compartir enlace
            </Button>
          </div>

          <p className="text-muted border-ink-700/10 mt-6 border-t pt-5 text-sm leading-relaxed dark:border-white/10">
            Cuando tu pareja lo acepte, se abre el espacio compartido: el
            devocional de los dos, los acuerdos y la racha de pareja. Cada
            persona puede estar en una sola pareja a la vez.
          </p>
        </Card>
      ) : (
        <Card className="p-7">
          <form>
            <Field
              htmlFor="codigo-pareja"
              label="Código de tu pareja"
              hint="Seis caracteres"
            >
              <Input
                id="codigo-pareja"
                maxLength={6}
                autoCapitalize="characters"
                placeholder="A1B2C3"
                className="text-center font-[family-name:var(--font-display)] text-2xl tracking-[0.3em] uppercase"
              />
            </Field>
            <Button type="submit" className="mt-4 w-full">
              Vincularnos
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
