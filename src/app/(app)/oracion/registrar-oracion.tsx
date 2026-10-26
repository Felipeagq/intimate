"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Check, Clock, HandHeart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { registrarOracion } from "@/actions/app";

export function RegistrarOracion({ yaRegistrado }: { yaRegistrado: boolean }) {
  const [registrado, setRegistrado] = useState(yaRegistrado);
  const [conMinutos, setConMinutos] = useState(false);
  const [minutos, setMinutos] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const registrar = (m?: number) =>
    iniciar(async () => {
      setError(null);
      const r = await registrarOracion(m);
      if (r.ok) {
        setRegistrado(true);
        setConMinutos(false);
      } else {
        setError(r.error);
      }
    });

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className={
              registrado
                ? "bg-honey-300 text-ink-700 flex size-14 shrink-0 items-center justify-center rounded-2xl"
                : "bg-ink-700/10 text-muted flex size-14 shrink-0 items-center justify-center rounded-2xl dark:bg-white/10"
            }
            aria-hidden
          >
            {registrado ? (
              <Check className="size-6" />
            ) : (
              <HandHeart className="size-6" />
            )}
          </span>
          <div>
            <p className="text-lg font-medium">
              {registrado ? "Hoy ya oraste" : "Hoy oré"}
            </p>
            <p className="text-muted text-sm">
              {registrado
                ? "Puedes añadir los minutos si quieres medirlos."
                : "Un toque. Si quieres, también puedes anotar los minutos."}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setConMinutos((v) => !v)}
            aria-expanded={conMinutos}
          >
            <Clock className="size-4" aria-hidden />
            Minutos
          </Button>
          {!registrado && (
            <Button onClick={() => registrar()} loading={pendiente}>
              Registrar
            </Button>
          )}
        </div>
      </div>

      {conMinutos && (
        <form
          className="border-ink-700/10 mt-5 flex flex-wrap items-end gap-3 border-t pt-5 dark:border-white/10"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(minutos);
            if (Number.isFinite(n) && n > 0) registrar(n);
          }}
        >
          <Field htmlFor="minutos" label="¿Cuántos minutos?" className="max-w-40">
            <Input
              id="minutos"
              type="number"
              min={1}
              max={600}
              value={minutos}
              onChange={(e) => setMinutos(e.target.value)}
              placeholder="20"
            />
          </Field>
          <Button type="submit" loading={pendiente} disabled={!minutos}>
            Guardar
          </Button>
        </form>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </Card>
  );
}
